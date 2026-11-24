/* Submission guard - stops a repeated save caused by double clicking.
 *
 * Rules this file must always keep, because it runs on every admin page:
 *
 *  1. Only the *repeat* of an action is blocked. The first click, submit or
 *     request is never touched, delayed or altered.
 *  2. Every lock is released by a timer. MAX_LOCK_MS is an absolute ceiling,
 *     so a control can never stay stuck even if a handler misbehaves.
 *  3. Request APIs are observed, never replaced in a way the caller can see:
 *     the original jqXHR / promise is returned untouched, errors included.
 *  4. A programmatic form.submit() is never refused. Pages call it from a
 *     confirmation dialog, one task after the submit event was cancelled, so
 *     refusing it would silently drop a save. It only marks controls busy.
 *  5. GET forms and GET requests are ignored. Repeating them sends no data.
 *  6. Controls keep their `disabled` property untouched, so a named submit
 *     button stays in the payload. Blocking happens in capture listeners.
 *  7. Every entry point is wrapped in try/catch. A bug in here must never
 *     stop a page from working.
 */
(function (window, document) {
    'use strict';

    if (!window || !document || window.SubmissionGuard) return;

    var MAX_LOCK_MS = 30000; // absolute ceiling - nothing stays locked past this
    var QUIET_MS = 1500;     // a submit that was cancelled and started no request
    var SETTLE_MS = 400;     // grace after the last observed request finished
    var BUSY_CLASS = 'submission-guard-busy';
    var CONTROLS = 'button, input[type="submit"], input[type="image"], a';
    var SAFE_METHODS = { GET: true, HEAD: true, OPTIONS: true };

    var nativeSubmit = window.HTMLFormElement.prototype.submit;
    var locks = new Map();
    // The lock that owns the task currently running. Requests started while it
    // is set are what tells us a click or a submit really sends something.
    var activeLock = null;

    function isFormElement(value) {
        return value instanceof window.HTMLFormElement;
    }

    function optedOut(element) {
        try {
            return !!(element && element.closest && element.closest('[data-submission-guard="off"]'));
        } catch (error) {
            return false;
        }
    }

    function formMethod(form, submitter) {
        var method = (submitter && submitter.getAttribute && submitter.getAttribute('formmethod'))
            || form.getAttribute('method')
            || 'get';
        return String(method).toLowerCase();
    }

    // GET forms and <form method="dialog"> send nothing that can be duplicated.
    function guardedForm(form, submitter) {
        if (!isFormElement(form) || optedOut(form)) return false;
        var method = formMethod(form, submitter);
        return method !== 'get' && method !== 'dialog';
    }

    function submitControls(form, submitter) {
        var controls = [];
        try {
            // form.elements also covers controls attached through form="id".
            Array.prototype.forEach.call(form.elements, function (control) {
                if (control.type === 'submit' || control.type === 'image') controls.push(control);
            });
        } catch (error) { /* a detached form has no elements */ }
        if (submitter) controls.push(submitter);
        return controls;
    }

    function paint(control) {
        control.setAttribute('aria-disabled', 'true');
        control.setAttribute('aria-busy', 'true');
        control.classList.add(BUSY_CLASS);
    }

    function unpaint(control, original) {
        if (original.ariaDisabled === null) control.removeAttribute('aria-disabled');
        else control.setAttribute('aria-disabled', original.ariaDisabled);
        if (original.ariaBusy === null) control.removeAttribute('aria-busy');
        else control.setAttribute('aria-busy', original.ariaBusy);
        if (!original.hadClass) control.classList.remove(BUSY_CLASS);
    }

    function lockFor(owner) {
        var existing = locks.get(owner);
        if (existing && !existing.released) return existing;
        var lock = {
            owner: owner,
            controls: new Set(),
            restore: new Map(),
            applied: false,
            released: false,
            explicit: false,
            navigating: false,
            pending: 0,
            softTimer: null,
            hardTimer: null
        };
        locks.set(owner, lock);
        return lock;
    }

    function addControls(lock, controls) {
        if (lock.released) return;
        controls.forEach(function (control) {
            if (!control || lock.controls.has(control)) return;
            lock.controls.add(control);
            lock.restore.set(control, {
                ariaDisabled: control.getAttribute('aria-disabled'),
                ariaBusy: control.getAttribute('aria-busy'),
                hadClass: control.classList.contains(BUSY_CLASS)
            });
            if (lock.applied) paint(control);
        });
    }

    function clearSoft(lock) {
        if (lock.softTimer !== null) {
            window.clearTimeout(lock.softTimer);
            lock.softTimer = null;
        }
    }

    function apply(lock) {
        if (lock.applied || lock.released) return lock;
        lock.applied = true;
        lock.controls.forEach(paint);
        // Rule 2: from this moment the lock has a guaranteed end.
        lock.hardTimer = window.setTimeout(function () { release(lock); }, MAX_LOCK_MS);
        return lock;
    }

    function hold(lock, milliseconds) {
        if (lock.released) return;
        clearSoft(lock);
        // An explicit token decides its own lifetime; only the ceiling applies.
        if (lock.explicit) return;
        // A submission the browser is acting on keeps the lock until navigation.
        var delay = lock.navigating ? MAX_LOCK_MS : milliseconds;
        lock.softTimer = window.setTimeout(function () { release(lock); }, delay);
    }

    function release(lock) {
        if (!lock || lock.released) return;
        lock.released = true;
        clearSoft(lock);
        if (lock.hardTimer !== null) {
            window.clearTimeout(lock.hardTimer);
            lock.hardTimer = null;
        }
        lock.restore.forEach(function (original, control) {
            try { unpaint(control, original); } catch (error) { /* control is gone */ }
        });
        lock.restore.clear();
        lock.controls.clear();
        if (locks.get(lock.owner) === lock) locks.delete(lock.owner);
        if (activeLock === lock) activeLock = null;
    }

    function discard(lock) {
        // A watched task that sent nothing: drop the lock without touching the DOM.
        if (lock.applied || lock.released) return;
        lock.released = true;
        clearSoft(lock);
        if (locks.get(lock.owner) === lock) locks.delete(lock.owner);
    }

    // Watch the rest of the current task. Requests started in it belong to this
    // lock; a lock that was never applied is dropped again when the task ends.
    function watch(lock) {
        activeLock = lock;
        window.setTimeout(function () {
            if (activeLock === lock) activeLock = null;
            if (!lock.applied) discard(lock);
        }, 0);
        return lock;
    }

    function block(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function isBusy(lock) {
        return !!(lock && lock.applied && !lock.released);
    }

    function lockedControl(control) {
        var busy = false;
        locks.forEach(function (lock) {
            if (!busy && isBusy(lock) && lock.controls.has(control)) busy = true;
        });
        return busy;
    }

    /* ---------------------------------------------------------------- forms */

    document.addEventListener('submit', function (event) {
        try {
            var form = event.target;
            if (!guardedForm(form, event.submitter)) return;

            if (isBusy(locks.get(form))) {
                block(event);
                return;
            }

            var lock = lockFor(form);
            addControls(lock, submitControls(form, event.submitter));
            apply(lock);
            watch(lock);

            // Decide the release policy once every other handler has run.
            window.setTimeout(function () {
                if (lock.released) return;
                if (!event.defaultPrevented) {
                    // Nothing cancelled it, so the browser is navigating away.
                    lock.navigating = true;
                    hold(lock, MAX_LOCK_MS);
                    return;
                }
                // Cancelled: either a request is running - the observer holds the
                // lock - or the handler only validated or opened a dialog.
                if (lock.pending === 0) hold(lock, QUIET_MS);
            }, 0);
        } catch (error) { /* rule 7 */ }
    }, true);

    /* --------------------------------------------------------------- clicks */

    document.addEventListener('click', function (event) {
        try {
            var target = event.target;
            var control = target && target.closest ? target.closest(CONTROLS) : null;
            if (!control || control.type === 'reset') return;

            if (lockedControl(control)) {
                block(event);
                return;
            }
            if (optedOut(control)) return;

            var isSubmitControl = control.type === 'submit' || control.type === 'image';
            var form = control.form;
            // A submit button acts on its form. Anything else owns only itself,
            // which keeps the other controls of that form usable.
            var owner = isSubmitControl && form && guardedForm(form, control) ? form : control;

            if (isBusy(locks.get(owner))) {
                block(event);
                return;
            }

            var lock = lockFor(owner);
            addControls(lock, owner === form ? submitControls(form, control) : [control]);
            // Deliberately not applied here: only a request started by this click
            // applies it, so buttons that search, filter or open a dialog are free.
            watch(lock);
        } catch (error) { /* rule 7 */ }
    }, true);

    /* ------------------------------------------------------------- requests */

    function requestStarted(method) {
        var lock = activeLock;
        if (!lock || lock.released) return null;
        if (SAFE_METHODS[String(method || 'GET').toUpperCase()]) return null;
        lock.pending += 1;
        apply(lock);
        clearSoft(lock);
        return lock;
    }

    function requestFinished(lock) {
        if (!lock || lock.released) return;
        lock.pending -= 1;
        if (lock.pending <= 0) {
            lock.pending = 0;
            hold(lock, SETTLE_MS);
        }
    }

    function observeJquery(jQuery) {
        if (observeJquery.done || !jQuery || !jQuery.fn) return;
        observeJquery.done = true;
        // Documented global events. jQuery itself is not modified.
        jQuery(document).ajaxSend(function (event, jqXHR, settings) {
            try {
                var lock = requestStarted(settings && settings.type);
                if (lock) jqXHR.always(function () { requestFinished(lock); });
            } catch (error) { /* rule 7 */ }
        });
    }

    observeJquery(window.jQuery);
    if (!observeJquery.done) {
        document.addEventListener('DOMContentLoaded', function () { observeJquery(window.jQuery); });
        window.addEventListener('load', function () { observeJquery(window.jQuery); });
    }

    if (typeof window.fetch === 'function') {
        var nativeFetch = window.fetch;
        window.fetch = function (resource, init) {
            var lock = null;
            try {
                var method = (init && init.method)
                    || (resource && typeof resource === 'object' && resource.method)
                    || 'GET';
                lock = requestStarted(method);
            } catch (error) { lock = null; }
            // Rule 3: the caller gets the original promise, untouched.
            // Unqualified fetch() calls arrive with no `this`; native fetch
            // wants the global object.
            var result = nativeFetch.apply(this || window, arguments);
            if (lock) {
                try {
                    result.then(function () { requestFinished(lock); }, function () { requestFinished(lock); });
                } catch (error) { requestFinished(lock); }
            }
            return result;
        };
    }

    /* -------------------------------------------------- programmatic submit */

    // form.submit() fires no submit event, so the listener above cannot see it.
    // Rule 4: this never refuses the call, it only marks controls busy so the
    // click that triggered it cannot trigger it a second time.
    window.HTMLFormElement.prototype.submit = function () {
        try {
            if (guardedForm(this, null)) {
                var clicked = activeLock;
                var lock = lockFor(this);
                addControls(lock, submitControls(this, null));
                apply(lock);
                lock.navigating = true;
                hold(lock, MAX_LOCK_MS);
                // The button that led here is usually a plain type="button", so it
                // is not one of the form's submit controls. Lock it as well.
                if (clicked && clicked !== lock && !clicked.released) {
                    apply(clicked);
                    clicked.navigating = true;
                    hold(clicked, MAX_LOCK_MS);
                }
            }
        } catch (error) { /* rule 7 */ }
        return nativeSubmit.apply(this, arguments);
    };

    /* ----------------------------------------------------------- navigation */

    window.addEventListener('pageshow', function (event) {
        // Returning through the back/forward cache restores a locked page.
        if (!event.persisted) return;
        Array.from(locks.values()).forEach(release);
    });

    /* --------------------------------------------------------- explicit API */

    // For handlers that know exactly when their work finished. It takes over the
    // automatic lock for the same owner instead of competing with it.
    function acquire(owner, extraControls) {
        try {
            if (!owner) return null;
            var current = locks.get(owner);
            if (current && current.explicit && !current.released) return null;

            var lock = lockFor(owner);
            addControls(lock, isFormElement(owner) ? submitControls(owner, null) : [owner]);
            if (extraControls) addControls(lock, Array.prototype.slice.call(extraControls));
            apply(lock);
            lock.explicit = true;
            clearSoft(lock);

            var submitted = false;
            return {
                controls: lock.controls,
                release: function () { release(lock); },
                submit: function () {
                    if (lock.released || submitted) return;
                    submitted = true;
                    try {
                        nativeSubmit.call(owner);
                    } catch (error) {
                        submitted = false;
                        release(lock);
                        throw error;
                    }
                }
            };
        } catch (error) {
            return null;
        }
    }

    window.SubmissionGuard = {
        acquire: acquire,
        // Exposed for tests and for a page that needs to unlock itself early.
        releaseAll: function () { Array.from(locks.values()).forEach(release); },
        isLocked: function (owner) { return isBusy(locks.get(owner)); }
    };
})(window, document);

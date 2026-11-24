// لوحة التحكم الجديدة (v2) — صفحة الدخول. بدون أي مكتبات خارجية.
(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- النموذج ---------------- */
    var form = document.getElementById('v2LoginForm');
    if (form) {
        var alertBox = document.getElementById('v2LoginAlert');
        var submitBtn = document.getElementById('v2LoginSubmit');
        var submitLabel = submitBtn.querySelector('.v2-btn__label') || submitBtn;
        var password = document.getElementById('v2Password');
        var toggle = document.getElementById('v2PasswordToggle');

        var showAlert = function (message, success) {
            alertBox.textContent = message;
            alertBox.classList.toggle('is-success', !!success);
            alertBox.hidden = false;
            // إعادة تشغيل حركة الظهور مع كل رسالة
            alertBox.style.animation = 'none';
            void alertBox.offsetWidth;
            alertBox.style.animation = '';
        };

        var shake = function () {
            form.classList.remove('is-shake');
            void form.offsetWidth;
            form.classList.add('is-shake');
        };

        var setBusy = function (busy) {
            submitBtn.disabled = busy;
            submitBtn.classList.toggle('is-busy', busy);
            submitLabel.textContent = busy ? form.dataset.labelSubmitting : form.dataset.labelSubmit;
        };

        var markInvalid = function (names) {
            ['login', 'password'].forEach(function (name) {
                var input = form.elements[name];
                var invalid = names.indexOf(name) !== -1;
                var box = input.closest('.v2-input');
                if (box) box.classList.toggle('is-invalid', invalid);
                input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
            });
        };

        /* ---- الخطوتان: المعرّف ثم طريقة الدخول (لا شيء يُرسل للخادم قبل الخطوة 2) ---- */
        var step1 = form.querySelector('[data-v2-step="1"]');
        var step2 = form.querySelector('[data-v2-step="2"]');
        var loginInput = form.elements.login;
        var activeTab = 'password';

        var identifierType = function (value) {
            if (value.indexOf('@') !== -1) return 'email';
            if (/^\+?[\d\s-]{8,}$/.test(value)) return 'phone';
            return 'username';
        };

        var showStep = function (n) {
            if (!step1) return;
            step1.hidden = n !== 1;
            step2.hidden = n !== 2;
            if (n === 2) {
                var value = loginInput.value.trim();
                var who = step2.querySelector('[data-v2-who]');
                var type = step2.querySelector('[data-v2-who-type]');
                who.textContent = value;
                step2.querySelector('[data-v2-who-avatar]').textContent = value.charAt(0).toUpperCase();
                type.textContent = type.getAttribute('data-type-' + identifierType(value));
                selectTab('password', false);
                password.focus();
            } else {
                loginInput.focus();
                loginInput.select();
            }
        };

        var selectTab = function (name, focusTab) {
            activeTab = name;
            form.querySelectorAll('[data-v2-tab]').forEach(function (tab) {
                var on = tab.getAttribute('data-v2-tab') === name;
                tab.classList.toggle('is-active', on);
                tab.setAttribute('aria-selected', on ? 'true' : 'false');
                tab.tabIndex = on ? 0 : -1;
                if (on && focusTab) tab.focus();
            });
            form.querySelectorAll('[data-v2-pane]').forEach(function (pane) {
                pane.hidden = pane.getAttribute('data-v2-pane') !== name;
            });
        };

        if (step1) {
            step2.querySelector('[data-v2-change]').addEventListener('click', function () {
                if (otp) otp.reset();
                alertBox.hidden = true;
                markInvalid([]);
                password.value = '';
                showStep(1);
            });
            form.querySelectorAll('[data-v2-tab]').forEach(function (tab) {
                tab.addEventListener('click', function () { selectTab(tab.getAttribute('data-v2-tab'), false); });
                // الأسهم تتنقل بين التبويبين (نمط tablist)
                tab.addEventListener('keydown', function (event) {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) return;
                    event.preventDefault();
                    selectTab(tab.getAttribute('data-v2-tab') === 'password' ? 'otp' : 'password', true);
                });
            });
        }

        var fail = function (message, fields) {
            setBusy(false);
            // خطأ في المعرّف وحده (فارغ مثلاً): مكانه الخطوة 1
            if (step1 && fields && fields.length === 1 && fields[0] === 'login') showStep(1);
            markInvalid(fields || []);
            showAlert(message);
            shake();
            var target = (fields || []).map(function (name) { return form.elements[name]; })
                .filter(function (el) { return el.type !== 'hidden'; })[0];
            if (target) target.focus();
        };

        var main = document.getElementById('v2LoginMain');
        var locked = document.getElementById('v2Locked');
        var timer = document.getElementById('v2LockedTimer');
        var lockTick = null;

        var stopped = document.getElementById('v2Stopped');
        if (stopped) {
            stopped.querySelector('[data-v2-stopped-back]').addEventListener('click', function () {
                stopped.hidden = true;
                main.hidden = false;
                alertBox.hidden = true;
                password.value = '';
                password.focus();
            });
        }

        var pad = function (n) { return (n < 10 ? '0' : '') + n; };

        var unlock = function () {
            clearInterval(lockTick);
            lockTick = null;
            if (locked) locked.hidden = true;
            if (main) main.hidden = false;
            markInvalid([]);
            showAlert(locked ? locked.dataset.msgOver : '', true);
            password.value = '';
            password.focus();
        };

        // يعرض شاشة القفل حتى نهاية المدة (بالثواني من الخادم)، ثم يرجع النموذج
        var lock = function (seconds) {
            if (!locked || !main) {
                fail(form.dataset.msgServer);
                return;
            }
            var endsAt = Date.now() + seconds * 1000;
            var paint = function () {
                var left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
                timer.textContent = pad(Math.floor(left / 60)) + ':' + pad(left % 60);
                if (left === 0) unlock();
            };
            main.hidden = true;
            locked.hidden = false;
            clearInterval(lockTick);
            paint();
            lockTick = setInterval(paint, 1000);
            var first = locked.querySelector('a');
            if (first) first.focus();
        };

        form.addEventListener('animationend', function (event) {
            if (event.animationName === 'v2-shake') form.classList.remove('is-shake');
        });

        ['login', 'password'].forEach(function (name) {
            form.elements[name].addEventListener('input', function () {
                var box = this.closest('.v2-input');
                if (box) box.classList.remove('is-invalid');
            });
        });

        if (toggle && password) {
            toggle.addEventListener('click', function () {
                var reveal = password.type === 'password';
                password.type = reveal ? 'text' : 'password';
                toggle.setAttribute('aria-pressed', reveal ? 'true' : 'false');
                toggle.setAttribute('aria-label', reveal ? toggle.dataset.labelHide : toggle.dataset.labelShow);
                password.focus();
            });
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            // الخطوة 1: «متابعة» تنقل للخطوة 2 فقط
            if (step1 && !step1.hidden) {
                if (loginInput.value.trim() === '') {
                    fail(form.dataset.msgIdentifier || form.dataset.msgRequired, ['login']);
                    return;
                }
                markInvalid([]);
                alertBox.hidden = true;
                showStep(2);
                return;
            }

            // تبويب الرمز: Enter يرسل الرمز أو يتحقق منه حسب المرحلة
            if (activeTab === 'otp') {
                if (otp) otp.enter();
                return;
            }
            if (activeTab !== 'password') return;

            var missing = ['login', 'password'].filter(function (name) {
                return form.elements[name].value.trim() === '';
            });

            if (missing.length) {
                fail(form.dataset.msgRequired, missing);
                return;
            }

            markInvalid([]);
            alertBox.hidden = true;
            setBusy(true);

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                return response.json().catch(function () { return null; }).then(function (body) {
                    return { status: response.status, body: body };
                });
            }).then(function (result) {
                var body = result.body;

                // المتحكم يرجع HTTP 200 دائماً والحالة الفعلية داخل الحقل code.
                if (result.status === 200 && body && body.code === 200 && body.data && body.data.url) {
                    submitBtn.classList.remove('is-busy');
                    submitBtn.classList.add('is-success');
                    submitLabel.textContent = body.message || form.dataset.msgSuccess;
                    setTimeout(function () { window.location.assign(body.data.url); }, reduceMotion ? 0 : 650);
                    return;
                }

                if (result.status === 422 && body && body.errors) {
                    fail(Object.keys(body.errors).map(function (key) { return body.errors[key][0]; }).join(' '), Object.keys(body.errors));
                    return;
                }

                if (result.status === 419) {
                    window.location.reload();
                    return;
                }

                // اشتراك المكتب منتهي وفترة السماح خلصت: شاشة login--suspended
                if (body && body.data && body.data.reason === 'subscription_ended' && body.data.url) {
                    window.location.assign(body.data.url);
                    return;
                }

                // حساب موقوف (كلمة المرور صحيحة لكن مدير النظام أوقفه): شاشة الحالة الموقوفة
                if (body && body.code === 403 && body.data && body.data.reason === 'suspended' && stopped && main) {
                    setBusy(false);
                    main.hidden = true;
                    stopped.hidden = false;
                    var back = stopped.querySelector('[data-v2-stopped-back]');
                    if (back) back.focus();
                    return;
                }

                // قفل مؤقت بعد محاولات خاطئة متتالية: شاشة القفل ومعها العدّ التنازلي
                if (result.status === 429 && body && body.data && body.data.retry_after) {
                    setBusy(false);
                    lock(body.data.retry_after);
                    return;
                }

                if (body && body.message && result.status < 500) {
                    // 401: بيانات خاطئة (رسالة واحدة لا تكشف وجود الحساب) — 402: كلمة مرور غلط عند تأكيد الانتقال
                    var fields = body.code === 401 ? (step1 ? ['password'] : ['login', 'password']) : body.code === 402 ? ['password'] : [];
                    // رسالة الصفحة نفسها، ومعها جملة المحاولات المتبقية قبل القفل من الخادم
                    var own = form.getAttribute('data-msg-' + body.code);
                    var left = body.data && body.data.remaining_message;
                    fail(own ? (left ? own + ' ' + left : own) : body.message, fields);
                    return;
                }

                fail(form.dataset.msgServer);
            }).catch(function () {
                fail(form.dataset.msgNetwork);
            });
        });

        /* ---- الدخول برمز لمرة واحدة (AdminLoginOtp): إرسال، إدخال 6 أرقام، عدّاد، بريد بدل الجوال ---- */
        var otpPane = document.getElementById('v2PaneOtp');
        var otp = null;
        if (otpPane) {
            var stageRequest = otpPane.querySelector('[data-otp-stage="request"]');
            var stageEnter = otpPane.querySelector('[data-otp-stage="enter"]');
            var digits = Array.prototype.slice.call(otpPane.querySelectorAll('[data-otp-digit]'));
            var digitsBox = otpPane.querySelector('.v2-otp');
            var verifyBtn = otpPane.querySelector('[data-otp-verify]');
            var timerWrap = otpPane.querySelector('[data-otp-timer-wrap]');
            var timerEl = otpPane.querySelector('[data-otp-timer]');
            var resendBtn = otpPane.querySelector('[data-otp-resend]');
            var switchBtn = otpPane.querySelector('[data-otp-switch]');
            var demo = otpPane.querySelector('[data-otp-demo]');
            var channel = 'sms';
            var tick = null;
            var token = form.querySelector('[name="_token"]').value;
            // «تذكرني» في تبويب كلمة المرور يسري على الدخول بالرمز كمان (يبقى داخل على الجوال والكمبيوتر)
            var remember = function () {
                var box = form.querySelector('[name="rememberme"]');
                return box && box.checked ? '1' : '0';
            };

            var post = function (url, data) {
                var body = new FormData();
                body.append('_token', token);
                Object.keys(data).forEach(function (key) { body.append(key, data[key]); });
                return fetch(url, { method: 'POST', body: body, credentials: 'same-origin', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
                    .then(function (response) {
                        return response.json().catch(function () { return null; }).then(function (json) { return { status: response.status, body: json }; });
                    });
            };
            var firstError = function (body) {
                if (body && body.errors) { var k = Object.keys(body.errors)[0]; return body.errors[k][0]; }
                return body && body.message;
            };
            var busy = function (btn, on, label) {
                btn.disabled = on;
                btn.classList.toggle('is-busy', on);
                var l = btn.querySelector('.v2-btn__label');
                if (l && label) l.textContent = label;
            };
            var code = function () { return digits.map(function (d) { return d.value; }).join(''); };
            var clearDigits = function () { digits.forEach(function (d) { d.value = ''; }); digitsBox.classList.remove('is-invalid'); };
            var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

            var countdown = function (seconds) {
                clearInterval(tick);
                var endsAt = Date.now() + seconds * 1000;
                resendBtn.hidden = true;
                timerWrap.hidden = false;
                var paint = function () {
                    var left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
                    timerEl.textContent = pad2(Math.floor(left / 60)) + ':' + pad2(left % 60);
                    if (left === 0) { clearInterval(tick); timerWrap.hidden = true; resendBtn.hidden = false; }
                };
                paint();
                tick = setInterval(paint, 1000);
            };

            var showStage = function (name) {
                stageRequest.hidden = name !== 'request';
                stageEnter.hidden = name !== 'enter';
            };

            var send = function (via, btn) {
                channel = via;
                alertBox.hidden = true;
                var sendBtn = stageRequest.querySelector('[data-otp-send="sms"]');
                if (btn === sendBtn) busy(sendBtn, true, otpPane.dataset.labelSending);
                post(otpPane.dataset.sendUrl, { login: loginInput.value.trim(), channel: via }).then(function (result) {
                    if (btn === sendBtn) busy(sendBtn, false, otpPane.dataset.labelSend);
                    var body = result.body;
                    if (result.status === 419) { window.location.reload(); return; }
                    if (result.status !== 200 || !body || !body.data) {
                        showAlert(firstError(body) || form.dataset.msgServer);
                        return;
                    }
                    otpPane.querySelector('[data-otp-masked]').textContent = body.data.masked;
                    switchBtn.textContent = via === 'email' ? otpPane.dataset.labelToSms : otpPane.dataset.labelToEmail;
                    if (demo) {
                        demo.hidden = !body.data.debug_code;
                        demo.querySelector('[data-otp-demo-code]').textContent = body.data.debug_code || '';
                    }
                    showAlert(body.message, true);
                    clearDigits();
                    showStage('enter');
                    countdown(body.data.resend_after || 60);
                    digits[0].focus();
                }).catch(function () {
                    if (btn === sendBtn) busy(sendBtn, false, otpPane.dataset.labelSend);
                    showAlert(form.dataset.msgNetwork);
                });
            };

            var verify = function () {
                if (!/^\d{6}$/.test(code())) {
                    digitsBox.classList.add('is-invalid');
                    showAlert(otpPane.dataset.msgIncomplete);
                    var empty = digits.filter(function (d) { return d.value === ''; })[0];
                    (empty || digits[0]).focus();
                    return;
                }
                alertBox.hidden = true;
                busy(verifyBtn, true);
                post(otpPane.dataset.verifyUrl, { login: loginInput.value.trim(), code: code(), rememberme: remember() }).then(function (result) {
                    var body = result.body;
                    if (result.status === 200 && body && body.code === 200 && body.data && body.data.url) {
                        verifyBtn.classList.remove('is-busy');
                        verifyBtn.classList.add('is-success');
                        setTimeout(function () { window.location.assign(body.data.url); }, reduceMotion ? 0 : 650);
                        return;
                    }
                    busy(verifyBtn, false);
                    if (result.status === 419) { window.location.reload(); return; }
                    if (body && body.code === 403 && body.data && body.data.reason === 'suspended' && stopped && main) {
                        main.hidden = true;
                        stopped.hidden = false;
                        return;
                    }
                    // حساب بصلاحيات عليا: الرمز وحده لا يكفي — يرجع لتبويب كلمة المرور ومعه السبب
                    if (body && body.data && body.data.use_password) {
                        clearDigits();
                        selectTab('password', false);
                        showAlert(firstError(body) || body.message);
                        password.focus();
                        return;
                    }
                    digitsBox.classList.add('is-invalid');
                    showAlert(firstError(body) || form.dataset.msgServer);
                    shake();
                    clearDigits();
                    digits[0].focus();
                    // الرمز اتلغى (استنفد المحاولات): يطلب رمزاً جديداً
                    if (body && body.data && body.data.remaining === 0) { resendBtn.hidden = false; timerWrap.hidden = true; clearInterval(tick); }
                }).catch(function () {
                    busy(verifyBtn, false);
                    showAlert(form.dataset.msgNetwork);
                });
            };

            digits.forEach(function (input, index) {
                input.addEventListener('input', function () {
                    var value = input.value.replace(/\D/g, '');
                    if (value.length > 1) {
                        // لصق الرمز كاملاً في خانة واحدة
                        value.split('').slice(0, digits.length - index).forEach(function (ch, k) { digits[index + k].value = ch; });
                    } else {
                        input.value = value;
                    }
                    digitsBox.classList.remove('is-invalid');
                    var next = digits[Math.min(index + Math.max(1, value.length), digits.length - 1)];
                    if (value && next) next.focus();
                    if (/^\d{6}$/.test(code())) verify();
                });
                input.addEventListener('keydown', function (event) {
                    if (event.key === 'Backspace' && input.value === '' && index > 0) { digits[index - 1].focus(); digits[index - 1].value = ''; }
                    if (event.key === 'ArrowLeft' && index > 0) digits[index - 1].focus();
                    if (event.key === 'ArrowRight' && index < digits.length - 1) digits[index + 1].focus();
                });
            });

            stageRequest.querySelectorAll('[data-otp-send]').forEach(function (btn) {
                btn.addEventListener('click', function () { send(btn.getAttribute('data-otp-send'), btn); });
            });
            resendBtn.addEventListener('click', function () { send(channel, resendBtn); });
            switchBtn.addEventListener('click', function () { send(channel === 'email' ? 'sms' : 'email', switchBtn); });
            var waBtn = otpPane.querySelector('[data-otp-whatsapp]');
            if (waBtn) waBtn.addEventListener('click', function () { send('whatsapp', waBtn); });
            otpPane.querySelector('[data-otp-change]').addEventListener('click', function () {
                clearInterval(tick);
                alertBox.hidden = true;
                showStage('request');
                showStep(1);
            });
            verifyBtn.addEventListener('click', verify);

            otp = {
                enter: function () { if (stageEnter.hidden) send('sms', stageRequest.querySelector('[data-otp-send="sms"]')); else verify(); },
                reset: function () { clearInterval(tick); showStage('request'); clearDigits(); }
            };
        }
    }

    /* ---------------- الواجهة المتحركة ---------------- */
    var stage = document.querySelector('.v2-stage');
    if (!stage || reduceMotion) return;

    var stageVisible = function () { return stage.offsetParent !== null && !document.hidden; };

    // رحلة العقد: تتقدّم مرحلة كل ثانية ونصف ثم تبدأ من جديد
    var track = stage.querySelector('.v2-journey__track');
    if (track) {
        var stages = track.querySelectorAll('.v2-journey__stage');
        var step = 0;
        var paint = function () {
            track.style.setProperty('--step', step);
            stages.forEach(function (el, i) {
                el.classList.toggle('is-done', i <= step);
                el.classList.toggle('is-current', i === step);
            });
        };
        paint();
        setInterval(function () {
            if (!stageVisible()) return;
            step = step >= stages.length - 1 ? 0 : step + 1;
            paint();
        }, 1500);
    }

    // الإشعارات المتتابعة
    var toastItems = stage.querySelectorAll('.v2-toast__item');
    if (toastItems.length > 1) {
        var current = 0;
        setInterval(function () {
            if (!stageVisible()) return;
            var leaving = toastItems[current];
            current = (current + 1) % toastItems.length;
            leaving.classList.remove('is-active');
            leaving.classList.add('is-leaving');
            toastItems[current].classList.remove('is-leaving');
            toastItems[current].classList.add('is-active');
            setTimeout(function () { leaving.classList.remove('is-leaving'); }, 750);
        }, 3200);
    }

    // جزيئات متصلة خفيفة
    var canvas = document.getElementById('v2Particles');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    var dots = [];
    var width = 0;
    var height = 0;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);

    var resize = function () {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        var count = Math.round(Math.min(60, (width * height) / 16000));
        dots = [];
        for (var i = 0; i < count; i++) {
            dots.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.4 + 0.6
            });
        }
    };

    var frame = function () {
        requestAnimationFrame(frame);
        if (!stageVisible() || !width) return;

        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > width) d.vx *= -1;
            if (d.y < 0 || d.y > height) d.vy *= -1;

            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(22, 35, 63, 0.28)';
            ctx.fill();

            for (var j = i + 1; j < dots.length; j++) {
                var e = dots[j];
                var dx = d.x - e.x;
                var dy = d.y - e.y;
                var dist = dx * dx + dy * dy;
                if (dist < 13000) {
                    ctx.beginPath();
                    ctx.moveTo(d.x, d.y);
                    ctx.lineTo(e.x, e.y);
                    ctx.strokeStyle = 'rgba(22, 35, 63, ' + (0.1 * (1 - dist / 13000)) + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
})();

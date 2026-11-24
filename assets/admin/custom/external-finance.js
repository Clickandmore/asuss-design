(function () {
    const initializeOfficeFinanceModal = () => {
        const dataElement = document.getElementById('office-finance-contracts');
        let officeContracts = {};

        if (dataElement) {
            try {
                officeContracts = JSON.parse(dataElement.textContent || '{}');
            } catch (error) {
                console.error('فشل في قراءة بيانات المستحقات للمكاتب:', error);
                officeContracts = {};
            }
        }

        const modalElement = document.getElementById('officeFinanceModal');
        if (!modalElement) {
            return;
        }

        const tableBody = modalElement.querySelector('#officeFinanceModalTableBody');
        const titleEl = modalElement.querySelector('#officeFinanceModalTitle');
        const subtitleEl = modalElement.querySelector('#officeFinanceModalSubtitle');
        const contractsCountEl = modalElement.querySelector('#officeFinanceContractsCount');
        const statsOfficeDueEl = modalElement.querySelector('#officeFinanceStatsOfficeDue');
        const statsCompanyEscapeEl = modalElement.querySelector('#officeFinanceStatsCompanyEscape');
        const statsCompanyDeportEl = modalElement.querySelector('#officeFinanceStatsCompanyDeport');
        const statsNetEl = modalElement.querySelector('#officeFinanceStatsNet');
        const statsNetHintEl = modalElement.querySelector('#officeFinanceStatsNetHint');
        const printBtn = modalElement.querySelector('#officeFinancePrintBtn');
        const printableWrapper = modalElement.querySelector('#officeFinancePrintable');
        const printableTitleEl = modalElement.querySelector('#officeFinancePrintableTitle');
        const printableSubtitleEl = modalElement.querySelector('#officeFinancePrintableSubtitle');
        const printableContractsEl = modalElement.querySelector('#officeFinancePrintableContractsCount');
        const formatter = new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const bootstrapModal = window.bootstrap ? new window.bootstrap.Modal(modalElement) : null;

        const formatCurrency = (value) => {
            const numericValue = parseFloat(value || 0);
            return `${formatter.format(numericValue)} ريال`;
        };

        const formatOfficeCurrency = (value) => {
            const numericValue = parseFloat(value || 0);
            return `-${formatter.format(Math.abs(numericValue))} ريال`;
        };

        const formatCompanyCurrency = (value) => {
            const numericValue = parseFloat(value || 0);
            return `+${formatter.format(Math.abs(numericValue))} ريال`;
        };

        const formatNetCurrency = (value) => {
            const numericValue = parseFloat(value || 0);
            const sign = numericValue >= 0 ? '+' : '-';
            return `${sign}${formatter.format(Math.abs(numericValue))} ريال`;
        };

        const populateTable = (contracts) => {
            if (!contracts.length) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد عقود مرتبطة حالياً.</td></tr>';
                return;
            }

            const rows = contracts
                .map((contract, index) => {
                    const dueTypes = (contract.due_types || []).join('، ');
                    const customer = contract.customer_name || '-';
                    const maidName = contract.maid_name || '-';
                    const arrival = contract.arrival_date || '-';
                    const statusLabel = contract.status_label || contract.status || '-';

                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>#${contract.contract_id}</td>
                            <td>${customer}</td>
                            <td>${maidName}</td>
                            <td class="fw-semibold">${formatCurrency(contract.amount)}</td>
                            <td>${dueTypes || '-'}</td>
                            <td>${arrival}</td>
                            <td>${statusLabel}</td>
                        </tr>
                    `;
                })
                .join('');

            tableBody.innerHTML = rows;
        };

        const updateSummary = (meta) => {
            titleEl.textContent = meta.name;
            subtitleEl.textContent = meta.nationality ? `الجنسية: ${meta.nationality}` : '';
            contractsCountEl.textContent = meta.contractsCount;

            if (printableTitleEl) {
                printableTitleEl.textContent = meta.name;
            }
            if (printableSubtitleEl) {
                printableSubtitleEl.textContent = meta.nationality ? `الجنسية: ${meta.nationality}` : '';
            }
            if (printableContractsEl) {
                printableContractsEl.textContent = meta.contractsCount;
            }

            statsOfficeDueEl.textContent = formatOfficeCurrency(meta.officeDue);
            statsCompanyEscapeEl.textContent = formatCompanyCurrency(meta.companyEscape);
            statsCompanyDeportEl.textContent = formatCompanyCurrency(meta.companyDeport);

            statsNetEl.textContent = formatNetCurrency(meta.netBalance);
            statsNetEl.classList.remove('text-success', 'text-danger');
            statsNetEl.classList.add(meta.netBalance >= 0 ? 'text-success' : 'text-danger');
            if (statsNetHintEl) {
                statsNetHintEl.textContent = meta.netBalance >= 0
                    ? 'رصيد على المكتب لصالح الشركة'
                    : 'رصيد مستحق للمكتب على الشركة';
            }
        };

        const handlePrint = () => {
            if (!printableWrapper) {
                return;
            }

            const reportWindow = window.open('', '_blank', 'width=1200,height=800');
            if (!reportWindow) {
                return;
            }

            const doc = reportWindow.document;
            doc.open();
            doc.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' +
                (titleEl.textContent || 'تقرير المستحقات') +
                '</title></head><body></body></html>');
            doc.close();

            const styleElement = doc.createElement('style');
            styleElement.textContent = "body { font-family: 'Tajawal', 'Cairo', sans-serif; margin: 24px; direction: rtl; text-align: right; }" +
                'table { border-collapse: collapse; width: 100%; margin-top: 16px; }' +
                'table th, table td { border: 1px solid #dcdcdc; padding: 8px; font-size: 13px; }' +
                '.summary-card { border: 1px solid #e4e4e4; border-radius: 10px; padding: 12px; margin-bottom: 12px; }' +
                '.text-muted { color: #6c757d; font-size: 12px; }' +
                '.fw-semibold { font-weight: 600; }' +
                '.fs-5 { font-size: 1.25rem; }' +
                '.fs-6 { font-size: 1rem; }' +
                '.text-success { color: #16a34a; }' +
                '.text-danger { color: #dc2626; }';
            doc.head.appendChild(styleElement);

            const printableClone = printableWrapper.cloneNode(true);
            doc.body.innerHTML = printableClone.innerHTML;

            reportWindow.focus();
            reportWindow.print();
        };

        document.querySelectorAll('.office-details-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const officeId = button.getAttribute('data-office-id');
                const contracts = officeContracts[officeId] || [];
                const meta = {
                    name: button.getAttribute('data-office-name') || 'مكتب غير معروف',
                    nationality: button.getAttribute('data-office-nationality') || '',
                    officeDue: button.getAttribute('data-office-due') || 0,
                    companyDue: button.getAttribute('data-company-due') || 0,
                    companyEscape: button.getAttribute('data-company-escape') || 0,
                    companyDeport: button.getAttribute('data-company-deportation') || 0,
                    netBalance: button.getAttribute('data-net-balance') || 0,
                    contractsCount: button.getAttribute('data-contracts-count') || contracts.length,
                };

                updateSummary(meta);
                populateTable(contracts);
                if (bootstrapModal) {
                    bootstrapModal.show();
                }
            });
        });

        if (printBtn) {
            printBtn.addEventListener('click', handlePrint);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOfficeFinanceModal);
    } else {
        initializeOfficeFinanceModal();
    }
})();

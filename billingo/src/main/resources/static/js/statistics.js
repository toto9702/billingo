// ✅ Csak akkor fut le, ha a Chart.js betöltődött
function initializeStatisticsModule() {
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js nem elérhető a statistics.js számára!');
        return;
    }

    const STATISTICS_API_URL = 'http://localhost:8080/lesson/statistics';

    let currentView = 'yearly';
    let statisticsChart = null;

    window.initializeStatistics = function() {
        populateYearSelect();
        showYearlyStats();
    };

    function populateYearSelect() {
        const yearSelect = document.getElementById('year-select');
        if (!yearSelect) {
            console.warn('year-select elem nem található');
            return;
        }

        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';

        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}`;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
    }

    window.showYearlyStats = function() {
        currentView = 'yearly';

        const yearlyBtn = document.getElementById('yearly-btn');
        const monthlyBtn = document.getElementById('monthly-btn');
        const monthSelect = document.getElementById('month-select');

        if (yearlyBtn) yearlyBtn.classList.add('active');
        if (monthlyBtn) monthlyBtn.classList.remove('active');
        if (monthSelect) monthSelect.style.display = 'none';

        loadStatistics();
    };

    window.showMonthlyStats = function() {
        currentView = 'monthly';

        const monthlyBtn = document.getElementById('monthly-btn');
        const yearlyBtn = document.getElementById('yearly-btn');
        const monthSelect = document.getElementById('month-select');

        if (monthlyBtn) monthlyBtn.classList.add('active');
        if (yearlyBtn) yearlyBtn.classList.remove('active');

        if (monthSelect) {
            monthSelect.style.display = 'block';
            monthSelect.value = new Date().getMonth() + 1;
        }

        loadStatistics();
    };

    window.loadStatistics = async function() {
        const yearSelect = document.getElementById('year-select');
        if (!yearSelect) {
            console.warn('year-select elem nem található');
            return;
        }

        const year = yearSelect.value;
        if (!year) {
            console.warn('Év nincs kiválasztva');
            return;
        }

        try {
            let data;

            if (currentView === 'yearly') {
                const response = await fetch(`${STATISTICS_API_URL}/yearly?year=${year}`);
                if (!response.ok) throw new Error('Hiba az adatok lekérése során');
                data = await response.json();
                renderYearlyChart(data, year);
            } else {
                const monthSelect = document.getElementById('month-select');
                const month = monthSelect ? monthSelect.value : new Date().getMonth() + 1;

                const response = await fetch(`${STATISTICS_API_URL}/monthly?year=${year}&month=${month}`);
                if (!response.ok) throw new Error('Hiba az adatok lekérése során');
                data = await response.json();
                renderMonthlyChart(data, year, month);
            }

            updateSummary(data);

        } catch (error) {
            console.error('Hiba:', error);
            showNotification('Hiba a statisztikák betöltése során!', 'error');
        }
    };

    function updateSummary(data) {
        const summaryElement = document.getElementById('statistics-summary');
        if (!summaryElement) return;

        const totalRetained = data.reduce((sum, item) => sum + item.retainedAmount, 0);
        const totalNotRetained = data.reduce((sum, item) => sum + item.notRetainedAmount, 0);
        const totalAmount = totalRetained + totalNotRetained;

        summaryElement.innerHTML = `
            <div class="summary-card retained">
                <div class="summary-label">Megtartott órák</div>
                <div class="summary-value">${formatCurrency(totalRetained)}</div>
            </div>
            <div class="summary-card not-retained">
                <div class="summary-label">Nem megtartott órák</div>
                <div class="summary-value">${formatCurrency(totalNotRetained)}</div>
            </div>
            <div class="summary-card total">
                <div class="summary-label">Összes bevétel</div>
                <div class="summary-value">${formatCurrency(totalAmount)}</div>
            </div>
        `;
    }

    function renderYearlyChart(data, year) {
        const labels = data.map(item => item.label);
        const retainedData = data.map(item => item.retainedAmount);
        const notRetainedData = data.map(item => item.notRetainedAmount);

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Megtartott órák',
                        data: retainedData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                    },
                    {
                        label: 'Nem megtartott órák',
                        data: notRetainedData,
                        backgroundColor: 'rgba(251, 191, 36, 0.8)',
                        borderColor: 'rgba(251, 191, 36, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${year} évi bevételek hónaponként`,
                        font: { size: 18, weight: 'bold' },
                        color: '#1F2937'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 14, weight: '600' },
                            color: '#374151',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 25000,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        };

        destroyChart();
        const canvas = document.getElementById('statistics-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            statisticsChart = new Chart(ctx, config);
        }
    }

    function renderMonthlyChart(data, year, month) {
        const monthNames = [
            'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
            'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
        ];

        const labels = data.map(item => item.label);
        const retainedData = data.map(item => item.retainedAmount);
        const notRetainedData = data.map(item => item.notRetainedAmount);

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Megtartott órák',
                        data: retainedData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                    },
                    {
                        label: 'Nem megtartott órák',
                        data: notRetainedData,
                        backgroundColor: 'rgba(251, 191, 36, 0.8)',
                        borderColor: 'rgba(251, 191, 36, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${year} ${monthNames[month - 1]} - Bevételek diákonként`,
                        font: { size: 18, weight: 'bold' },
                        color: '#1F2937'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5000,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        };

        destroyChart();
        const canvas = document.getElementById('statistics-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            statisticsChart = new Chart(ctx, config);
        }
    }

    function destroyChart() {
        if (statisticsChart) {
            statisticsChart.destroy();
            statisticsChart = null;
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: 'HUF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: ${type === 'success' ? '#D1FAE5' : '#FEE2E2'};
            color: ${type === 'success' ? '#065F46' : '#991B1B'};
            font-weight: 600;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    console.log('✅ Statistics modul inicializálva');
}

// ✅ Inicializálás amikor a script betöltődik
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStatisticsModule);
} else {
    initializeStatisticsModule();
}

const API_BASE_URL = 'http://localhost:8080/partner';

let allPartners = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Billingo Számlázó alkalmazás inicializálva');

    const saveForm = document.getElementById('saveForm');
    const updateForm = document.getElementById('updateForm');
    const updateEmail = document.getElementById('update-currentEmail');

    if (saveForm) {
        saveForm.addEventListener('submit', handleSave);
    }

    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdate);
    }

    if (updateEmail) {
        updateEmail.addEventListener('change', loadPartnerDataByEmail);
    }

    setupMobileMenu();
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    clearMessages();

    if (sectionId === 'list') {
        loadPartners();
    } else if (sectionId === 'update') {
        loadPartnerEmails();
    } else if (sectionId === 'calendar') {
        initializeCalendar();
    } else if (sectionId === 'statistics') {
        setTimeout(() => {
            if (typeof window.loadStatistics === 'function') {
                window.loadStatistics();
            } else {
                console.error('loadStatistics függvény nem elérhető');
            }
        }, 100);
    }
}

async function loadPartnerEmails() {
    const selectElement = document.getElementById('update-currentEmail');

    if (!selectElement) {
        console.error('update-currentEmail elem nem található');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/emails`);

        if (response.ok) {
            const emails = await response.json();

            selectElement.innerHTML = '<option value="">-- Válasszon email címet --</option>';
            emails.forEach(email => {
                const option = document.createElement('option');
                option.value = email;
                option.textContent = email;
                selectElement.appendChild(option);
            });
        } else {
            console.error('Hiba az email-ek betöltése során');
        }
    } catch (error) {
        console.error('Hiba:', error);
    }
}

async function loadPartnerDataByEmail() {
    const email = document.getElementById('update-currentEmail').value;

    if (!email) {
        document.getElementById('updateForm').reset();
        document.getElementById('update-currentEmail').value = '';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/list`);

        if (response.ok) {
            const partners = await response.json();
            const partner = partners.find(p => p.email === email);

            if (partner) {
                document.getElementById('update-name').value = partner.name;
                document.getElementById('update-email').value = partner.email;
                document.getElementById('update-postalCode').value = partner.postalCode;
                document.getElementById('update-city').value = partner.city;
                document.getElementById('update-address').value = partner.address;
                document.getElementById('update-taxCode').value = partner.taxCode || '';
                document.getElementById('update-studentNames').value = partner.studentNames.join(', ');
                document.getElementById('update-price').value = partner.price;
                document.getElementById('update-isActive').checked = partner.isActive;
            }
        }
    } catch (error) {
        console.error('Hiba:', error);
    }
}

async function handleSave(e) {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('save-message');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!validateForm(form)) {
        return;
    }

    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        postalCode: formData.get('postalCode'),
        city: formData.get('city'),
        address: formData.get('address'),
        taxCode: formData.get('taxCode') || null,
        studentNames: formData.get('studentNames').split(',').map(name => name.trim()),
        price: parseInt(formData.get('price')),
        isActive: formData.get('isActive') === 'on'
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Mentés...';

    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage(messageDiv, 'Partner sikeresen mentve!', 'success');
            form.reset();
            clearFormErrors(form);
        } else {
            const errorData = await response.json();
            handleValidationErrors(form, errorData);
            showMessage(messageDiv, 'Kérjük javítsa a hibákat!', 'error');
        }
    } catch (error) {
        console.error('Hiba:', error);
        showMessage(messageDiv, 'Hálózati hiba történt!', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Mentés';
    }
}

async function handleUpdate(e) {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('update-message');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!validateForm(form)) {
        return;
    }

    const formData = new FormData(form);
    const currentEmail = formData.get('currentEmail');

    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        postalCode: formData.get('postalCode'),
        city: formData.get('city'),
        address: formData.get('address'),
        taxCode: formData.get('taxCode') || null,
        studentNames: formData.get('studentNames').split(',').map(name => name.trim()),
        price: parseInt(formData.get('price')),
        isActive: formData.get('isActive') === 'on'
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Frissítés...';

    try {
        const response = await fetch(`${API_BASE_URL}/update/${encodeURIComponent(currentEmail)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage(messageDiv, 'Partner sikeresen frissítve!', 'success');
            loadPartnerEmails();
        } else {
            const errorData = await response.json();
            if (errorData.error) {
                showMessage(messageDiv, errorData.error || errorData.message, 'error');
            } else {
                handleValidationErrors(form, errorData);
                showMessage(messageDiv, 'Kérjük javítsa a hibákat!', 'error');
            }
        }
    } catch (error) {
        console.error('Hiba:', error);
        showMessage(messageDiv, 'Hálózati hiba történt!', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🔄 Frissítés';
    }
}

async function loadPartners() {
    const listDiv = document.getElementById('partners-list');
    const messageDiv = document.getElementById('list-message');

    if (!listDiv) {
        console.error('partners-list elem nem található');
        return;
    }

    listDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="loading" style="width: 40px; height: 40px;"></span></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/list`);

        if (response.ok) {
            allPartners = await response.json();
            displayPartners(allPartners);

            if (allPartners.length === 0) {
                showMessage(messageDiv, 'Még nincsenek partnerek az adatbázisban.', 'error');
            }
        } else {
            showMessage(messageDiv, 'Hiba történt a partnerek betöltése során!', 'error');
            listDiv.innerHTML = '';
        }
    } catch (error) {
        console.error('Hiba:', error);
        showMessage(messageDiv, 'Hálózati hiba történt!', 'error');
        listDiv.innerHTML = '';
    }
}

function displayPartners(partners) {
    const listDiv = document.getElementById('partners-list');

    if (!listDiv) {
        console.error('partners-list elem nem található');
        return;
    }

    if (partners.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; color: #6B7280;">Nincs megjeleníthető partner.</p>';
        return;
    }

    listDiv.innerHTML = partners.map(partner => `
        <div class="partner-card">
            <h3>${escapeHtml(partner.name)}</h3>
            <div class="partner-info">
                <div class="info-row">
                    <span class="info-label">📧 Email:</span>
                    <span class="info-value">${escapeHtml(partner.email)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📍 Cím:</span>
                    <span class="info-value">${partner.postalCode} ${escapeHtml(partner.city)}, ${escapeHtml(partner.address)}</span>
                </div>
                ${partner.taxCode ? `
                <div class="info-row">
                    <span class="info-label">🏢 Adószám:</span>
                    <span class="info-value">${escapeHtml(partner.taxCode)}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">💰 Ár:</span>
                    <span class="info-value">${partner.price.toLocaleString('hu-HU')} Ft</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📊 Státusz:</span>
                    <span class="status-badge ${partner.isActive ? 'status-active' : 'status-inactive'}">
                        ${partner.isActive ? '✅ Aktív' : '❌ Inaktív'}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">👨‍🎓 Hallgatók:</span>
                </div>
                <div class="student-tags">
                    ${partner.studentNames.map(name => `<span class="student-tag">${escapeHtml(name)}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function filterPartners() {
    const searchInput = document.getElementById('search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();

    const filtered = allPartners.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm) ||
        partner.email.toLowerCase().includes(searchTerm)
    );

    displayPartners(filtered);
}

function validateForm(form) {
    let isValid = true;
    clearFormErrors(form);

    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Ez a mező kötelező');
            isValid = false;
        }
    });

    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            showFieldError(field, 'Érvénytelen email formátum');
            isValid = false;
        }
    });

    const postalCodeFields = form.querySelectorAll('input[name="postalCode"]');
    postalCodeFields.forEach(field => {
        if (field.value && !/^\d{4}$/.test(field.value)) {
            showFieldError(field, 'Az irányítószám pontosan 4 számjegyből kell álljon');
            isValid = false;
        }
    });

    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(field, message) {
    field.classList.add('error');
    const errorSpan = field.parentElement.querySelector('.error-message');
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

function clearFormErrors(form) {
    form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
    form.querySelectorAll('.error-message').forEach(span => {
        span.textContent = '';
    });
}

function handleValidationErrors(form, errors) {
    Object.keys(errors).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            showFieldError(field, errors[fieldName]);
        }
    });
}

function showMessage(messageDiv, text, type) {
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function clearMessages() {
    document.querySelectorAll('.message').forEach(msg => {
        msg.style.display = 'none';
    });
}

function setupMobileMenu() {
    const dropdown = document.querySelector('.dropdown');
    if (dropdown && window.innerWidth <= 768) {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

window.addEventListener('resize', () => {
    setupMobileMenu();
});

// ========== STATISTICS MODUL ==========
(function() {
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js nem elérhető!');
        return;
    }

    const STATISTICS_API_URL = 'http://localhost:8080/lesson/statistics';
    let currentView = 'yearly';
    let statisticsChart = null;

    // ✅ GLOBÁLIS FÜGGVÉNYEK
    window.initializeStatistics = function() {
        populateYearSelect();
        showYearlyStats();
    };

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
        if (!yearSelect) return;

        const year = yearSelect.value;
        if (!year) return;

        try {
            let data;

            if (currentView === 'yearly') {
                const response = await fetch(`${STATISTICS_API_URL}/yearly?year=${year}`);
                if (!response.ok) throw new Error('Hiba');
                data = await response.json();
                renderYearlyChart(data, year);
            } else {
                const monthSelect = document.getElementById('month-select');
                const month = monthSelect ? monthSelect.value : new Date().getMonth() + 1;

                const response = await fetch(`${STATISTICS_API_URL}/monthly?year=${year}&month=${month}`);
                if (!response.ok) throw new Error('Hiba');
                data = await response.json();
                renderMonthlyChart(data, year, month);
            }

            updateSummary(data);
        } catch (error) {
            console.error('Hiba:', error);
        }
    };

    function populateYearSelect() {
        const yearSelect = document.getElementById('year-select');
        if (!yearSelect) return;

        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';

        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}`;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }

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
                labels,
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
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        };

        destroyChart();
        const canvas = document.getElementById('statistics-chart');
        if (canvas) statisticsChart = new Chart(canvas.getContext('2d'), config);
    }

    function renderMonthlyChart(data, year, month) {
        const monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
        const labels = data.map(item => item.label);
        const retainedData = data.map(item => item.retainedAmount);
        const notRetainedData = data.map(item => item.notRetainedAmount);

        const config = {
            type: 'bar',
            data: {
                labels,
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        };

        destroyChart();
        const canvas = document.getElementById('statistics-chart');
        if (canvas) statisticsChart = new Chart(canvas.getContext('2d'), config);
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

    console.log('✅ Statistics modul betöltve');
})();

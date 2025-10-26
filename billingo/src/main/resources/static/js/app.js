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

const SESSION_KEY = 'urban-style-session';
const ORDER_KEY = 'urban-style-order-id';
const REVIEWS_KEY = 'urban-style-reviews';
const profileText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
};

function createSessionId() {
    if (crypto.randomUUID) return crypto.randomUUID(); // si existe crypto.randomUUID, lo usa directamente
    const bytes = new Uint8Array(16); // sino lo crea manualmente (funcion de stackoverflow, pero es basicamente a partir de bytes aleatorios usar un iterador que pase de byte a string y luego unirlos).
    crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function startAnalytics() {
    const measurementId = document.querySelector('meta[name="analytics-id"]')?.content.trim();
    if (!/^G-[A-Z0-9]+$/.test(measurementId || '')) return;
}

function loadDashboard() {
    const serializedProfile = sessionStorage.getItem(SESSION_KEY);
    if (!serializedProfile) {
        window.location.replace('login.html');
        return;
    }

    let profile;
    try {
        profile = JSON.parse(serializedProfile);
    } catch {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('login.html');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const username = (params.get('usuario') || params.get('user') || 'Invitado').trim() || 'Invitado';
    const role = (params.get('rol') || 'Cliente').trim() || 'Cliente';
    const email = String(profile.email || '').trim().toLowerCase();
    const [emailUser = '', emailDomain = ''] = email.split('@', 2);
    const customerDigits = String(profile.customerId || '0').replace(/\D/g, '').slice(-6);
    const customerId = customerDigits.padStart(6, '0');
    const nickname = String(profile.nickname || '').trim() || 'Cliente VIP';
    const membership = String(profile.membership || '').trim() || 'Básica';
    const giftClothes = profile.giftClothes ?? 2;
    const sessionId = sessionStorage.getItem('urban-style-diagnostic-id') || createSessionId();
    sessionStorage.setItem('urban-style-diagnostic-id', sessionId);
    profile.nickname = nickname;
    profile.membership = membership;
    profile.giftClothes = giftClothes;
    profile.customerId = customerId;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));

    profileText('user-name', username);
    profileText('user-role', role);
    profileText('email', email || 'No disponible');
    profileText('email-user', emailUser);
    profileText('email-domain', emailDomain);
    profileText('customer-id', customerId);
    profileText('nickname', nickname);
    profileText('membership', membership);
    profileText('gift-clothes', String(giftClothes));
    profileText('browser-language', navigator.language || 'No disponible');
    profileText('session-id', sessionId);
    profileText('current-date', new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'full'
    }).format(new Date()));

    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.hidden = false;

    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('urban-style-diagnostic-id');
        window.location.assign('login.html');
    });

    updateConnectionStatus();
    setupPurchase();
    setupFlashOffer();
    setupReviews(username);
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    startAnalytics();
}

function setupFlashOffer() {
    const button = document.getElementById('flash-button');
    const countdown = document.getElementById('flash-countdown');
    const status = document.getElementById('flash-status');
    let intervalId = null;
    let remainingSeconds = 15;

    button.addEventListener('click', () => {
        if (intervalId !== null) return;

        remainingSeconds = 15;
        countdown.textContent = String(remainingSeconds);
        status.textContent = 'La oferta está en marcha.';
        button.disabled = true;
        intervalId = window.setInterval(() => {
            remainingSeconds -= 1;
            countdown.textContent = String(remainingSeconds);

            if (remainingSeconds === 0) {
                window.clearInterval(intervalId);
                intervalId = null;
                button.disabled = false;
                status.textContent = 'La oferta ha expirado.';
            }
        }, 1000);
    });
}

function readReviews() {
    try {
        const serializedReviews = localStorage.getItem(REVIEWS_KEY);
        if (!serializedReviews) return [];
        const reviews = JSON.parse(serializedReviews);
        if (!Array.isArray(reviews)) return [];
        return reviews.filter((review) => review
            && typeof review.id === 'string'
            && typeof review.username === 'string'
            && typeof review.publishedAt === 'string'
            && typeof review.comment === 'string');
    } catch {
        return [];
    }
}

function renderReviews(reviews) {
    const list = document.getElementById('review-list');
    list.replaceChildren();

    reviews.forEach((review) => {
        const item = document.createElement('li');
        const heading = document.createElement('div');
        const username = document.createElement('strong');
        const publishedAt = document.createElement('time');
        const comment = document.createElement('p');
        const date = new Date(review.publishedAt);

        item.className = 'review-item';
        heading.className = 'review-meta';
        username.textContent = review.username;
        publishedAt.dateTime = review.publishedAt;
        publishedAt.textContent = Number.isNaN(date.getTime())
            ? 'Fecha no disponible'
            : new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
        comment.textContent = review.comment;
        heading.append(username, publishedAt);
        item.append(heading, comment);
        list.append(item);
    });
}

function setupReviews(username) {
    const form = document.getElementById('review-form');
    const commentInput = document.getElementById('review-comment');
    const status = document.getElementById('review-status');
    const reviews = readReviews();
    renderReviews(reviews);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const comment = commentInput.value.trim();
        if (!comment) return;

        const now = new Date();
        const review = {
            id: String(now.getTime()),
            username,
            publishedAt: now.toISOString(),
            comment
        };
        reviews.unshift(review);

        try {
            localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
            renderReviews(reviews);
            form.reset();
            status.textContent = 'Reseña publicada.';
        } catch {
            reviews.shift();
            status.textContent = 'No se pudo guardar la reseña en este navegador.';
        }
    });
}

function updateConnectionStatus() {
    profileText('internet-status', navigator.onLine ? 'Online' : 'Offline');
}

function parseEuroAmount(value) {
    const match = String(value).match(/^\s*(\d+(?:[.,]\d{1,2})?)\s*€?\s*$/);
    if (!match) return null;
    const amount = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) return null;
    const cents = Math.round(amount * 100);
    return Number.isSafeInteger(cents) ? cents : null;
}

function updatePurchaseSummary() {
    const currency = new Intl.NumberFormat(navigator.language || 'es-ES', {
        style: 'currency',
        currency: 'EUR'
    });
    const selectedProducts = [...document.querySelectorAll('.product-checkbox:checked')];
    const productPrices = selectedProducts.map((product) => parseEuroAmount(product.value));
    const coupon = parseEuroAmount(document.getElementById('coupon').value);
    const subtotal = productPrices.every(Number.isSafeInteger)
        ? productPrices.reduce((sum, price) => sum + price, 0)
        : null;
    const error = document.getElementById('purchase-error');
    const confirmButton = document.getElementById('confirm-order');
    const isValid = Number.isSafeInteger(subtotal) && Number.isSafeInteger(coupon);

    error.hidden = isValid;
    error.textContent = isValid ? '' : 'Revisa los precios y el importe del cupón.';
    confirmButton.disabled = !isValid || subtotal <= 0;
    if (!isValid) {
        ['subtotal', 'discount', 'vat', 'total'].forEach((id) => profileText(id, '—'));
        return null;
    }

    const discount = Math.min(coupon, subtotal);
    const taxableAmount = subtotal - discount;
    const vat = Math.round(taxableAmount * 0.21);
    const total = taxableAmount + vat;
    profileText('subtotal', currency.format(subtotal / 100));
    profileText('discount', `−${currency.format(discount / 100)}`);
    profileText('vat', currency.format(vat / 100));
    profileText('total', currency.format(total / 100));
    return { subtotal, discount, vat, total };
}

function setupPurchase() {
    const storedOrderId = Number(sessionStorage.getItem(ORDER_KEY) || 1000);
    const orderId = Number.isSafeInteger(storedOrderId) && storedOrderId >= 0 ? storedOrderId : 1000;
    profileText('order-id', String(orderId));
    document.querySelectorAll('.product-checkbox').forEach((product) => {
        product.addEventListener('change', updatePurchaseSummary);
    });
    document.getElementById('coupon').addEventListener('input', updatePurchaseSummary);
    document.getElementById('confirm-order').addEventListener('click', () => {
        if (!updatePurchaseSummary()) return;
        const nextOrderId = Number(document.getElementById('order-id').textContent) + 1;
        sessionStorage.setItem(ORDER_KEY, String(nextOrderId));
        profileText('order-id', String(nextOrderId));
        const confirmation = document.getElementById('order-confirmation');
        confirmation.textContent = `Pedido #${nextOrderId} confirmado.`;
        confirmation.hidden = false;
    });
    updatePurchaseSummary();
}

loadDashboard();
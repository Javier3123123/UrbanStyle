const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('form-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

if (sessionStorage.getItem('urban-style-session')) {
    window.location.replace('index.html');
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = String(emailInput.value || '').trim().toLowerCase();
    const password = String(passwordInput.value || '');

    // Basic form validation
    if (!email) {
        errorMessage.textContent = 'Por favor, ingresa tu correo electrónico.';
        emailInput.focus();
        return;
    }

    if (!password) {
        errorMessage.textContent = 'Por favor, ingresa tu contraseña.';
        passwordInput.focus();
        return;
    }

    if (!isValidEmail(email)) {
        errorMessage.textContent = 'El correo electrónico no es válido.';
        emailInput.focus();
        return;
    }

    // Simulate login process
    setTimeout(() => {
        const profile = {
            email,
            customerId: String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
            nickname: '',
            membership: '',
            giftClothes: 2
        };
        sessionStorage.setItem('urban-style-session', JSON.stringify(profile));
        window.location.assign('index.html');
    }, 1000); // Simulating network delay
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

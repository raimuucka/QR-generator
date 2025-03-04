document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const token = localStorage.getItem('token');

    if (token && window.location.pathname === '/index.html') {
        window.location.href = '/dashboard.html';
    }

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard.html';
            } else {
                messageDiv.textContent = data.message;
            }
        });
    }

    // Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value;

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, passwordConfirm }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard.html';
            } else {
                messageDiv.textContent = data.message;
            }
        });
    }

    // Forgot Password
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            messageDiv.textContent = data.message;
        });
    }

    // Reset Password
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value;
            const token = window.location.pathname.split('/').pop();

            const res = await fetch(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, passwordConfirm }),
            });
            const data = await res.json();

            if (res.ok) {
                messageDiv.textContent = 'Password reset successfully. Redirecting...';
                setTimeout(() => (window.location.href = '/index.html'), 2000);
            } else {
                messageDiv.textContent = data.message;
            }
        });
    }
});
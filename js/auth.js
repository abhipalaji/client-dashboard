import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { showToast, toggleButtonState } from './ui.js';

// =========================================================================
// 1. Password-Based Sign In
// =========================================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = document.getElementById('login-btn');

        toggleButtonState(btn, true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('Logged in successfully!', 'success');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
            toggleButtonState(btn, false, 'Sign in');
        }
    });
}

// =========================================================================
// 2. Interactive Sign Up Engine
// =========================================================================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const btn = document.getElementById('signup-btn');

        toggleButtonState(btn, true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast('Account created successfully!', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = 'Email already registered.';
            if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
            showToast(msg, 'error');
            toggleButtonState(btn, false, 'Create Account');
        }
    });
}

// =========================================================================
// 3. Live-Adaptive Passkey Login
// =========================================================================
const passkeyLoginBtn = document.getElementById('btn-passkey-login');
if (passkeyLoginBtn) {
    passkeyLoginBtn.addEventListener('click', async () => {
        if (!window.PublicKeyCredential) {
            showToast('Passkeys are unavailable on this browser.', 'error');
            return;
        }

        const savedCredId = localStorage.getItem('codecrest_passkey_credential_id');
        if (!savedCredId) {
            showToast('No passkey linked yet. Log in with a password first.', 'error');
            return;
        }

        toggleButtonState(passkeyLoginBtn, true);
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            const rawIdBuffer = Uint8Array.from(atob(savedCredId), c => c.charCodeAt(0));

            const options = {
                challenge: challenge,
                timeout: 60000,
                rpId: window.location.hostname, // Securely matches active domain
                allowCredentials: [{ id: rawIdBuffer, type: 'public-key' }],
                userVerification: "preferred"
            };

            const assertion = await navigator.credentials.get({ publicKey: options });
            if (assertion) {
                showToast('Biometric access authorized!', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            }
        } catch (error) {
            console.error(error);
            showToast('Verification rejected or timed out.', 'error');
            toggleButtonState(passkeyLoginBtn, false, 'Sign in with Passkey');
        }
    });
}

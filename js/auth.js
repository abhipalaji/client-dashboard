import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { showToast, toggleButtonState } from './ui.js';

// =========================================================================
// 1. Classic Sign In Handler
// =========================================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        // Stop the browser from reloading the page instantly
        e.preventDefault(); 

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const btn = document.getElementById('login-btn');

        if (!emailInput || !passwordInput) {
            showToast("Form inputs missing. Check your HTML IDs.", "error");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        toggleButtonState(btn, true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('Logged in successfully!', 'success');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Login failed:", error);
            showToast(error.message, 'error');
            toggleButtonState(btn, false, 'Sign in');
        }
    });
}

// =========================================================================
// 2. Interactive Sign Up Handler (Saves new emails to Firebase)
// =========================================================================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        // Stop the browser from reloading the page instantly
        e.preventDefault(); 

        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const btn = document.getElementById('signup-btn');

        if (!emailInput || !passwordInput) {
            showToast("Form inputs missing. Check your HTML IDs.", "error");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        toggleButtonState(btn, true);

        try {
            // This natively registers the new email inside Firebase Authentication console
            await createUserWithEmailAndPassword(auth, email, password);
            
            showToast('Account created successfully!', 'success');
            
            // Short delay to allow session sync before moving to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1200);

        } catch (error) {
            console.error("Signup failed:", error);
            
            let clearErrorMessage = "Registration failed. Please check your inputs.";
            if (error.code === 'auth/email-already-in-use') {
                clearErrorMessage = 'This email address is already registered.';
            } else if (error.code === 'auth/invalid-email') {
                clearErrorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                clearErrorMessage = 'Password is too weak. Use at least 6 characters.';
            } else {
                clearErrorMessage = error.message;
            }

            showToast(clearErrorMessage, 'error');
            toggleButtonState(btn, false, 'Create Account');
        }
    });
}
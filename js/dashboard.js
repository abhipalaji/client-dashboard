import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { showToast, toggleButtonState } from './ui.js';

let currentUserInstance = null;

// Track active User Auth Sessions
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserInstance = user;
        const displayEl = document.getElementById('user-name-display');
        if (displayEl) displayEl.textContent = user.email.split('@')[0];
        loadUserProjects(user.uid);
    } else {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});

// =========================================================================
// Passkey Creation Handshake (Fires correctly locally and on Vercel)
// =========================================================================
const registerPasskeyBtn = document.getElementById('btn-register-passkey');
if (registerPasskeyBtn) {
    registerPasskeyBtn.addEventListener('click', async () => {
        if (!window.PublicKeyCredential) {
            showToast('Passkeys unavailable here.', 'error');
            return;
        }
        toggleButtonState(registerPasskeyBtn, true);
        try {
            const uidStr = currentUserInstance ? currentUserInstance.uid : "localuser123";
            const emailStr = currentUserInstance ? currentUserInstance.email : "user@codecrest.com";
            
            const enc = new TextEncoder();
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options = {
                challenge: challenge,
                rp: { name: "CodeCrest Dashboard", id: window.location.hostname }, // Adapts dynamically
                user: { id: enc.encode(uidStr), name: emailStr, displayName: emailStr },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                timeout: 60000,
                authenticatorSelection: { userVerification: "preferred" }
            };

            const credential = await navigator.credentials.create({ publicKey: options });
            if (credential) {
                const base64Id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
                localStorage.setItem('codecrest_passkey_credential_id', base64Id);
                showToast('Passkey linked successfully!', 'success');
                registerPasskeyBtn.textContent = '🔒 Passkey Active';
                registerPasskeyBtn.disabled = true;
                registerPasskeyBtn.className = "inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl text-green-700 bg-green-50 border border-green-200 cursor-not-allowed shrink-0";
            }
        } catch (error) {
            console.error(error);
            showToast('Setup canceled or device registration rejected.', 'error');
            toggleButtonState(registerPasskeyBtn, false, 'Link Device Passkey');
        }
    });
}

// =========================================================================
// Secure Data Submission Engine (Firestore Injection)
// =========================================================================
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserInstance) {
            showToast("Session expired. Log in again.", "error");
            return;
        }

        const name = document.getElementById('project-name').value;
        const type = document.getElementById('project-type').value;
        const desc = document.getElementById('project-description').value;
        const budget = document.getElementById('project-budget').value;
        const submitBtn = document.getElementById('submit-project-btn');

        toggleButtonState(submitBtn, true);
        try {
            await addDoc(collection(db, "projects"), {
                projectName: name,
                projectType: type,
                projectDescription: desc,
                estimatedBudget: budget,
                userId: currentUserInstance.uid,
                createdAt: new Date()
            });

            showToast("Project submitted successfully!", "success");
            projectForm.reset();
            loadUserProjects(currentUserInstance.uid);
        } catch (error) {
            console.error(error);
            showToast("Permissions block: Check console or update your rules.", "error");
        } finally {
            toggleButtonState(submitBtn, false, 'Submit Project Request');
        }
    });
}

// Fetch and append documents dynamically
async function loadUserProjects(uid) {
    const listEl = document.getElementById('projects-list');
    const emptyState = document.getElementById('empty-state');
    if (!listEl) return;

    listEl.innerHTML = "";
    try {
        const q = query(collection(db, "projects"), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        snapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = "bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3";
            card.innerHTML = `
                <div class="flex items-start justify-between">
                    <h4 class="font-bold text-slate-900">${data.projectName}</h4>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-primary">${data.projectType}</span>
                </div>
                <p class="text-sm text-slate-500 line-clamp-3">${data.projectDescription}</p>
                <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                    <span>Budget: <strong class="text-slate-700">${data.estimatedBudget}</strong></span>
                </div>
            `;
            listEl.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// Handlers for absolute Logout routing mechanics
const triggerGlobalSignOut = async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (err) { console.error(err); }
};

const dBtn = document.getElementById('logout-btn');
const mBtn = document.getElementById('mobile-logout-btn');
if (dBtn) dBtn.addEventListener('click', triggerGlobalSignOut);
if (mBtn) mBtn.addEventListener('click', triggerGlobalSignOut);

import { auth, db } from './firebase-config.js';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { showToast, toggleButtonState } from './ui.js';

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        fetchProjects();
    }
});

// Submit New Project
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const projectName = document.getElementById('project-name').value;
        const projectType = document.getElementById('project-type').value;
        const description = document.getElementById('project-description').value;
        const budget = document.getElementById('project-budget').value;
        const btn = document.getElementById('submit-project-btn');

        toggleButtonState(btn, true);

        try {
            await addDoc(collection(db, 'projects'), {
                userId: currentUser.uid,
                projectName,
                projectType,
                description,
                budget,
                status: "Pending",
                createdAt: new Date().toISOString()
            });

            showToast('Project submitted successfully!', 'success');
            projectForm.reset();
            toggleButtonState(btn, false, 'Submit Project Request');
            fetchProjects(); 
        } catch (error) {
            showToast(error.message, 'error');
            toggleButtonState(btn, false, 'Submit Project Request');
        }
    });
}

// Fetch Projects
async function fetchProjects() {
    if (!currentUser) return;

    const projectsList = document.getElementById('projects-list');
    const emptyState = document.getElementById('empty-state');

    if (!projectsList) return;

    try {
        const q = query(
            collection(db, 'projects'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        renderProjectsList(querySnapshot, projectsList, emptyState);

    } catch (error) {
        console.error("Error fetching projects: ", error);
        if (error.message.includes('index')) {
            console.warn('Missing Firestore index. Falling back to in-memory sort.');
            fallbackFetchProjects();
        } else {
            showToast('Error loading projects.', 'error');
        }
    }
}

async function fallbackFetchProjects() {
    const projectsList = document.getElementById('projects-list');
    const emptyState = document.getElementById('empty-state');
    try {
        const q = query(
            collection(db, 'projects'),
            where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const projects = [];
        querySnapshot.forEach(doc => projects.push(doc.data()));
        projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        projectsList.innerHTML = '';
        if (projects.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        projects.forEach(project => appendProjectCard(project, projectsList));
    } catch (e) {
        console.error(e);
        showToast('Failed to load projects.', 'error');
    }
}

function renderProjectsList(querySnapshot, projectsList, emptyState) {
    projectsList.innerHTML = '';
    if (querySnapshot.empty) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    querySnapshot.forEach((doc) => {
        appendProjectCard(doc.data(), projectsList);
    });
}

function appendProjectCard(project, container) {
    const date = new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    let statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (project.status === 'In Progress') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (project.status === 'Completed') statusColor = 'bg-green-50 text-green-700 border-green-200';
    else if (project.status === 'Cancelled') statusColor = 'bg-red-50 text-red-700 border-red-200';
    if (project.status === 'Pending') statusColor = 'bg-amber-100 text-amber-800 border-transparent';

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 fade-in';
    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
            <div>
                <h3 class="text-xl font-bold text-slate-800 mb-1">${escapeHtml(project.projectName)}</h3>
                <span class="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">${escapeHtml(project.projectType)}</span>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-semibold border ${statusColor}">
                ${escapeHtml(project.status)}
            </span>
        </div>
        <p class="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">${escapeHtml(project.description)}</p>
        <div class="flex justify-between items-center text-sm border-t border-slate-100 pt-4 mt-auto">
            <div class="flex items-center gap-1.5 font-semibold text-slate-700">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ${escapeHtml(project.budget)}
            </div>
            <div class="text-slate-400 text-xs flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                ${date}
            </div>
        </div>
    `;
    container.appendChild(card);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ⚡ NEW: Device Passkey Registration Flow
// =========================================================================
// Native Local-Safe Passkey Registration Engine (Fixed Options)
// =========================================================================
const registerPasskeyBtn = document.getElementById('btn-register-passkey');
if (registerPasskeyBtn) {
    registerPasskeyBtn.addEventListener('click', async () => {
        if (!window.PublicKeyCredential) {
            showToast('Passkeys are unavailable on this device.', 'error');
            return;
        }

        toggleButtonState(registerPasskeyBtn, true);

        try {
            // Safe fallbacks for local testing values
            const userIdString = (currentUser && currentUser.uid) ? currentUser.uid : "localuser123";
            const userEmailString = (currentUser && currentUser.email) ? currentUser.email : "client@codecrest.com";

            // Secure conversion to ArrayBuffer for the hardware handshake
            const enc = new TextEncoder();
            const userIdBuffer = enc.encode(userIdString);
            const genericChallenge = new Uint8Array(32); 
            window.crypto.getRandomValues(genericChallenge); // Generates a valid random crypt challenge

            const publicKeyCredentialCreationOptions = {
                challenge: genericChallenge,
                rp: { 
                    name: "CodeCrest Dashboard", 
                    id: window.location.hostname // Automatically binds perfectly to "localhost"
                },
                user: {
                    id: userIdBuffer,
                    name: userEmailString,
                    displayName: userEmailString
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },   // ES256 (Common for mobile devices/TouchID)
                    { type: "public-key", alg: -257 }  // RS256 (Common for Windows Hello)
                ],
                timeout: 60000,
                authenticatorSelection: { 
                    // This configuration allows both built-in biometrics AND cross-device USB/Bluetooth/Phone keys
                    userVerification: "preferred" 
                }
            };

            // Launch Native Device Registration Prompt
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) {
                // Save identification string to match locally during validation steps
                const base64Id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
                localStorage.setItem('codecrest_passkey_credential_id', base64Id);

                showToast('Passkey linked successfully!', 'success');
                registerPasskeyBtn.textContent = '🔒 Passkey Active';
                registerPasskeyBtn.disabled = true;
                registerPasskeyBtn.className = "inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl text-green-700 bg-green-50 border border-green-200 cursor-not-allowed shrink-0";
            }
        } catch (error) {
            console.error("Passkey setup error details:", error);
            showToast('Setup canceled or credential registration rejected.', 'error');
            toggleButtonState(registerPasskeyBtn, false, 'Link Device Passkey');
        }
    });
}
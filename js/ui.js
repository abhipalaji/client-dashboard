export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        iconSvg = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger reflow to play animation
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

export function toggleButtonState(button, isLoading, originalText = '') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span> <span class="ml-2">Processing...</span>`;
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

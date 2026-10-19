// ========================================================
// FUNCIONES DE UI COMPARTIDAS (Toast, Modales)
// ========================================================

// Toast notification - accessible from all pages
function showToast(mensaje, tipo = 'success') {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    const iconoPaths = {
        success: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>',
        error: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>',
        info: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    };

    toast.className = `toast-notification ${tipo} show`;
    toast.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${iconoPaths[tipo] || iconoPaths.info}
        </svg>
        <span>${mensaje}</span>
    `;

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Modal helpers - used by estudiantes.js and procesos.js
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        // Force reflow for animation
        modal.offsetHeight;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Close on backdrop click
        modal.addEventListener('click', function closeOnBack(e) {
            if (e.target === modal) {
                cerrarModal(id);
                modal.removeEventListener('click', closeOnBack);
            }
        });
    }
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = '';
            }
        }, 280);
    }
}

// Esc key closes any open modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            cerrarModal(m.id);
        });
    }
});

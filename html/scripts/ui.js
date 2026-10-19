// ========================================================
// FUNCIONES DE UI COMPARTIDAS (Toast, Modales)
// ========================================================

// Toast notification - accessible from all pages
function showToast(mensaje, tipo = 'success', opciones = {}) {
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

    // Botón de acción opcional dentro del mismo aviso (por ejemplo "Deshacer").
    // opciones: { accion: { texto, onClick(btn) }, duracion (ms), alExpirar() }
    if (opciones.accion) {
        asegurarEstiloAccionToast();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-accion';
        btn.textContent = opciones.accion.texto;
        btn.addEventListener('click', () => {
            clearTimeout(toast._timeout); // al pulsar, ya no se oculta por tiempo
            opciones.accion.onClick(btn);
        });
        toast.appendChild(btn);
    }

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
        if (typeof opciones.alExpirar === 'function') opciones.alExpirar();
    }, opciones.duracion || 4000);
}

// Estilo del botón de acción del aviso (se agrega una sola vez)
function asegurarEstiloAccionToast() {
    if (document.getElementById('estiloToastAccion')) return;
    const estilo = document.createElement('style');
    estilo.id = 'estiloToastAccion';
    estilo.textContent = `
        .toast-notification .toast-accion {
            margin-left: 0.6rem; flex: 0 0 auto;
            background: rgba(var(--color-primario-rgb, 19, 129, 162), 0.12);
            color: var(--color-primario, #1381a2);
            border: none; border-radius: var(--radius-sm, 8px);
            padding: 0.45rem 0.9rem;
            font-family: 'Public Sans', sans-serif; font-size: 0.85rem; font-weight: 600;
            cursor: pointer; transition: var(--transition, all 0.25s ease);
        }
        .toast-notification .toast-accion:hover { background: rgba(var(--color-primario-rgb, 19, 129, 162), 0.22); }
        .toast-notification .toast-accion:disabled { opacity: 0.6; cursor: default; }
    `;
    document.head.appendChild(estilo);
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
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = '';
            }
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            if (activeModals.length === 0) {
                document.body.style.overflow = '';
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

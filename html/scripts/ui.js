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
    if (window.cerrarMenusDesplegables) window.cerrarMenusDesplegables();
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

// ========================================================
// MODO NOCHE (Dark Mode) — Persistido en localStorage
// ========================================================

(function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    // Actualizar UI del botón cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateDarkModeUI);
    } else {
        updateDarkModeUI();
    }
})();

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    updateDarkModeUI();
}

function updateDarkModeUI() {
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.getElementById('iconDarkMode');
    const text = document.getElementById('textDarkMode');
    if (icon) {
        // Modo claro → ícono sol; modo noche → ícono luna
        if (isDark) {
            // Sol
            icon.innerHTML = '<circle cx="12" cy="12" r="5"/>'
                + '<line x1="12" y1="1" x2="12" y2="3"/>'
                + '<line x1="12" y1="21" x2="12" y2="23"/>'
                + '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>'
                + '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>'
                + '<line x1="1" y1="12" x2="3" y2="12"/>'
                + '<line x1="21" y1="12" x2="23" y2="12"/>'
                + '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>'
                + '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
        } else {
            // Luna
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
    }
    if (text) text.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
}

// ========================================================
// MENÚS DESPLEGABLES ANIMADOS
// Reemplazan visualmente a los <select> nativos (que no se pueden animar ni limitar
// al ancho de su ventana). El <select> original se mantiene en el formulario, oculto
// visualmente, y sigue siendo la fuente del valor: al elegir una opción se actualiza
// y se dispara su evento "change". Si otro script cambia su valor, la etiqueta se actualiza sola.
// El panel se dibuja sobre toda la página, por eso nunca se sale ni se corta dentro de una ventana.
// ========================================================
(function initMenusDesplegables() {
    var PROP_VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    var PROP_INDEX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
    var cierreActual = null; // función que cierra el menú abierto

    window.cerrarMenusDesplegables = function () {
        if (cierreActual) cierreActual();
    };

    function crear(select) {
        if (select.dataset.ddListo || select.multiple || select.size > 1) return;
        if (select.style.display === 'none') return;
        // Solo los de las barras de filtros y de las ventanas emergentes (otras páginas no se tocan)
        if (!select.closest('.toolbar-container, .modal-dialog')) return;
        select.dataset.ddListo = '1';

        var enFormulario = !!select.closest('.form-field-group');

        var cont = document.createElement('div');
        cont.className = 'dd' + (enFormulario ? ' dd-bloque' : '');

        var trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = (select.className ? select.className + ' ' : '') + 'dd-trigger';
        if (select.style.cssText) trigger.style.cssText = select.style.cssText;
        if (select.id) trigger.setAttribute('data-dd-for', select.id);
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        if (!enFormulario && select.offsetWidth) trigger.style.minWidth = select.offsetWidth + 'px';
        trigger.innerHTML = '<span class="dd-label"></span>'
            + '<svg class="dd-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">'
            + '<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';
        var etiqueta = trigger.querySelector('.dd-label');

        var panel = document.createElement('ul');
        panel.className = 'dd-panel';
        panel.setAttribute('role', 'listbox');
        document.body.appendChild(panel);

        select.parentNode.insertBefore(cont, select);
        cont.appendChild(trigger);
        cont.appendChild(select);
        select.classList.add('dd-nativo');
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');

        var activo = -1;
        var abierto = false;

        function actualizarEtiqueta() {
            var op = select.options[select.selectedIndex];
            etiqueta.textContent = op ? op.textContent.trim() : '';
            trigger.disabled = select.disabled;
        }

        // Cuando otro script cambia el valor del select (form.reset, select.value = ...), se refleja aquí
        Object.defineProperty(select, 'value', {
            configurable: true,
            get: function () { return PROP_VALUE.get.call(select); },
            set: function (v) { PROP_VALUE.set.call(select, v); actualizarEtiqueta(); }
        });
        Object.defineProperty(select, 'selectedIndex', {
            configurable: true,
            get: function () { return PROP_INDEX.get.call(select); },
            set: function (v) { PROP_INDEX.set.call(select, v); actualizarEtiqueta(); }
        });
        new MutationObserver(actualizarEtiqueta).observe(select, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected']
        });
        if (select.form) select.form.addEventListener('reset', function () { setTimeout(actualizarEtiqueta, 0); });
        select.addEventListener('change', actualizarEtiqueta);

        function construir() {
            panel.innerHTML = '';
            Array.prototype.forEach.call(select.options, function (op, i) {
                var li = document.createElement('li');
                li.className = 'dd-option' + (i === select.selectedIndex ? ' seleccionada' : '');
                li.setAttribute('role', 'option');
                li.setAttribute('data-indice', i);
                li.textContent = op.textContent.trim();
                if (op.disabled) li.classList.add('deshabilitada');
                panel.appendChild(li);
            });
        }

        function marcarActivo(i) {
            var items = panel.querySelectorAll('.dd-option');
            items.forEach(function (li) { li.classList.remove('activa'); });
            if (items[i]) {
                items[i].classList.add('activa');
                items[i].scrollIntoView({ block: 'nearest' });
            }
            activo = i;
        }

        function posicionar() {
            var r = trigger.getBoundingClientRect();
            var vw = window.innerWidth, vh = window.innerHeight;
            var margen = 8;
            var maxAncho = enFormulario ? r.width : Math.min(380, vw - margen * 2);

            panel.style.minWidth = r.width + 'px';
            panel.style.maxWidth = maxAncho + 'px';
            panel.style.width = enFormulario ? r.width + 'px' : 'max-content';
            panel.style.maxHeight = '280px';

            var ancho = panel.offsetWidth;
            var izquierda = Math.min(Math.max(r.left, margen), Math.max(margen, vw - ancho - margen));
            panel.style.left = izquierda + 'px';

            var alto = Math.min(280, panel.scrollHeight);
            var abajo = vh - r.bottom - margen - 6;
            var arriba = r.top - margen - 6;
            if (alto > abajo && arriba > abajo) {
                panel.classList.add('hacia-arriba');
                panel.style.top = 'auto';
                panel.style.bottom = (vh - r.top + 6) + 'px';
                panel.style.maxHeight = Math.min(280, arriba) + 'px';
            } else {
                panel.classList.remove('hacia-arriba');
                panel.style.bottom = 'auto';
                panel.style.top = (r.bottom + 6) + 'px';
                panel.style.maxHeight = Math.min(280, Math.max(120, abajo)) + 'px';
            }
        }

        function cerrar() {
            if (!abierto) return;
            abierto = false;
            panel.classList.remove('open');
            cont.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (cierreActual === cerrar) cierreActual = null;
            window.removeEventListener('resize', posicionar);
            window.removeEventListener('scroll', alDesplazar, true);
        }
        function alDesplazar(e) {
            if (panel.contains(e.target)) return; // el scroll interno de la lista no cierra nada
            posicionar();
        }
        function abrir() {
            if (select.disabled) return;
            if (cierreActual && cierreActual !== cerrar) cierreActual();
            actualizarEtiqueta();
            construir();
            abierto = true;
            cierreActual = cerrar;
            cont.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            posicionar();
            panel.classList.add('open');
            marcarActivo(select.selectedIndex);
            window.addEventListener('resize', posicionar);
            window.addEventListener('scroll', alDesplazar, true);
        }
        function elegir(i) {
            var op = select.options[i];
            if (!op || op.disabled) return;
            if (select.selectedIndex !== i) {
                select.selectedIndex = i;
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            actualizarEtiqueta();
            cerrar();
            trigger.focus();
        }

        trigger.addEventListener('click', function () { abierto ? cerrar() : abrir(); });
        panel.addEventListener('mousedown', function (e) { e.preventDefault(); }); // no quita el foco al botón
        panel.addEventListener('click', function (e) {
            var li = e.target.closest('.dd-option');
            if (li) elegir(parseInt(li.getAttribute('data-indice'), 10));
        });
        trigger.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!abierto) { abrir(); return; }
                var n = select.options.length;
                marcarActivo((activo + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (abierto) { e.preventDefault(); elegir(activo); }
            } else if (e.key === 'Escape') {
                if (abierto) { e.stopPropagation(); cerrar(); } // no cierra también la ventana emergente
            } else if (e.key === 'Tab') {
                cerrar();
            }
        });
        document.addEventListener('click', function (e) {
            if (abierto && !cont.contains(e.target) && !panel.contains(e.target)) cerrar();
        });

        actualizarEtiqueta();
    }

    function iniciar() {
        document.querySelectorAll('select').forEach(crear);
    }
    iniciar();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
})();

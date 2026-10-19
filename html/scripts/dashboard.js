// ========================================================
// DASHBOARD LOGIC - RELOJ DIGITAL Y FECHA
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Reloj Digital en Vivo
    function actualizarReloj() {
        const ahora = new Date();
        let horas = ahora.getHours();
        const minutos = ahora.getMinutes();
        const ampm = horas >= 12 ? 'p.m.' : 'a.m.';

        horas = horas % 12;
        horas = horas ? horas : 12; // Formato 12 horas

        const horasStr = String(horas).padStart(2, '0');
        const minutosStr = String(minutos).padStart(2, '0');

        const clockEl = document.getElementById('liveClockDigits');
        const ampmEl = document.getElementById('liveClockAmpm');

        if (clockEl) clockEl.textContent = `${horasStr}:${minutosStr}`;
        if (ampmEl) ampmEl.textContent = ` ${ampm}`;
    }

    // Actualizar reloj cada segundo
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    // 2. Fecha en Español Dinámica (con opción de mantener la fecha representativa o la del sistema)
    function actualizarFecha() {
        const fechaEl = document.getElementById('liveClockDate');
        if (!fechaEl) return;

        const ahora = new Date();
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const dia = ahora.getDate();
        const mes = meses[ahora.getMonth()];
        const anio = ahora.getFullYear();

        fechaEl.textContent = `${dia} de ${mes} del ${anio}`;
    }

    actualizarFecha();
});

// Toast notification helper
function showToast(mensaje, tipo = 'success') {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.className = `toast-notification ${tipo} show`;
    toast.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${tipo === 'success' 
                ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />' 
                : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />'}
        </svg>
        <span>${mensaje}</span>
    `;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3800);
}

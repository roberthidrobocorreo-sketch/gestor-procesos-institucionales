// ========================================================
// INICIO DE SESIÓN
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const msgError = document.getElementById('mensaje-error');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (msgError) msgError.style.display = 'none';

            const submitBtn = formLogin.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Accediendo...';
            }

            const formData = new FormData(formLogin);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.exito) {
                    window.location.href = data.redirect || '/inicio';
                } else {
                    if (msgError) {
                        msgError.style.display = 'block';
                        msgError.textContent = data.mensaje || 'Credenciales incorrectas.';
                    }
                }
            } catch (error) {
                console.error(error);
                if (msgError) {
                    msgError.style.display = 'block';
                    msgError.textContent = 'Error al comunicarse con el servidor.';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Entrar';
                }
            }
        });
    }
});

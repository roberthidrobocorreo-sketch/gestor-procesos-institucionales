// ========================================================
// GESTIÓN DE PROCESOS INSTITUCIONALES
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const searchProcessInput = document.getElementById('searchProcessInput');
    const filterTipoProceso = document.getElementById('filterTipoProceso');
    const filterEstadoProceso = document.getElementById('filterEstadoProceso');
    const processRows = document.querySelectorAll('.process-table-row');

    // 1. Filtrado de Procesos
    function filtrarProcesos() {
        const query = (searchProcessInput ? searchProcessInput.value : '').toLowerCase().trim();
        const tipoSeleccionado = filterTipoProceso ? filterTipoProceso.value : '';
        const estadoSeleccionado = filterEstadoProceso ? filterEstadoProceso.value : '';

        let visibles = 0;

        processRows.forEach(row => {
            const estudiante = (row.getAttribute('data-estudiante') || '').toLowerCase();
            const cedula = (row.getAttribute('data-cedula') || '').toLowerCase();
            const tipo = row.getAttribute('data-tipo') || '';
            const estado = row.getAttribute('data-estado') || '';

            const coincideTexto = !query || estudiante.includes(query) || cedula.includes(query);
            const coincideTipo = !tipoSeleccionado || tipo === tipoSeleccionado;
            const coincideEstado = !estadoSeleccionado || estado === estadoSeleccionado;

            if (coincideTexto && coincideTipo && coincideEstado) {
                row.style.display = '';
                visibles++;
            } else {
                row.style.display = 'none';
            }
        });

        const noDataRow = document.getElementById('noResultsProcessRow');
        if (noDataRow) {
            noDataRow.style.display = visibles === 0 ? '' : 'none';
        }
    }

    if (searchProcessInput) searchProcessInput.addEventListener('input', filtrarProcesos);
    if (filterTipoProceso) filterTipoProceso.addEventListener('change', filtrarProcesos);
    if (filterEstadoProceso) filterEstadoProceso.addEventListener('change', filtrarProcesos);

    // 2. Formulario Nuevo Proceso
    const formNuevoProceso = document.getElementById('formNuevoProceso');
    if (formNuevoProceso) {
        formNuevoProceso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formNuevoProceso.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            const formData = new FormData(formNuevoProceso);

            try {
                const resp = await fetch('/nuevoProceso', {
                    method: 'POST',
                    body: formData
                });
                const res = await resp.json();

                if (res.exito) {
                    showToast(res.mensaje || 'Proceso registrado con éxito');
                    cerrarModal('modalNuevoProceso');
                    setTimeout(() => location.reload(), 700);
                } else {
                    showToast(res.mensaje || 'Error al registrar el proceso', 'error');
                }
            } catch (err) {
                showToast('Error de red al guardar el proceso', 'error');
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    // 3. Formulario Editar Proceso
    const formEditarProceso = document.getElementById('formEditarProceso');
    if (formEditarProceso) {
        formEditarProceso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formEditarProceso.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            const id = document.getElementById('edit_proceso_id').value;
            const formData = new FormData(formEditarProceso);

            try {
                const resp = await fetch(`/editarProceso/${id}`, {
                    method: 'PUT',
                    body: formData
                });
                const res = await resp.json();

                if (res.exito) {
                    showToast(res.mensaje || 'Proceso actualizado con éxito');
                    cerrarModal('modalEditarProceso');
                    setTimeout(() => location.reload(), 700);
                } else {
                    showToast(res.mensaje || 'Error al actualizar', 'error');
                }
            } catch (err) {
                showToast('Error de conexión', 'error');
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }
});

// Modal Nuevo Proceso
function abrirModalNuevoProceso() {
    const form = document.getElementById('formNuevoProceso');
    if (form) form.reset();
    abrirModal('modalNuevoProceso');
}

// Modal Editar Proceso
function abrirModalEditarProceso(btn) {
    const id = btn.getAttribute('data-id');
    const estudiante = btn.getAttribute('data-estudiante');
    const cedula = btn.getAttribute('data-cedula');
    const tipo = btn.getAttribute('data-tipo');
    const fecha = btn.getAttribute('data-fecha');
    const estado = btn.getAttribute('data-estado');
    const descripcion = btn.getAttribute('data-descripcion');

    document.getElementById('edit_proceso_id').value = id;
    document.getElementById('edit_proceso_estudiante_info').textContent = `${estudiante} (C.I: ${cedula})`;
    document.getElementById('edit_tipo_proceso').value = tipo;
    document.getElementById('edit_fecha_proceso').value = fecha;
    document.getElementById('edit_estado_proceso').value = estado;
    document.getElementById('edit_descripcion_proceso').value = descripcion;

    abrirModal('modalEditarProceso');
}

// Eliminar Proceso
async function eliminarProceso(id, tipoProceso) {
    if (!confirm(`¿Desea eliminar el proceso "${tipoProceso}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const resp = await fetch(`/eliminarProceso/${id}`, {
            method: 'DELETE'
        });
        const res = await resp.json();

        if (res.exito) {
            showToast('Proceso eliminado correctamente');
            setTimeout(() => location.reload(), 600);
        } else {
            showToast(res.mensaje || 'Error al eliminar', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    }
}

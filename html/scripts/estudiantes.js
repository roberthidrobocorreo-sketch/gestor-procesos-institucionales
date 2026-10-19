// ========================================================
// GESTIÓN DE ESTUDIANTES (SIN NOTAS - PROCESOS INSTITUCIONALES)
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchStudentInput');
    const filterAno = document.getElementById('filterAno');
    const filterEstado = document.getElementById('filterEstado');
    const studentRows = document.querySelectorAll('.student-row');

    // 1. Filtrado y Búsqueda en Vivo
    function filtrarEstudiantes() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const anoSeleccionado = filterAno ? filterAno.value : '';
        const estadoSeleccionado = filterEstado ? filterEstado.value : '';

        let visibles = 0;

        studentRows.forEach(row => {
            const cedula = row.getAttribute('data-cedula') || '';
            const nombreCompleto = row.getAttribute('data-nombre') || '';
            const ano = row.getAttribute('data-ano') || '';
            const estado = row.getAttribute('data-estado') || '';

            const coincideTexto = !query || cedula.includes(query) || nombreCompleto.includes(query);
            const coincideAno = !anoSeleccionado || ano === anoSeleccionado;
            const coincideEstado = !estadoSeleccionado || estado === estadoSeleccionado;

            if (coincideTexto && coincideAno && coincideEstado) {
                row.style.display = '';
                visibles++;
            } else {
                row.style.display = 'none';
            }
        });

        const noDataRow = document.getElementById('noResultsRow');
        if (noDataRow) {
            noDataRow.style.display = visibles === 0 ? '' : 'none';
        }
    }

    if (searchInput) searchInput.addEventListener('input', filtrarEstudiantes);
    if (filterAno) filterAno.addEventListener('change', filtrarEstudiantes);
    if (filterEstado) filterEstado.addEventListener('change', filtrarEstudiantes);

    // 2. Manejo de Formulario "Añadir Estudiante"
    const formNuevoEstudiante = document.getElementById('formNuevoEstudiante');
    if (formNuevoEstudiante) {
        formNuevoEstudiante.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formNuevoEstudiante.querySelector('button[type="submit"]');
            if (btnSubmit) btnSubmit.disabled = true;

            const formData = new FormData(formNuevoEstudiante);

            try {
                const resp = await fetch('/nuevoEstudiante', {
                    method: 'POST',
                    body: formData
                });
                const res = await resp.json();

                if (res.exito) {
                    showToast(res.mensaje || 'Estudiante añadido exitosamente');
                    cerrarModal('modalNuevoEstudiante');
                    setTimeout(() => location.reload(), 700);
                } else {
                    showToast(res.mensaje || 'Error al guardar el estudiante', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Error de conexión al guardar el estudiante', 'error');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
            }
        });
    }

    // 3. Manejo de Formulario "Modificar Estudiante"
    const formEditarEstudiante = document.getElementById('formEditarEstudiante');
    if (formEditarEstudiante) {
        formEditarEstudiante.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formEditarEstudiante.querySelector('button[type="submit"]');
            if (btnSubmit) btnSubmit.disabled = true;

            const formData = new FormData(formEditarEstudiante);

            try {
                const resp = await fetch('/editarEstudiante', {
                    method: 'PUT',
                    body: formData
                });
                const res = await resp.json();

                if (res.exito) {
                    showToast(res.mensaje || 'Estudiante actualizado exitosamente');
                    cerrarModal('modalEditarEstudiante');
                    setTimeout(() => location.reload(), 700);
                } else {
                    showToast(res.mensaje || 'Error al actualizar el estudiante', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Error de conexión al actualizar', 'error');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
            }
        });
    }

    // 4. Actualización dinámica de secciones según grado (Preescolar: A, B, C, D | Primaria: A, B)
    const selectAno = document.getElementById('ano');
    if (selectAno) {
        selectAno.addEventListener('change', () => {
            actualizarOpcionesSeccion('ano', 'seccion');
        });
    }

    const selectEditAno = document.getElementById('edit_ano');
    if (selectEditAno) {
        selectEditAno.addEventListener('change', () => {
            actualizarOpcionesSeccion('edit_ano', 'edit_seccion');
        });
    }
});

// Función para poblar secciones según el nivel/grado:
// Preescolar -> A, B, C, D
// Primaria (1er a 6to Grado) -> A, B
function actualizarOpcionesSeccion(idGrado, idSeccion, seleccionPrevia = '') {
    const selectGrado = document.getElementById(idGrado);
    const selectSeccion = document.getElementById(idSeccion);
    if (!selectGrado || !selectSeccion) return;

    const grado = selectGrado.value;
    selectSeccion.innerHTML = '';

    if (!grado) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Seleccione grado primero...';
        selectSeccion.appendChild(defaultOpt);
        return;
    }

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Seleccionar sección...';
    selectSeccion.appendChild(defaultOpt);

    let opciones = [];
    if (grado === 'Preescolar') {
        opciones = ['A', 'B', 'C', 'D'];
    } else {
        opciones = ['A', 'B'];
    }

    opciones.forEach(sec => {
        const opt = document.createElement('option');
        opt.value = sec;
        opt.textContent = `Sección ${sec}`;
        if (sec === seleccionPrevia) {
            opt.selected = true;
        }
        selectSeccion.appendChild(opt);
    });
}

// Abrir modal de añadir estudiante
function abrirModalNuevoEstudiante() {
    const form = document.getElementById('formNuevoEstudiante');
    if (form) form.reset();
    actualizarOpcionesSeccion('ano', 'seccion');
    abrirModal('modalNuevoEstudiante');
}

// Abrir modal de modificar estudiante con datos precargados
function abrirModalModificar(btn) {
    const data = {
        cedula: btn.getAttribute('data-cedula') || '',
        nombre: btn.getAttribute('data-nombre') || '',
        apellido: btn.getAttribute('data-apellido') || '',
        ano: btn.getAttribute('data-ano') || '1er Grado',
        seccion: btn.getAttribute('data-seccion') || 'A',
        representante: btn.getAttribute('data-representante') || '',
        telefono: btn.getAttribute('data-telefono') || '',
        correo: btn.getAttribute('data-correo') || '',
        estado: btn.getAttribute('data-estado') || 'Activo',
        observaciones: btn.getAttribute('data-observaciones') || ''
    };

    document.getElementById('edit_cedula').value = data.cedula;
    document.getElementById('edit_cedula_display').textContent = data.cedula;
    document.getElementById('edit_nombre').value = data.nombre;
    document.getElementById('edit_apellido').value = data.apellido;
    document.getElementById('edit_ano').value = data.ano;
    actualizarOpcionesSeccion('edit_ano', 'edit_seccion', data.seccion);
    document.getElementById('edit_representante').value = data.representante;
    document.getElementById('edit_telefono').value = data.telefono;
    document.getElementById('edit_correo').value = data.correo;
    document.getElementById('edit_estado').value = data.estado;
    document.getElementById('edit_observaciones').value = data.observaciones;

    abrirModal('modalEditarEstudiante');
}

// Confirmar y eliminar estudiante
async function eliminarEstudiante(cedula, nombreCompleto) {
    if (!confirm(`¿Está seguro de eliminar al estudiante ${nombreCompleto} (C.I: ${cedula})?\nEsta acción también eliminará sus procesos asociados.`)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('cedula', cedula);

        const resp = await fetch('/eliminarEstudiante', {
            method: 'DELETE',
            body: formData
        });

        const res = await resp.json();
        if (res.exito) {
            showToast(res.mensaje || 'Estudiante eliminado con éxito');
            setTimeout(() => location.reload(), 600);
        } else {
            showToast(res.mensaje || 'Error al eliminar', 'error');
        }
    } catch (err) {
        showToast('Error de red al intentar eliminar', 'error');
    }
}

// Abrir proceso rápido para un estudiante
function abrirProcesoParaEstudiante(cedula, nombreCompleto) {
    const select = document.getElementById('nuevo_proceso_estudiante');
    if (select) {
        select.value = cedula;
    }
    abrirModal('modalNuevoProceso');
}

// Helpers modales
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

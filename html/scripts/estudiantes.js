// ========================================================
// GESTIÓN DE ESTUDIANTES Y MATRÍCULA ESCOLAR
// Escuela "Las Américas"
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchStudentInput');
    const filterAno = document.getElementById('filterAno');
    const filterEstado = document.getElementById('filterEstado');
    const studentRows = document.querySelectorAll('.student-row');

    // 1. Filtrado y Búsqueda en Vivo (los separadores se ocultan si su grupo queda vacío)
    function filtrarEstudiantes() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const anoSeleccionado = filterAno ? filterAno.value : '';
        const estadoSeleccionado = filterEstado ? filterEstado.value : '';

        let visibles = 0;
        const visiblesPorGrupo = {};

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
                const grupo = row.getAttribute('data-group');
                visiblesPorGrupo[grupo] = (visiblesPorGrupo[grupo] || 0) + 1;
            } else {
                row.style.display = 'none';
                // Una fila oculta no puede quedar seleccionada (evita ascender estudiantes que no se ven)
                const chk = row.querySelector('.row-check');
                if (chk && chk.checked) chk.checked = false;
            }
        });

        document.querySelectorAll('.group-row').forEach(cabecera => {
            const n = visiblesPorGrupo[cabecera.getAttribute('data-group')] || 0;
            cabecera.style.display = n > 0 ? '' : 'none';
            const contador = cabecera.querySelector('.group-count');
            if (contador) contador.textContent = `${n} estudiante${n === 1 ? '' : 's'}`;
        });

        const noDataRow = document.getElementById('noResultsRow');
        if (noDataRow) {
            noDataRow.style.display = visibles === 0 ? '' : 'none';
        }

        actualizarSeleccion();
    }

    if (searchInput) searchInput.addEventListener('input', filtrarEstudiantes);
    if (filterAno) filterAno.addEventListener('change', filtrarEstudiantes);
    if (filterEstado) filterEstado.addEventListener('change', filtrarEstudiantes);

    // Selección de estudiantes (casilla individual o de toda una sección)
    document.addEventListener('change', (e) => {
        const el = e.target;
        if (!el || !el.classList) return;

        if (el.classList.contains('group-check')) {
            const grupo = el.getAttribute('data-group');
            document.querySelectorAll(`.student-row[data-group="${grupo}"]`).forEach(row => {
                if (row.style.display === 'none') return; // solo los que se ven
                const chk = row.querySelector('.row-check');
                if (chk) chk.checked = el.checked;
            });
            actualizarSeleccion();
        } else if (el.classList.contains('row-check')) {
            actualizarSeleccion();
        }
    });
    actualizarSeleccion();

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

// Funciones para previsualizar y manejar fotos de perfil
function previewFotoEstudiante(input, prefix) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 8 * 1024 * 1024) {
            alert('La imagen no debe superar los 8MB.');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById(`${prefix}_foto_img`);
            const placeholder = document.getElementById(`${prefix}_foto_placeholder`);
            const btnRemove = document.getElementById(`btn_remover_${prefix}_foto`);

            if (img) {
                img.src = e.target.result;
                img.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            if (btnRemove) btnRemove.style.display = 'inline-flex';
            if (prefix === 'edit') {
                const hiddenEliminar = document.getElementById('edit_eliminar_foto');
                if (hiddenEliminar) hiddenEliminar.value = 'false';
            }
        };
        reader.readAsDataURL(file);
    }
}

function removerFoto(prefix) {
    const input = document.getElementById(`${prefix}_foto`);
    if (input) input.value = '';

    const img = document.getElementById(`${prefix}_foto_img`);
    if (img) {
        img.src = '';
        img.style.display = 'none';
    }

    const placeholder = document.getElementById(`${prefix}_foto_placeholder`);
    if (placeholder) placeholder.style.display = 'flex';

    const btnRemove = document.getElementById(`btn_remover_${prefix}_foto`);
    if (btnRemove) btnRemove.style.display = 'none';

    if (prefix === 'edit') {
        const hiddenEliminar = document.getElementById('edit_eliminar_foto');
        if (hiddenEliminar) hiddenEliminar.value = 'true';
    }
}

// Abrir modal de añadir estudiante (con fecha de hoy por defecto)
function abrirModalNuevoEstudiante() {
    const form = document.getElementById('formNuevoEstudiante');
    if (form) form.reset();
    reiniciarAutocompletadoRepresentante();
    removerFoto('nuevo');
    actualizarOpcionesSeccion('ano', 'seccion');

    // Por defecto, fecha de ingreso = hoy
    const fechaIngresoInput = document.getElementById('fecha_ingreso');
    if (fechaIngresoInput) {
        fechaIngresoInput.value = new Date().toISOString().split('T')[0];
    }

    abrirModal('modalNuevoEstudiante');
}

// Abrir modal de modificar estudiante precargando TODOS los campos (personales, tallas, padres, representante)
async function abrirModalModificar(btn) {
    const cedula = btn.getAttribute('data-cedula') || '';
    if (!cedula) return;
    reiniciarAutocompletadoRepresentante();

    let est = null;

    // 1. Intentar obtener desde el JSON embebido en la página
    const scriptJson = document.getElementById('estudiantes_db_json');
    if (scriptJson) {
        try {
            const todos = JSON.parse(scriptJson.textContent || '[]');
            est = todos.find(e => String(e.cedula) === String(cedula));
        } catch (e) {
            console.error('Error al parsear estudiantes_db_json:', e);
        }
    }

    // 2. Si no se encontró en el JSON, consultar a la API
    if (!est) {
        try {
            const resp = await fetch(`/api/estudiante/${cedula}`);
            const json = await resp.json();
            if (json.exito && json.estudiante) {
                est = json.estudiante;
            }
        } catch (e) {
            console.error('Error al consultar /api/estudiante:', e);
        }
    }

    if (!est) {
        showToast('No se pudieron cargar los datos del estudiante', 'error');
        return;
    }

    // Poblar campos del formulario de edición
    const setValue = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setValue('edit_cedula', est.cedula);
    const displayCedula = document.getElementById('edit_cedula_display');
    if (displayCedula) displayCedula.textContent = est.cedula;

    setValue('edit_nombre', est.nombre);
    setValue('edit_apellido', est.apellido);
    setValue('edit_ano', est.ano || '1er Grado');
    actualizarOpcionesSeccion('edit_ano', 'edit_seccion', est.seccion || 'A');

    setValue('edit_fecha_nacimiento', est.fecha_nacimiento || '');
    setValue('edit_lugar_nacimiento', est.lugar_nacimiento || '');
    setValue('edit_edad', est.edad || '');
    setValue('edit_sexo', est.sexo || 'Masculino');
    setValue('edit_talla_camisa', est.talla_camisa || '');
    setValue('edit_talla_pantalon', est.talla_pantalon || '');
    setValue('edit_talla_zapatos', est.talla_zapatos || '');
    setValue('edit_estado', est.estado || 'Activo');
    setValue('edit_direccion_estudiante', est.direccion_estudiante || '');

    // Madre
    setValue('edit_madre_nombres', est.madre_nombres || '');
    setValue('edit_madre_apellidos', est.madre_apellidos || '');
    setValue('edit_madre_cedula', est.madre_cedula || '');
    setValue('edit_madre_fecha_nac', est.madre_fecha_nac || '');
    setValue('edit_madre_telefono', est.madre_telefono || '');
    setValue('edit_madre_direccion', est.madre_direccion || '');

    // Padre
    setValue('edit_padre_nombres', est.padre_nombres || '');
    setValue('edit_padre_apellidos', est.padre_apellidos || '');
    setValue('edit_padre_cedula', est.padre_cedula || '');
    setValue('edit_padre_fecha_nac', est.padre_fecha_nac || '');
    setValue('edit_padre_telefono', est.padre_telefono || '');
    setValue('edit_padre_direccion', est.padre_direccion || '');

    // Representante
    setValue('edit_rep_nombres', est.rep_nombres || est.representante || '');
    setValue('edit_rep_apellidos', est.rep_apellidos || '');
    setValue('edit_rep_cedula', est.rep_cedula || '');
    setValue('edit_rep_fecha_nac', est.rep_fecha_nac || '');
    setValue('edit_rep_parentesco', est.rep_parentesco || 'Madre');
    setValue('edit_rep_telefono', est.rep_telefono || est.telefono || '');
    setValue('edit_correo', est.correo || '');
    setValue('edit_rep_direccion', est.rep_direccion || '');

    // Observaciones
    setValue('edit_observaciones', est.observaciones || '');

    // Foto de perfil
    const editFileInput = document.getElementById('edit_foto');
    if (editFileInput) editFileInput.value = '';
    const hiddenEliminar = document.getElementById('edit_eliminar_foto');
    if (hiddenEliminar) hiddenEliminar.value = 'false';

    const imgEdit = document.getElementById('edit_foto_img');
    const placeholderEdit = document.getElementById('edit_foto_placeholder');
    const btnRemoveEdit = document.getElementById('btn_remover_edit_foto');

    if (est.foto && est.foto.trim() !== '') {
        if (imgEdit) {
            imgEdit.src = est.foto;
            imgEdit.style.display = 'block';
        }
        if (placeholderEdit) placeholderEdit.style.display = 'none';
        if (btnRemoveEdit) btnRemoveEdit.style.display = 'inline-flex';
    } else {
        if (imgEdit) {
            imgEdit.src = '';
            imgEdit.style.display = 'none';
        }
        if (placeholderEdit) placeholderEdit.style.display = 'flex';
        if (btnRemoveEdit) btnRemoveEdit.style.display = 'none';
    }

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

// ========================================================
// ASCENSIÓN DE GRADO (selección de estudiantes)
// Las reglas de ascenso viven en el servidor (/api/ascensionGrado);
// aquí solo se pide la vista previa, se muestra y se confirma.
// ========================================================

function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function obtenerSeleccionados() {
    return Array.from(document.querySelectorAll('.row-check:checked')).map(c => c.getAttribute('data-cedula'));
}

// Sincroniza casillas de sección, resaltado de filas y el botón "Ascensión de Grado"
function actualizarSeleccion() {
    document.querySelectorAll('.student-row').forEach(row => {
        const chk = row.querySelector('.row-check');
        row.classList.toggle('selected', !!(chk && chk.checked));
    });

    document.querySelectorAll('.group-check').forEach(gc => {
        const grupo = gc.getAttribute('data-group');
        const visibles = Array.from(document.querySelectorAll(`.row-check[data-group="${grupo}"]`))
            .filter(c => c.closest('tr').style.display !== 'none');
        const marcados = visibles.filter(c => c.checked).length;
        gc.checked = visibles.length > 0 && marcados === visibles.length;
        gc.indeterminate = marcados > 0 && marcados < visibles.length;
    });

    const total = document.querySelectorAll('.row-check:checked').length;
    const btn = document.getElementById('btnAscensionGrado');
    const contador = document.getElementById('ascensionCount');
    if (btn) btn.disabled = total === 0;
    if (contador) {
        contador.style.display = total > 0 ? '' : 'none';
        contador.textContent = total;
    }
}

async function enviarAscension(cedulas, aplicar) {
    const resp = await fetch('/api/ascensionGrado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedulas, aplicar })
    });
    return resp.json();
}

function renderResumenAscension(r) {
    let html = `<p style="font-size: 0.95rem; color: #334155; margin-bottom: 12px;">
        Se procesarán <strong>${r.total}</strong> estudiante${r.total === 1 ? '' : 's'}:
    </p><div class="asc-lista">`;

    r.resumen.forEach(item => {
        html += `<div class="asc-item${item.inhabilita ? ' asc-alerta' : ''}">
            <span class="asc-origen">${escaparHtml(item.origen)}</span>
            <span class="asc-flecha">&rarr;</span>
            <span class="asc-destino">${escaparHtml(item.destino)}</span>
            <span class="asc-cant">${item.cantidad}</span>
        </div>`;
    });
    html += '</div>';

    if (r.totalInhabilitan > 0) {
        html += `<div class="asc-aviso">
            <strong>Atención:</strong> los estudiantes de 6to Grado quedarán <strong>Inhabilitados</strong>.
            Seguirán en el sistema y se les podrán hacer procesos, pero ya no formarán parte de la matrícula.
        </div>`;
    }

    const o = r.omitidos || {};
    const omitidos = (o.noActivos || 0) + (o.sinRegla || 0) + (o.noExisten || 0);
    if (omitidos > 0) {
        html += `<div class="asc-aviso neutro">
            ${omitidos} estudiante${omitidos === 1 ? '' : 's'} seleccionado${omitidos === 1 ? '' : 's'}
            no se modificará${omitidos === 1 ? '' : 'n'} (no están activos o no tienen un grado y sección válidos).
        </div>`;
    }
    return html;
}

async function abrirAscension() {
    const cedulas = obtenerSeleccionados();
    if (cedulas.length === 0) return;

    const btn = document.getElementById('btnAscensionGrado');
    if (btn) btn.disabled = true;
    try {
        const r = await enviarAscension(cedulas, false);
        if (!r.exito) {
            showToast(r.mensaje || 'No se pudo preparar la ascensión.', 'error');
            return;
        }
        document.getElementById('ascensionResumen').innerHTML = renderResumenAscension(r);
        abrirModal('modalAscension');
    } catch (e) {
        console.error(e);
        showToast('Error de conexión al preparar la ascensión.', 'error');
    } finally {
        actualizarSeleccion();
    }
}

async function confirmarAscension() {
    const cedulas = obtenerSeleccionados();
    if (cedulas.length === 0) {
        cerrarModal('modalAscension');
        return;
    }

    const btn = document.getElementById('btnConfirmarAscension');
    if (btn) btn.disabled = true;
    try {
        const r = await enviarAscension(cedulas, true);
        if (r.exito) {
            cerrarModal('modalAscension');
            // Se guarda lo necesario para deshacer y se recarga la tabla; al volver a cargar,
            // la burbuja aparece con el tiempo que le quede de los 5 segundos.
            try {
                sessionStorage.setItem('ascensionDeshacer', JSON.stringify({
                    mensaje: r.mensaje || 'Ascensión de grado completada.',
                    cambios: r.deshacer || [],
                    expira: Date.now() + TIEMPO_DESHACER_MS
                }));
            } catch (e) { /* si el navegador no permite sessionStorage, solo se recarga */ }
            location.reload();
        } else {
            showToast(r.mensaje || 'No se pudo aplicar la ascensión.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión al aplicar la ascensión.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// El botón de eliminar guarda los datos en atributos (así los apóstrofes en los nombres no rompen el código)
function eliminarEstudianteDesdeBoton(btn) {
    eliminarEstudiante(btn.getAttribute('data-cedula'), btn.getAttribute('data-nombre'));
}

// Los helpers abrirModal / cerrarModal están en ui.js (ahí tienen la animación de entrada y salida)

// ========================================================
// AVISO FLOTANTE: confirmación de la ascensión con opción de deshacer (5 s)
// Usa el mismo aviso blanco del resto del sistema (showToast de ui.js), así que
// al deshacer simplemente se reemplaza por el mensaje de resultado.
// ========================================================
const TIEMPO_DESHACER_MS = 5000;

function mostrarBurbujaDeshacer() {
    let datos = null;
    try {
        datos = JSON.parse(sessionStorage.getItem('ascensionDeshacer') || 'null');
    } catch (e) { datos = null; }
    if (!datos) return;

    const restante = datos.expira - Date.now();
    if (restante <= 0 || !Array.isArray(datos.cambios) || datos.cambios.length === 0) {
        sessionStorage.removeItem('ascensionDeshacer');
        return;
    }

    showToast(escaparHtml(datos.mensaje), 'success', {
        duracion: restante,
        alExpirar: () => sessionStorage.removeItem('ascensionDeshacer'),
        accion: {
            texto: 'Deshacer',
            onClick: async (btn) => {
                btn.disabled = true;
                try {
                    const resp = await fetch('/api/deshacerAscension', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cambios: datos.cambios })
                    });
                    const r = await resp.json();
                    sessionStorage.removeItem('ascensionDeshacer');
                    if (r.exito) {
                        showToast(r.mensaje || 'Se deshizo la ascensión de grado.');
                        setTimeout(() => location.reload(), 900);
                    } else {
                        showToast(r.mensaje || 'No se pudo deshacer la ascensión.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Error de conexión al deshacer la ascensión.', 'error');
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', mostrarBurbujaDeshacer);

// ========================================================
// AUTOCOMPLETAR REPRESENTANTE (según el parentesco)
// Si el parentesco es Madre o Padre, los datos del representante se copian
// de la sección de la madre o del padre, siempre que ya estén rellenados.
// ========================================================
const CAMPOS_REPRESENTANTE = ['nombres', 'apellidos', 'cedula', 'fecha_nac', 'telefono', 'direccion'];

// Quita las marcas de "rellenado automáticamente" (al abrir un formulario)
function reiniciarAutocompletadoRepresentante() {
    ['', 'edit_'].forEach(prefijo => {
        CAMPOS_REPRESENTANTE.forEach(nombre => {
            const campo = document.getElementById(`${prefijo}rep_${nombre}`);
            if (campo) delete campo.dataset.auto;
        });
    });
}

function configurarAutocompletarRepresentante(prefijo) {
    const selParentesco = document.getElementById(`${prefijo}rep_parentesco`);
    if (!selParentesco) return;
    const campo = (quien, nombre) => document.getElementById(`${prefijo}${quien}_${nombre}`);

    // forzar = true cuando la persona cambia el parentesco (se sobrescribe lo que haya);
    // forzar = false cuando solo cambió un dato de la madre o del padre (no se pisa lo escrito a mano).
    function rellenar(forzar) {
        const quien = selParentesco.value === 'Madre' ? 'madre' : (selParentesco.value === 'Padre' ? 'padre' : null);
        CAMPOS_REPRESENTANTE.forEach(nombre => {
            const destino = campo('rep', nombre);
            if (!destino) return;
            const origen = quien ? campo(quien, nombre) : null;
            const valor = origen ? origen.value.trim() : '';

            if (valor !== '') {
                if (forzar || destino.value.trim() === '' || destino.dataset.auto === '1') {
                    destino.value = valor;
                    destino.dataset.auto = '1';
                }
            } else if (destino.dataset.auto === '1') {
                // Lo que se había copiado ya no aplica (cambió el parentesco o se vació el origen)
                destino.value = '';
                delete destino.dataset.auto;
            }
        });
    }

    selParentesco.addEventListener('change', () => rellenar(true));

    CAMPOS_REPRESENTANTE.forEach(nombre => {
        const destino = campo('rep', nombre);
        // Si la persona escribe en un dato del representante, ya no se toca automáticamente
        if (destino) destino.addEventListener('input', () => { delete destino.dataset.auto; });

        ['madre', 'padre'].forEach(quien => {
            const origen = campo(quien, nombre);
            if (!origen) return;
            ['input', 'change'].forEach(evento => origen.addEventListener(evento, () => rellenar(false)));
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarAutocompletarRepresentante('');
    configurarAutocompletarRepresentante('edit_');
});

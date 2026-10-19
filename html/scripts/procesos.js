// ========================================================
// GESTIÓN DE PROCESOS INSTITUCIONALES
// Escuela "Las Américas"
// ========================================================

let currentReqPrefix = 'nuevo'; // 'nuevo' o 'edit'
let currentEstudianteData = null;

// Tipos de procesos con requisitos específicos configurados
const PROCESOS_CON_REQUISITOS = [
    'Planilla de Inscripción',
    'Carta de Buena Conducta',
    'Carta de Aceptación',
    'Carta de Retiro',
    'Constancia de Promoción'
];

function esTipoConRequisitos(tipo) {
    if (!tipo) return false;
    return PROCESOS_CON_REQUISITOS.some(t => tipo.toLowerCase().includes(t.toLowerCase()));
}

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
            const coincideTipo = !tipoSeleccionado || tipo.includes(tipoSeleccionado);
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
            // Una opción deshabilitada no viaja con el formulario; el tipo del proceso se envía aparte.
            formData.set('tipo_proceso', document.getElementById('edit_tipo_proceso').value);

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

// ========================================================
// MANEJO DE EVENTOS AL SELECCIONAR ESTUDIANTE / TIPO PROCESO
// ========================================================

function obtenerEstudianteCompleto(cedula) {
    if (!cedula) return null;
    const script = document.getElementById('estudiantes_json');
    if (script) {
        try {
            const list = JSON.parse(script.textContent || '[]');
            const found = list.find(e => String(e.cedula) === String(cedula));
            if (found) return found;
        } catch (e) {
            console.error('Error al parsear estudiantes_json:', e);
        }
    }
    return null;
}

function onEstudianteSeleccionado(prefix) {
    const select = document.getElementById(`${prefix}_proceso_estudiante`);
    if (!select) return;

    const opt = select.selectedOptions[0];
    if (opt && opt.value) {
        const full = obtenerEstudianteCompleto(opt.value);
        if (full) {
            currentEstudianteData = full;
        } else {
            currentEstudianteData = {
                cedula: opt.getAttribute('data-cedula') || opt.value,
                nombre: opt.getAttribute('data-nombre') || '',
                apellido: opt.getAttribute('data-apellido') || '',
                ano: opt.getAttribute('data-ano') || '',
                seccion: opt.getAttribute('data-seccion') || '',
                representante: opt.getAttribute('data-representante') || '',
                telefono: opt.getAttribute('data-telefono') || '',
                correo: opt.getAttribute('data-correo') || '',
                foto: opt.getAttribute('data-foto') || ''
            };
        }
    } else {
        currentEstudianteData = null;
    }

    // Sincronizar con el selector dentro de la ventana de requisitos si estuviera abierta
    const reqSelect = document.getElementById('req_estudiante_select');
    if (reqSelect && opt && opt.value) {
        reqSelect.value = opt.value;
    }
}

function onTipoProcesoSeleccionado(prefix) {
    const tipoSelect = document.getElementById(`${prefix}_tipo_proceso`);
    if (!tipoSelect) return;
    const tipo = tipoSelect.value;
    const box = document.getElementById(`${prefix}_requisitos_box`);

    if (esTipoConRequisitos(tipo)) {
        if (box) box.style.display = 'block';

        // Abre directamente la ventana de requisitos SOBRE la ventana de solicitud
        abrirVentanaRequisitos(prefix);
    } else {
        if (box) box.style.display = 'none';
        const inputHidden = document.getElementById(`${prefix}_datos_especificos`);
        if (inputHidden) inputHidden.value = '';
    }
}

// Evento cuando se selecciona o cambia el estudiante dentro de la ventana de requisitos
async function alCambiarEstudianteEnRequisitos(cedula) {
    const reqSelect = document.getElementById('req_estudiante_select');
    if (!reqSelect || !cedula) {
        currentEstudianteData = null;
        renderizarFormularioRequisitos();
        return;
    }

    const full = obtenerEstudianteCompleto(cedula);
    if (full) {
        currentEstudianteData = full;
    } else {
        try {
            const resp = await fetch(`/api/estudiante/${cedula}`);
            const json = await resp.json();
            if (json.exito && json.estudiante) {
                currentEstudianteData = json.estudiante;
            }
        } catch (e) {
            const opt = reqSelect.selectedOptions[0];
            if (opt) {
                currentEstudianteData = {
                    cedula: opt.getAttribute('data-cedula') || opt.value,
                    nombre: opt.getAttribute('data-nombre') || '',
                    apellido: opt.getAttribute('data-apellido') || '',
                    ano: opt.getAttribute('data-ano') || '',
                    seccion: opt.getAttribute('data-seccion') || '',
                    representante: opt.getAttribute('data-representante') || '',
                    telefono: opt.getAttribute('data-telefono') || '',
                    correo: opt.getAttribute('data-correo') || '',
                    foto: opt.getAttribute('data-foto') || ''
                };
            }
        }
    }

    // Sincronizar inmediatamente con el formulario principal
    if (currentReqPrefix === 'nuevo') {
        const mainSelect = document.getElementById('nuevo_proceso_estudiante');
        if (mainSelect) mainSelect.value = cedula;
    }

    // Actualizar indicador de autocompletado
    const badge = document.getElementById('req_autocompletado_badge');
    if (badge && currentEstudianteData) {
        badge.style.display = 'inline-block';
        badge.textContent = `✓ ${currentEstudianteData.nombre || ''} ${currentEstudianteData.apellido || ''} autocompletado`;
    }

    // Re-renderizar los campos de requisitos con los datos autocompletados
    renderizarFormularioRequisitos();
}

// ========================================================
// VENTANA MODAL DE REQUISITOS ESPECÍFICOS (SE ABRE SOBRE EL PROCESO)
// ========================================================

async function abrirVentanaRequisitos(prefix) {
    currentReqPrefix = prefix;
    const tipo = document.getElementById(`${prefix}_tipo_proceso`).value;
    if (!tipo) {
        showToast('Seleccione un tipo de proceso primero', 'error');
        return;
    }

    const studentWrapper = document.getElementById('req_student_selector_wrapper');

    // Obtener datos del estudiante actual
    if (prefix === 'nuevo') {
        if (studentWrapper) studentWrapper.style.display = 'block';
        const opt = document.getElementById('nuevo_proceso_estudiante').selectedOptions[0];
        if (opt && opt.value) {
            const full = obtenerEstudianteCompleto(opt.value);
            currentEstudianteData = full || {
                cedula: opt.getAttribute('data-cedula') || opt.value,
                nombre: opt.getAttribute('data-nombre') || '',
                apellido: opt.getAttribute('data-apellido') || '',
                ano: opt.getAttribute('data-ano') || '',
                seccion: opt.getAttribute('data-seccion') || '',
                representante: opt.getAttribute('data-representante') || '',
                telefono: opt.getAttribute('data-telefono') || '',
                correo: opt.getAttribute('data-correo') || '',
                foto: opt.getAttribute('data-foto') || ''
            };
            const reqSelect = document.getElementById('req_estudiante_select');
            if (reqSelect) reqSelect.value = opt.value;
        } else {
            const reqSelect = document.getElementById('req_estudiante_select');
            if (reqSelect) reqSelect.value = '';
            currentEstudianteData = null;
        }
    } else if (prefix === 'edit') {
        // En edición el estudiante ya está asignado
        if (studentWrapper) studentWrapper.style.display = 'none';
        const cedula = document.getElementById('edit_proceso_cedula').value;
        if (cedula && (!currentEstudianteData || currentEstudianteData.cedula !== cedula)) {
            const full = obtenerEstudianteCompleto(cedula);
            if (full) {
                currentEstudianteData = full;
            } else {
                try {
                    const resp = await fetch(`/api/estudiante/${cedula}`);
                    const json = await resp.json();
                    if (json.exito && json.estudiante) {
                        currentEstudianteData = json.estudiante;
                    }
                } catch (e) {
                    console.error('Error al obtener estudiante:', e);
                }
            }
        }
    }

    // Título del modal
    document.getElementById('modalRequisitosTitulo').textContent = `Requisitos: ${tipo}`;
    document.getElementById('modalRequisitosSubtitulo').textContent = currentEstudianteData
        ? `Estudiante: ${currentEstudianteData.nombre || ''} ${currentEstudianteData.apellido || ''} (C.I: ${currentEstudianteData.cedula || ''}) — Datos autocompletados`
        : 'Seleccione el estudiante de la base de datos para autocompletar la información.';

    // Renderizar formulario
    renderizarFormularioRequisitos();

    // Abrir modal sobre la ventana actual (con mayor z-index)
    abrirModal('modalRequisitosProceso');
}

function renderizarFormularioRequisitos() {
    const tipo = document.getElementById(`${currentReqPrefix}_tipo_proceso`).value;
    
    // Obtener valores previos si ya se habían llenado
    let datosPrevios = {};
    const inputHidden = document.getElementById(`${currentReqPrefix}_datos_especificos`);
    if (inputHidden && inputHidden.value) {
        try {
            datosPrevios = JSON.parse(inputHidden.value);
        } catch (e) {
            datosPrevios = {};
        }
    }

    const container = document.getElementById('contenedorRequisitosDinamicos');
    if (container) {
        container.innerHTML = construirHTMLRequisitos(tipo, currentEstudianteData || {}, datosPrevios);
    }
}

function cerrarVentanaRequisitos() {
    cerrarModal('modalRequisitosProceso');
}

// Construye el HTML dinámico con autocompletado inteligente
function construirHTMLRequisitos(tipo, est, prev) {
    const tieneEstudiante = est && est.cedula;

    // Si aún no ha seleccionado estudiante, pedirlo amablemente
    if (!tieneEstudiante) {
        return `
            <div style="text-align: center; padding: 2.5rem 1.5rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; margin: 0.5rem 0;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--color-primario); margin: 0 auto 0.75rem; display: block;">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 6px;">Seleccione un estudiante arriba</h4>
                <p style="font-size: 0.88rem; color: #64748b; max-width: 440px; margin: 0 auto;">
                    Elija un estudiante registrado en la base de datos para autocompletar automáticamente sus nombres, cédula, grado y representantes.
                </p>
            </div>
        `;
    }

    const v = (key, fallback = '') => {
        if (prev && prev[key] !== undefined && prev[key] !== null && String(prev[key]).trim() !== '') {
            return prev[key];
        }
        return fallback !== undefined && fallback !== null ? fallback : '';
    };

    const nombreCompleto = `${est.nombre || ''} ${est.apellido || ''}`.trim();
    const gradoActual = est.ano ? `${est.ano} "${est.seccion || 'A'}"` : '1er Grado "A"';

    // Barra visual de estudiante autocompletado
    const bannerAutocompletado = `
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div>
                <span style="font-size: 0.72rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">✓ Estudiante Autocompletado desde Base de Datos:</span>
                <p style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-top: 1px;">
                    ${nombreCompleto} &nbsp;&bull;&nbsp; C.I: <strong>${est.cedula}</strong> &nbsp;&bull;&nbsp; ${gradoActual}
                </p>
            </div>
            <span style="background: #dcfce7; color: #15803d; font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; white-space: nowrap;">
                Registrado
            </span>
        </div>
    `;

    // 1. PLANILLA DE INSCRIPCIÓN
    if (tipo.includes('Planilla de Inscripción') || tipo.includes('Inscripción')) {
        return `
            ${bannerAutocompletado}
            <input type="hidden" name="est_nombres" value="${est.nombre || ''}">
            <input type="hidden" name="est_apellidos" value="${est.apellido || ''}">
            <input type="hidden" name="est_cedula" value="${est.cedula || ''}">

            <!-- 1. DATOS DEL ESTUDIANTE (AUTOCOMPLETADOS DESDE LA BASE DE DATOS) -->
            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    1. Datos del Estudiante (Autocompletados)
                </div>
                <div class="form-grid-3">
                    <div class="form-field-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="est_fecha_nac" value="${v('est_fecha_nac', est.fecha_nacimiento || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Edad</label>
                        <input type="text" name="est_edad" placeholder="Ej: 7 años" value="${v('est_edad', est.edad ? (est.edad.toString().includes('año') ? est.edad : est.edad + ' años') : '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Sexo</label>
                        <select name="est_sexo">
                            <option value="Masculino" ${v('est_sexo', est.sexo || 'Masculino') === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="Femenino" ${v('est_sexo', est.sexo || 'Masculino') === 'Femenino' ? 'selected' : ''}>Femenino</option>
                        </select>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Lugar de Nacimiento</label>
                        <input type="text" name="est_lugar_nac" placeholder="Ej: Caracas, Dto. Capital" value="${v('est_lugar_nac', est.lugar_nacimiento || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Dirección de Habitación</label>
                        <input type="text" name="est_direccion" placeholder="Dirección de residencia" value="${v('est_direccion', est.direccion_estudiante || '')}">
                    </div>
                </div>
                <div class="form-grid-3">
                    <div class="form-field-group">
                        <label>Talla de Camisa</label>
                        <input type="text" name="est_talla_camisa" placeholder="Ej: 8, 10, 12, S" value="${v('est_talla_camisa', est.talla_camisa || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Talla de Pantalón</label>
                        <input type="text" name="est_talla_pantalon" placeholder="Ej: 8, 10, 12, 14" value="${v('est_talla_pantalon', est.talla_pantalon || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Talla de Zapatos</label>
                        <input type="text" name="est_talla_zapatos" placeholder="Ej: 30, 32, 34" value="${v('est_talla_zapatos', est.talla_zapatos || '')}">
                    </div>
                </div>
            </div>

            <!-- 2. DATOS DE LA MADRE (AUTOCOMPLETADOS DESDE LA BASE DE DATOS) -->
            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                    2. Datos de la Madre (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Nombres</label>
                        <input type="text" name="madre_nombres" placeholder="Nombres de la madre" value="${v('madre_nombres', est.madre_nombres || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Apellidos</label>
                        <input type="text" name="madre_apellidos" placeholder="Apellidos de la madre" value="${v('madre_apellidos', est.madre_apellidos || '')}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Cédula de Identidad</label>
                        <input type="text" name="madre_cedula" placeholder="Ej: V-14.882.100" value="${v('madre_cedula', est.madre_cedula || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="madre_fecha_nac" value="${v('madre_fecha_nac', est.madre_fecha_nac || '')}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Dirección</label>
                        <input type="text" name="madre_direccion" placeholder="Dirección de habitación" value="${v('madre_direccion', est.madre_direccion || est.direccion_estudiante || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>N° de Teléfono</label>
                        <input type="text" name="madre_telefono" placeholder="Ej: 0414-1234567" value="${v('madre_telefono', est.madre_telefono || '')}">
                    </div>
                </div>
            </div>

            <!-- 3. DATOS DEL PADRE (AUTOCOMPLETADOS DESDE LA BASE DE DATOS) -->
            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                    3. Datos del Padre (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Nombres</label>
                        <input type="text" name="padre_nombres" placeholder="Nombres del padre" value="${v('padre_nombres', est.padre_nombres || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Apellidos</label>
                        <input type="text" name="padre_apellidos" placeholder="Apellidos del padre" value="${v('padre_apellidos', est.padre_apellidos || '')}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Cédula de Identidad</label>
                        <input type="text" name="padre_cedula" placeholder="Ej: V-13.456.789" value="${v('padre_cedula', est.padre_cedula || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="padre_fecha_nac" value="${v('padre_fecha_nac', est.padre_fecha_nac || '')}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Dirección</label>
                        <input type="text" name="padre_direccion" placeholder="Dirección de habitación" value="${v('padre_direccion', est.padre_direccion || est.direccion_estudiante || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>N° de Teléfono</label>
                        <input type="text" name="padre_telefono" placeholder="Ej: 0424-9876543" value="${v('padre_telefono', est.padre_telefono || '')}">
                    </div>
                </div>
            </div>

            <!-- 4. DATOS DEL REPRESENTANTE (AUTOCOMPLETADOS DESDE LA BASE DE DATOS) -->
            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    4. Datos del Representante Legal (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Nombres</label>
                        <input type="text" name="rep_nombres" placeholder="Nombres del representante" value="${v('rep_nombres', est.rep_nombres || est.representante || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Apellidos</label>
                        <input type="text" name="rep_apellidos" placeholder="Apellidos del representante" value="${v('rep_apellidos', est.rep_apellidos || '')}">
                    </div>
                </div>
                <div class="form-grid-3">
                    <div class="form-field-group">
                        <label>Cédula</label>
                        <input type="text" name="rep_cedula" placeholder="Ej: V-15.654.321" value="${v('rep_cedula', est.rep_cedula || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="rep_fecha_nac" value="${v('rep_fecha_nac', est.rep_fecha_nac || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Parentesco</label>
                        <select name="rep_parentesco">
                            <option value="Madre" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Madre' ? 'selected' : ''}>Madre</option>
                            <option value="Padre" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Padre' ? 'selected' : ''}>Padre</option>
                            <option value="Abuelo/a" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Abuelo/a' ? 'selected' : ''}>Abuelo/a</option>
                            <option value="Tío/a" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Tío/a' ? 'selected' : ''}>Tío/a</option>
                            <option value="Tutor Legal" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Tutor Legal' ? 'selected' : ''}>Tutor Legal</option>
                            <option value="Otro" ${v('rep_parentesco', est.rep_parentesco || 'Madre') === 'Otro' ? 'selected' : ''}>Otro</option>
                        </select>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Dirección</label>
                        <input type="text" name="rep_direccion" placeholder="Dirección de habitación" value="${v('rep_direccion', est.rep_direccion || est.direccion_estudiante || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>N° de Teléfono</label>
                        <input type="text" name="rep_telefono" placeholder="Ej: 0412-5551234" value="${v('rep_telefono', est.rep_telefono || est.telefono || '')}">
                    </div>
                </div>
            </div>
        `;
    }

    // 2. CARTA DE BUENA CONDUCTA
    if (tipo.includes('Buena Conducta')) {
        return `
            ${bannerAutocompletado}
            <input type="hidden" name="est_nombre_completo" value="${nombreCompleto}">
            <input type="hidden" name="est_cedula" value="${est.cedula || ''}">

            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Datos de la Carta de Buena Conducta (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Lugar de Nacimiento</label>
                        <input type="text" name="est_lugar_nac" placeholder="Ej: Caracas, Dto. Capital" value="${v('est_lugar_nac', est.lugar_nacimiento || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Dirección de Habitación</label>
                        <input type="text" name="est_direccion" placeholder="Dirección de residencia del alumno" value="${v('est_direccion', est.direccion_estudiante || '')}">
                    </div>
                </div>
                <div class="form-field-group">
                    <label>Concepto de Conducta Observada</label>
                    <textarea name="conducta_observacion" rows="3" style="resize: vertical;">${v('conducta_observacion', 'Ha observado intachable conducta, alto sentido de responsabilidad, disciplina y respeto hacia el personal docente y compañeros.')}</textarea>
                </div>
            </div>
        `;
    }

    // 3. CARTA DE ACEPTACIÓN
    if (tipo.includes('Aceptación')) {
        return `
            ${bannerAutocompletado}
            <input type="hidden" name="est_nombre_completo" value="${nombreCompleto}">
            <input type="hidden" name="est_cedula" value="${est.cedula || ''}">

            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Datos de la Carta de Aceptación (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Lugar de Nacimiento</label>
                        <input type="text" name="est_lugar_nac" placeholder="Ej: Caracas, Dto. Capital" value="${v('est_lugar_nac', est.lugar_nacimiento || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Dirección de Habitación</label>
                        <input type="text" name="est_direccion" placeholder="Dirección de habitación" value="${v('est_direccion', est.direccion_estudiante || '')}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Grado y Sección Aceptado</label>
                        <input type="text" name="grado_aceptado" placeholder="Ej: 2do Grado &quot;B&quot;" value="${v('grado_aceptado', gradoActual)}">
                    </div>
                    <div class="form-field-group">
                        <label>Año Escolar</label>
                        <input type="text" name="ano_escolar" placeholder="Ej: 2026 - 2027" value="${v('ano_escolar', '2026 - 2027')}">
                    </div>
                </div>
            </div>
        `;
    }

    // 4. CARTA DE RETIRO
    if (tipo.includes('Retiro')) {
        return `
            ${bannerAutocompletado}
            <input type="hidden" name="est_nombre_completo" value="${nombreCompleto}">
            <input type="hidden" name="grado_seccion" value="${gradoActual}">

            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Datos de la Carta de Retiro (Autocompletados)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Edad del Alumno</label>
                        <input type="text" name="est_edad" placeholder="Ej: 9 años" value="${v('est_edad', est.edad ? (est.edad.toString().includes('año') ? est.edad : est.edad + ' años') : '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Lugar de Nacimiento</label>
                        <input type="text" name="est_lugar_nac" placeholder="Ej: Caracas" value="${v('est_lugar_nac', est.lugar_nacimiento || '')}">
                    </div>
                </div>
                <div class="form-field-group">
                    <label>Motivo del Retiro *</label>
                    <input type="text" name="motivo_retiro" placeholder="Ej: Cambio de residencia familiar / Mudanza / Traslado" value="${v('motivo_retiro', '')}" required>
                </div>
                <div class="form-field-group">
                    <label>Plantel / Escuela de Destino (Opcional)</label>
                    <input type="text" name="escuela_destino" placeholder="Nombre de la nueva institución" value="${v('escuela_destino', '')}">
                </div>
            </div>
        `;
    }

    // 5. CONSTANCIA / CERTIFICADO DE PROMOCIÓN (6TO GRADO)
    if (tipo.includes('Promoción') || tipo.includes('Certificado')) {
        const edadFecha = (est.edad ? `${est.edad} años` : '') + (est.fecha_nacimiento ? ` / ${est.fecha_nacimiento}` : '');
        return `
            ${bannerAutocompletado}
            <input type="hidden" name="est_nombre_completo" value="${nombreCompleto}">
            <input type="hidden" name="est_cedula" value="${est.cedula || ''}">

            <div class="req-subcard">
                <div class="req-subcard-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15l-2 5l9-9l-9-9l2 5l-7 4z"/></svg>
                    Datos para el Certificado de Promoción (6to Grado)
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Lugar de Nacimiento (L. de Nacimiento)</label>
                        <input type="text" name="est_lugar_nac" placeholder="Ej: Caracas, Dto. Capital" value="${v('est_lugar_nac', est.lugar_nacimiento || '')}">
                    </div>
                    <div class="form-field-group">
                        <label>Edad / Fecha de Nacimiento</label>
                        <input type="text" name="est_edad_fecha_nac" placeholder="Ej: 11 años / 14-06-2015" value="${v('est_edad_fecha_nac', edadFecha)}">
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-field-group">
                        <label>Literal Obtenido *</label>
                        <select name="literal_obtenido">
                            <option value="A" ${v('literal_obtenido', 'A') === 'A' ? 'selected' : ''}>"A" - Todas las competencias y en algunos casos superó las expectativas</option>
                            <option value="B" ${v('literal_obtenido') === 'B' ? 'selected' : ''}>"B" - Todas las competencias previstas para el grado</option>
                            <option value="C" ${v('literal_obtenido') === 'C' ? 'selected' : ''}>"C" - La mayoría de las competencias previstas</option>
                            <option value="D" ${v('literal_obtenido') === 'D' ? 'selected' : ''}>"D" - Algunas competencias; requiere nivelación</option>
                        </select>
                    </div>
                    <div class="form-field-group">
                        <label>Año Escolar Cursado</label>
                        <input type="text" name="ano_escolar_cursado" placeholder="Ej: 2026 - 2027" value="${v('ano_escolar_cursado', '2026 - 2027')}">
                    </div>
                </div>
            </div>
        `;
    }

    return `<p style="padding: 1rem; color: #64748b;">Este tipo de trámite no requiere campos adicionales obligatorios.</p>`;
}

// Guarda los datos del formulario de requisitos y regresa a la ventana de solicitud de proceso
function guardarRequisitosYRegresar() {
    const formReq = document.getElementById('formRequisitosProceso');
    if (!formReq) return;

    if (!currentEstudianteData || !currentEstudianteData.cedula) {
        showToast('Debe seleccionar un estudiante de la base de datos', 'error');
        return;
    }

    // Validar campos requeridos
    if (!formReq.checkValidity()) {
        formReq.reportValidity();
        return;
    }

    const formData = new FormData(formReq);
    const datosObj = {};
    for (let [key, val] of formData.entries()) {
        datosObj[key] = val.trim();
    }

    const prefix = currentReqPrefix;
    const jsonStr = JSON.stringify(datosObj);

    // Guardar en el input hidden del modal de proceso
    const inputHidden = document.getElementById(`${prefix}_datos_especificos`);
    if (inputHidden) {
        inputHidden.value = jsonStr;
    }

    // Sincronizar selección del estudiante en el formulario de proceso
    if (prefix === 'nuevo') {
        const mainSelect = document.getElementById('nuevo_proceso_estudiante');
        if (mainSelect) mainSelect.value = currentEstudianteData.cedula;
    }

    // Actualizar indicador visual en el modal de proceso
    const badge = document.getElementById(`${prefix}_req_badge`);
    const summary = document.getElementById(`${prefix}_req_summary`);
    if (badge) {
        badge.className = 'badge-status-req';
        badge.textContent = '✓ Requisitos completados';
    }

    // Auto-generar descripción resumida en la solicitud de proceso
    const tipo = document.getElementById(`${prefix}_tipo_proceso`).value;
    const descField = document.getElementById(`${prefix}_descripcion_proceso`);

    let autoDesc = '';
    if (tipo.includes('Planilla')) {
        autoDesc = `Planilla de inscripción formalizada para el estudiante y representantes legales.`;
        if (summary) summary.textContent = `Datos de estudiante, padre, madre y representante registrados.`;
    } else if (tipo.includes('Buena Conducta')) {
        autoDesc = `Carta de Buena Conducta emitida para ${datosObj.est_nombre_completo || currentEstudianteData.nombre}.`;
        if (summary) summary.textContent = `Conducta y residencia certificadas.`;
    } else if (tipo.includes('Aceptación')) {
        autoDesc = `Carta de aceptación para ${datosObj.grado_aceptado || currentEstudianteData.ano} (Período ${datosObj.ano_escolar || '2026 - 2027'}).`;
        if (summary) summary.textContent = `Aceptado/a en ${datosObj.grado_aceptado || ''} (${datosObj.ano_escolar || ''}).`;
    } else if (tipo.includes('Retiro')) {
        autoDesc = `Retiro de estudiante. Motivo: ${datosObj.motivo_retiro || 'Traslado'}.`;
        if (summary) summary.textContent = `Motivo: ${datosObj.motivo_retiro || 'No especificado'}.`;
    } else if (tipo.includes('Promoción')) {
        autoDesc = `Certificado de Promoción de 6to Grado con calificación literal "${datosObj.literal_obtenido || 'A'}" (${datosObj.ano_escolar_cursado || '2026 - 2027'}).`;
        if (summary) summary.textContent = `Promovido con literal "${datosObj.literal_obtenido || 'A'}".`;
    }

    if (descField && (!descField.value.trim() || descField.value.startsWith('Planilla') || descField.value.startsWith('Carta') || descField.value.startsWith('Retiro') || descField.value.startsWith('Certificado'))) {
        descField.value = autoDesc;
    }

    // Cerrar la ventana emergente de requisitos dejando al usuario en la solicitud
    cerrarVentanaRequisitos();
    showToast('Requisitos guardados. Listo para registrar el proceso.', 'success');
}

// Modal Nuevo Proceso
function abrirModalNuevoProceso() {
    const form = document.getElementById('formNuevoProceso');
    if (form) form.reset();

    currentEstudianteData = null;
    const hiddenDatos = document.getElementById('nuevo_datos_especificos');
    if (hiddenDatos) hiddenDatos.value = '';
    
    // Por defecto la fecha del proceso es la fecha actual del día que se emite, permitiendo modificarla
    const fechaInput = document.getElementById('nuevo_fecha_proceso');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    const box = document.getElementById('nuevo_requisitos_box');
    if (box) box.style.display = 'none';

    const badge = document.getElementById('nuevo_req_badge');
    if (badge) {
        badge.className = 'badge-status-req pendiente';
        badge.textContent = '⚠️ Requisitos pendientes';
    }

    const summary = document.getElementById('nuevo_req_summary');
    if (summary) summary.textContent = 'Este trámite cuenta con campos específicos requeridos.';

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
    const datosEspecificos = btn.getAttribute('data-datos_especificos') || '';

    document.getElementById('edit_proceso_id').value = id;
    document.getElementById('edit_proceso_cedula').value = cedula;
    document.getElementById('edit_proceso_estudiante_info').textContent = `${estudiante} (C.I: ${cedula})`;
    // Si el proceso es de un tipo que ya no está en la lista (por ejemplo, uno que se quitó),
    // se agrega una opción temporal para que el tipo no se pierda al editar.
    const selectTipoEdit = document.getElementById('edit_tipo_proceso');
    selectTipoEdit.querySelectorAll('option[data-temporal]').forEach(o => o.remove());
    if (tipo && !Array.from(selectTipoEdit.options).some(o => o.value === tipo)) {
        const opcionTemporal = document.createElement('option');
        opcionTemporal.value = tipo;
        opcionTemporal.textContent = `${tipo} (ya no disponible)`;
        opcionTemporal.disabled = true;
        opcionTemporal.setAttribute('data-temporal', '1');
        selectTipoEdit.appendChild(opcionTemporal);
    }
    selectTipoEdit.value = tipo;
    document.getElementById('edit_fecha_proceso').value = fecha;
    document.getElementById('edit_estado_proceso').value = estado;
    document.getElementById('edit_descripcion_proceso').value = descripcion;
    document.getElementById('edit_datos_especificos').value = datosEspecificos;

    const box = document.getElementById('edit_requisitos_box');
    const badge = document.getElementById('edit_req_badge');
    const summary = document.getElementById('edit_req_summary');

    if (esTipoConRequisitos(tipo)) {
        if (box) box.style.display = 'block';
        if (datosEspecificos && datosEspecificos.trim() !== '' && datosEspecificos !== '{}') {
            if (badge) {
                badge.className = 'badge-status-req';
                badge.textContent = '✓ Requisitos guardados';
            }
            if (summary) summary.textContent = 'Requisitos específicos configurados para este trámite.';
        } else {
            if (badge) {
                badge.className = 'badge-status-req pendiente';
                badge.textContent = '⚠️ Requisitos pendientes';
            }
            if (summary) summary.textContent = 'Este trámite cuenta con campos específicos sin completar.';
        }
    } else {
        if (box) box.style.display = 'none';
    }

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

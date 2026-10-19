const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const connect = require('../db.js');
const { TEMAS, TEMA_POR_DEFECTO } = require('../temas.js');

const upload = multer();

// Configuración de almacenamiento para fotos de perfil de estudiantes
const uploadsDir = path.join(__dirname, '../html/uploads/estudiantes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storageFoto = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'estudiante-' + uniqueSuffix + ext);
    }
});

const uploadFotoEstudiante = multer({
    storage: storageFoto,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

// Identificador único de este arranque del servidor. Va dentro de cada token de sesión,
// así que al apagar y volver a encender el servidor las sesiones anteriores dejan de valer
// y se vuelve a pedir el login (aunque el navegador conserve la cookie).
const ARRANQUE_ID = require('crypto').randomUUID();

function verificarToken(token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_gestor_procesos_2026_seguro');
    if (payload.arranque !== ARRANQUE_ID) {
        throw new Error('La sesión pertenece a un arranque anterior del servidor.');
    }
    return payload;
}

// Middleware de verificación de autenticación
const verificarAutenticacion = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/');
    }
    try {
        const verificado = verificarToken(token);
        req.usuario = verificado;
        res.locals.usuarioActual = verificado.nombre_completo || verificado.usuario || 'LILIAN TINTORI';
        res.locals.usuarioLogin = verificado.usuario || 'admin';
        next();
    } catch (error) {
        res.clearCookie('auth_token');
        return res.redirect('/');
    }
};

// ==========================================
// VISTAS Y AUTENTICACIÓN
// ==========================================

// Login GET
router.get('/', (req, res) => {
    const token = req.cookies.auth_token;
    if (token) {
        try {
            verificarToken(token);
            return res.redirect('/inicio');
        } catch (error) {
            res.clearCookie('auth_token');
        }
    }
    res.render('login', { error: null });
});

// Login POST
router.post('/login', upload.none(), async (req, res) => {
    console.log(">> Petición recibida en /login. Body:", req.body);
    const JWT_SECRET = process.env.JWT_SECRET || 'secreto_gestor_procesos_2026_seguro';
    try {
        const { usuario, contrasena } = req.body;
        if (!usuario || !contrasena) {
            console.log(">> Faltan campos en req.body");
            return res.status(400).json({ exito: false, mensaje: 'Por favor complete todos los campos.' });
        }

        // Consulta usando query genérica
        const usuarios = await connect.query('SELECT * FROM usuarios WHERE user = ? LIMIT 1', [usuario.trim()]);
        console.log(">> Resultado de usuarios:", usuarios);
        
        if (usuarios && usuarios.length > 0) {
            const usuarioObj = usuarios[0];
            const coincide = await bcrypt.compare(contrasena, usuarioObj.hash);
            console.log(">> ¿Coincide la contraseña?:", coincide);
            
            if (coincide) {
                const token = jwt.sign(
                    { 
                        id: usuarioObj.id, 
                        usuario: usuarioObj.user, 
                        nombre_completo: usuarioObj.nombre_completo || 'LILIAN TINTORI',
                        rol: usuarioObj.rol,
                        arranque: ARRANQUE_ID
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: false,
                    maxAge: 24 * 60 * 60 * 1000,
                    sameSite: 'lax'
                });

                return res.json({ exito: true, mensaje: 'Acceso autorizado', redirect: '/inicio' });
            }
        }

        return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos.' });
    } catch (error) {
        console.error('>> DETALLE DEL ERROR 500:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/');
});

// ==========================================
// PANEL DE INICIO (DASHBOARD)
// ==========================================
router.get('/inicio', verificarAutenticacion, async (req, res) => {
    try {
        const usuarios = await connect.query(
            'SELECT nombre_completo FROM usuarios WHERE user = ? LIMIT 1',
            [req.usuario.usuario]
        );
        const nombreUsuario = (usuarios && usuarios[0] && usuarios[0].nombre_completo) || req.usuario.nombre_completo || 'LILIAN TINTORI';

        const totalEstudiantesRes = await connect.query("SELECT COUNT(*) as total FROM estudiantes");

        // Una sola consulta para los tres contadores de procesos
        const conteoProcesos = await connect.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END), 0) AS completados,
                COALESCE(SUM(CASE WHEN estado = 'En Trámite' THEN 1 ELSE 0 END), 0) AS en_tramite
            FROM procesos
        `);
        const c = (conteoProcesos && conteoProcesos[0]) || {};

        res.render('inicio', {
            paginaActiva: 'inicio',
            nombreUsuario: nombreUsuario.toUpperCase(),
            totalEstudiantes: (totalEstudiantesRes[0] && totalEstudiantesRes[0].total) || 0,
            totalProcesos: c.total || 0,
            totalCompletados: c.completados || 0,
            totalEnTramite: c.en_tramite || 0
        });
    } catch (error) {
        console.error('Error en /inicio:', error);
        res.render('inicio', {
            paginaActiva: 'inicio',
            nombreUsuario: req.usuario.nombre_completo || 'LILIAN TINTORI',
            totalEstudiantes: 0,
            totalProcesos: 0,
            totalCompletados: 0,
            totalEnTramite: 0
        });
    }
});

// ==========================================
// SECCIÓN DE PROCESOS INSTITUCIONALES
// ==========================================
// Mantiene la numeración de los procesos consecutiva (1, 2, 3, ...) sin huecos.
// Cuando se borra un proceso, los siguientes bajan de número y el próximo nuevo toma el siguiente libre.
// Los ids solo bajan y se procesan en orden ascendente, así que nunca chocan entre sí.
// Las llamadas se encadenan para que no corran dos renumeraciones a la vez.
let renumeracionProcesos = Promise.resolve();
function compactarProcesos() {
    renumeracionProcesos = renumeracionProcesos.then(async () => {
        const filas = await connect.query('SELECT id FROM procesos ORDER BY id ASC') || [];
        let n = 0;
        for (const fila of filas) {
            n++;
            if (Number(fila.id) !== n) {
                await connect.tabla('procesos').update({ id: n }, { id: Number(fila.id) });
            }
        }
        // El contador de AUTOINCREMENT también debe volver a n, o el próximo proceso saltaría números.
        const seq = await connect.query("SELECT seq FROM sqlite_sequence WHERE name = 'procesos'") || [];
        if (seq.length > 0 && Number(seq[0].seq) !== n) {
            await connect.query("UPDATE sqlite_sequence SET seq = ? WHERE name = 'procesos'", [n]);
        }
    }).catch(err => {
        console.error('Error al renumerar los procesos:', err);
    });
    return renumeracionProcesos;
}

router.get('/procesos', verificarAutenticacion, async (req, res) => {
    try {
        await compactarProcesos();
        const procesos = await connect.query(`
            SELECT p.id, p.estudiante_cedula, p.tipo_proceso, p.fecha, p.estado, p.descripcion, p.datos_especificos, p.creado_por,
                   e.nombre, e.apellido, e.ano, e.seccion, e.representante, e.telefono, e.foto
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            ORDER BY p.id DESC
        `);

        const estudiantes = await connect.query(`SELECT * FROM estudiantes ORDER BY apellido ASC`);

        res.render('procesos', {
            paginaActiva: 'procesos',
            procesos: procesos || [],
            estudiantes: estudiantes || []
        });
    } catch (error) {
        console.error('Error en /procesos:', error);
        res.render('procesos', {
            paginaActiva: 'procesos',
            procesos: [],
            estudiantes: []
        });
    }
});

// Registrar nuevo proceso
router.post('/nuevoProceso', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { estudiante_cedula, tipo_proceso, fecha, estado, descripcion, datos_especificos } = req.body;

        if (!estudiante_cedula || !tipo_proceso) {
            return res.json({ exito: false, mensaje: 'Debe seleccionar un estudiante y un tipo de proceso.' });
        }

        // Procesos que la escuela no usa o que todavía no tienen esquema
        if (['Carnet Estudiantil', 'Boletín Informativo'].includes(tipo_proceso)) {
            return res.json({ exito: false, mensaje: `El proceso "${tipo_proceso}" no está disponible por ahora.` });
        }

        const estudiante = await connect.query('SELECT cedula FROM estudiantes WHERE cedula = ? LIMIT 1', [estudiante_cedula]);
        if (!estudiante || estudiante.length === 0) {
            return res.json({ exito: false, mensaje: 'El estudiante seleccionado no existe en el sistema.' });
        }

        const fechaFinal = fecha && fecha.trim() !== '' ? fecha : new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const estadoFinal = estado || 'Completado';
        const usuarioCreador = req.usuario.nombre_completo || 'LILIAN TINTORI';
        const datosFinal = typeof datos_especificos === 'object' ? JSON.stringify(datos_especificos) : (datos_especificos && datos_especificos.trim() !== '' ? datos_especificos : null);

        const nuevoProceso = {
            estudiante_cedula: estudiante_cedula,
            tipo_proceso: tipo_proceso,
            fecha: fechaFinal,
            estado: estadoFinal,
            descripcion: descripcion || '',
            creado_por: usuarioCreador
        };
        if (datosFinal) nuevoProceso.datos_especificos = datosFinal;

        await connect.tabla('procesos').insert(nuevoProceso);

        return res.json({ exito: true, mensaje: 'Proceso estudiantil registrado correctamente.' });
    } catch (error) {
        console.error('Error en /nuevoProceso:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al registrar el proceso.' });
    }
});

// Modificar proceso
router.put('/editarProceso/:id', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_proceso, fecha, estado, descripcion, datos_especificos } = req.body;
        const datosFinal = typeof datos_especificos === 'object' ? JSON.stringify(datos_especificos) : (datos_especificos && datos_especificos.trim() !== '' ? datos_especificos : null);

        const cambios = {
            tipo_proceso: tipo_proceso,
            fecha: fecha,
            estado: estado,
            descripcion: descripcion || ''
        };
        if (datosFinal !== null && datosFinal !== undefined) {
            cambios.datos_especificos = datosFinal;
        }

        await connect.tabla('procesos').update(cambios, { id: Number(id) });

        return res.json({ exito: true, mensaje: 'Proceso actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al editar proceso:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar el proceso.' });
    }
});

// Eliminar proceso
router.delete('/eliminarProceso/:id', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        await connect.tabla('procesos').delete({ id: Number(id) });
        await compactarProcesos();
        return res.json({ exito: true, mensaje: 'Proceso eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar proceso:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar el proceso.' });
    }
});

// Imprimir constancia / documento de proceso
router.get('/imprimirProceso/:id', verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        const procesos = await connect.query(`
            SELECT p.*, e.*
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            WHERE p.id = ?
            LIMIT 1
        `, [Number(id)]);

        if (!procesos || procesos.length === 0) {
            return res.redirect('/procesos');
        }

        const config = await connect.query(`SELECT * FROM configuracion LIMIT 1`);
        const anoCalc = connect.calcularAnoEscolar ? connect.calcularAnoEscolar() : '2026 - 2027';
        const infoInstitucion = (config && config[0]) || {
            nombre_institucion: 'Escuela "Las Américas"',
            codigo_dea: 'OD11202117',
            ano_escolar: anoCalc,
            director: 'Lic. Keilly Briceño',
            contacto: '0212-555-0192'
        };

        const proc = procesos[0];
        let datosObj = {};
        if (proc.datos_especificos) {
            try {
                datosObj = JSON.parse(proc.datos_especificos);
            } catch (err) {
                datosObj = {};
            }
        }

        // AUTOCOMPLETADO AUTOMÁTICO: Si algún campo de inscripción no se llenó a mano, tomarlo del perfil del estudiante
        datosObj.est_nombres = datosObj.est_nombres || proc.nombre;
        datosObj.est_apellidos = datosObj.est_apellidos || proc.apellido;
        datosObj.est_cedula = datosObj.est_cedula || proc.estudiante_cedula;
        datosObj.est_fecha_nac = datosObj.est_fecha_nac || proc.fecha_nacimiento || '';
        datosObj.est_lugar_nac = datosObj.est_lugar_nac || proc.lugar_nacimiento || '';
        datosObj.est_edad = datosObj.est_edad || proc.edad || '';
        datosObj.est_sexo = datosObj.est_sexo || proc.sexo || 'Masculino';
        datosObj.est_talla_camisa = datosObj.est_talla_camisa || proc.talla_camisa || '';
        datosObj.est_talla_pantalon = datosObj.est_talla_pantalon || proc.talla_pantalon || '';
        datosObj.est_talla_zapatos = datosObj.est_talla_zapatos || proc.talla_zapatos || '';
        datosObj.est_direccion = datosObj.est_direccion || proc.direccion_estudiante || '';
        
        datosObj.madre_nombres = datosObj.madre_nombres || proc.madre_nombres || '';
        datosObj.madre_apellidos = datosObj.madre_apellidos || proc.madre_apellidos || '';
        datosObj.madre_cedula = datosObj.madre_cedula || proc.madre_cedula || '';
        datosObj.madre_fecha_nac = datosObj.madre_fecha_nac || proc.madre_fecha_nac || '';
        datosObj.madre_direccion = datosObj.madre_direccion || proc.madre_direccion || '';
        datosObj.madre_telefono = datosObj.madre_telefono || proc.madre_telefono || '';

        datosObj.padre_nombres = datosObj.padre_nombres || proc.padre_nombres || '';
        datosObj.padre_apellidos = datosObj.padre_apellidos || proc.padre_apellidos || '';
        datosObj.padre_cedula = datosObj.padre_cedula || proc.padre_cedula || '';
        datosObj.padre_fecha_nac = datosObj.padre_fecha_nac || proc.padre_fecha_nac || '';
        datosObj.padre_direccion = datosObj.padre_direccion || proc.padre_direccion || '';
        datosObj.padre_telefono = datosObj.padre_telefono || proc.padre_telefono || '';

        datosObj.rep_nombres = datosObj.rep_nombres || proc.rep_nombres || proc.representante || '';
        datosObj.rep_apellidos = datosObj.rep_apellidos || proc.rep_apellidos || '';
        datosObj.rep_cedula = datosObj.rep_cedula || proc.rep_cedula || '';
        datosObj.rep_fecha_nac = datosObj.rep_fecha_nac || proc.rep_fecha_nac || '';
        datosObj.rep_direccion = datosObj.rep_direccion || proc.rep_direccion || '';
        datosObj.rep_telefono = datosObj.rep_telefono || proc.rep_telefono || proc.telefono || '';
        datosObj.rep_parentesco = datosObj.rep_parentesco || proc.rep_parentesco || 'Madre';

        res.render('imprimirProceso', {
            proceso: proc,
            datosEspecificos: datosObj,
            institucion: infoInstitucion,
            usuarioEmisor: req.usuario.nombre_completo || 'Lic. Keilly Briceño'
        });
    } catch (error) {
        console.error('Error en /imprimirProceso:', error);
        res.redirect('/procesos');
    }
});

// ==========================================
// SECCIÓN "BASE DE DATOS" (ESTUDIANTES)
// ==========================================
// Agrupa los estudiantes para la vista: primero la matrícula (estado 'Activo')
// por grado y sección, y al final los que están fuera, por estado.
const ORDEN_GRADOS = ['Preescolar', '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];
const ORDEN_FUERA = ['Inhabilitado', 'Egresado', 'Retirado'];

function agruparEstudiantes(lista) {
    const matricula = new Map();
    const fuera = new Map();

    lista.forEach(est => {
        if (est.estado === 'Activo') {
            const clave = (est.ano || '') + '|' + (est.seccion || '');
            if (!matricula.has(clave)) {
                matricula.set(clave, {
                    id: 'm-' + matricula.size,
                    tipo: 'matricula',
                    ano: est.ano || '',
                    seccion: est.seccion || '',
                    estudiantes: []
                });
            }
            matricula.get(clave).estudiantes.push(est);
        } else {
            const estado = est.estado || 'Sin estado';
            if (!fuera.has(estado)) {
                fuera.set(estado, {
                    id: 'f-' + fuera.size,
                    tipo: 'fuera',
                    estado,
                    estudiantes: []
                });
            }
            fuera.get(estado).estudiantes.push(est);
        }
    });

    const indiceGrado = g => {
        const i = ORDEN_GRADOS.indexOf(g);
        return i === -1 ? ORDEN_GRADOS.length : i;
    };
    const gruposMatricula = [...matricula.values()].sort((a, b) =>
        indiceGrado(a.ano) - indiceGrado(b.ano) || a.seccion.localeCompare(b.seccion)
    );
    const indiceFuera = e => {
        const i = ORDEN_FUERA.indexOf(e);
        return i === -1 ? ORDEN_FUERA.length : i;
    };
    const gruposFuera = [...fuera.values()].sort((a, b) => indiceFuera(a.estado) - indiceFuera(b.estado));

    const totalMatricula = gruposMatricula.reduce((acc, g) => acc + g.estudiantes.length, 0);
    return { grupos: [...gruposMatricula, ...gruposFuera], totalMatricula };
}

router.get('/baseDatos', verificarAutenticacion, async (req, res) => {
    try {
        const estudiantes = await connect.query(`
            SELECT e.*, 
                   (SELECT COUNT(*) FROM procesos WHERE estudiante_cedula = e.cedula) as total_procesos,
                   (SELECT tipo_proceso FROM procesos WHERE estudiante_cedula = e.cedula ORDER BY id DESC LIMIT 1) as ultimo_proceso
            FROM estudiantes e
            ORDER BY e.apellido ASC, e.nombre ASC
        `);

        const lista = estudiantes || [];
        const { grupos, totalMatricula } = agruparEstudiantes(lista);

        res.render('baseDatos', {
            paginaActiva: 'baseDatos',
            estudiantes: lista,
            grupos,
            totalMatricula
        });
    } catch (error) {
        console.error('Error en /baseDatos:', error);
        res.render('baseDatos', {
            paginaActiva: 'baseDatos',
            estudiantes: [],
            grupos: [],
            totalMatricula: 0
        });
    }
});

// Ascensión de grado de los estudiantes seleccionados.
// Con { aplicar: false } solo devuelve la vista previa; con { aplicar: true } guarda los cambios.
// Reglas: Preescolar A y B pasan a 1er Grado "A"; Preescolar C y D pasan a 1er Grado "B".
// 1er a 5to Grado suben al siguiente grado conservando la sección (A o B).
// 6to Grado queda 'Inhabilitado' (graduado) y conserva su grado y sección.
const SIGUIENTE_GRADO = {
    'Preescolar': '1er Grado',
    '1er Grado': '2do Grado',
    '2do Grado': '3er Grado',
    '3er Grado': '4to Grado',
    '4to Grado': '5to Grado',
    '5to Grado': '6to Grado',
    '6to Grado': null
};
const SECCIONES_ASCENSO = ['A', 'B'];
const SECCION_DESDE_PREESCOLAR = { A: 'A', B: 'A', C: 'B', D: 'B' };

router.post('/api/ascensionGrado', verificarAutenticacion, async (req, res) => {
    try {
        const aplicar = req.body.aplicar === true;
        const cedulas = [...new Set(
            (Array.isArray(req.body.cedulas) ? req.body.cedulas : [])
                .map(c => String(c).trim())
                .filter(Boolean)
        )];

        if (cedulas.length === 0) {
            return res.json({ exito: false, mensaje: 'No se seleccionó ningún estudiante.' });
        }

        const marcas = cedulas.map(() => '?').join(',');
        const encontrados = await connect.query(
            `SELECT cedula, ano, seccion, estado FROM estudiantes WHERE cedula IN (${marcas})`,
            cedulas
        ) || [];

        const omitidos = { noActivos: 0, sinRegla: 0, noExisten: cedulas.length - encontrados.length };
        const cambios = [];

        encontrados.forEach(est => {
            if (est.estado !== 'Activo') {
                omitidos.noActivos++;
                return;
            }
            const seccion = String(est.seccion || '').trim().toUpperCase();
            const esPreescolar = est.ano === 'Preescolar';
            const seccionValida = esPreescolar
                ? seccion in SECCION_DESDE_PREESCOLAR
                : SECCIONES_ASCENSO.includes(seccion);
            if (!(est.ano in SIGUIENTE_GRADO) || !seccionValida) {
                omitidos.sinRegla++;
                return;
            }
            const siguiente = SIGUIENTE_GRADO[est.ano];
            const seccionDestino = esPreescolar ? SECCION_DESDE_PREESCOLAR[seccion] : seccion;
            const previo = { cedula: est.cedula, ano: est.ano, seccion, estado: 'Activo' };
            cambios.push(siguiente
                ? { cedula: est.cedula, origen: `${est.ano} "${seccion}"`, destino: `${siguiente} "${seccionDestino}"`, nuevo: { ano: siguiente, seccion: seccionDestino }, previo, inhabilita: false }
                : { cedula: est.cedula, origen: `${est.ano} "${seccion}"`, destino: 'Inhabilitado (graduado)', nuevo: { estado: 'Inhabilitado' }, previo, inhabilita: true }
            );
        });

        // Resumen agrupado por origen y destino
        const resumenMap = new Map();
        cambios.forEach(c => {
            const clave = c.origen + '>' + c.destino;
            if (!resumenMap.has(clave)) {
                resumenMap.set(clave, { origen: c.origen, destino: c.destino, cantidad: 0, inhabilita: c.inhabilita });
            }
            resumenMap.get(clave).cantidad++;
        });
        const resumen = [...resumenMap.values()].sort((a, b) => a.origen.localeCompare(b.origen, 'es'));
        const totalInhabilitan = cambios.filter(c => c.inhabilita).length;

        if (!aplicar) {
            return res.json({ exito: true, total: cambios.length, resumen, totalInhabilitan, omitidos });
        }

        if (cambios.length === 0) {
            return res.json({ exito: false, mensaje: 'Ninguno de los estudiantes seleccionados puede ascender de grado.' });
        }

        for (const c of cambios) {
            await connect.tabla('estudiantes').update(c.nuevo, { cedula: c.cedula });
        }

        return res.json({
            exito: true,
            mensaje: `Ascensión de grado aplicada a ${cambios.length} estudiante${cambios.length === 1 ? '' : 's'}.`,
            deshacer: cambios.map(c => c.previo)
        });
    } catch (err) {
        console.error('Error en /api/ascensionGrado:', err);
        return res.status(500).json({ exito: false, mensaje: 'Error al procesar la ascensión de grado.' });
    }
});

// Deshace una ascensión recién aplicada: devuelve a cada estudiante a su grado, sección y estado anteriores.
router.post('/api/deshacerAscension', verificarAutenticacion, async (req, res) => {
    try {
        const cambios = Array.isArray(req.body.cambios) ? req.body.cambios : [];
        const validos = cambios.filter(c =>
            c && typeof c.cedula === 'string' && c.cedula.trim() !== '' &&
            ORDEN_GRADOS.includes(c.ano) &&
            ['A', 'B', 'C', 'D'].includes(c.seccion) &&
            c.estado === 'Activo'
        );

        if (validos.length === 0) {
            return res.json({ exito: false, mensaje: 'No hay cambios válidos para deshacer.' });
        }

        for (const c of validos) {
            await connect.tabla('estudiantes').update(
                { ano: c.ano, seccion: c.seccion, estado: c.estado },
                { cedula: c.cedula.trim() }
            );
        }

        return res.json({
            exito: true,
            mensaje: `Se deshizo la ascensión de ${validos.length} estudiante${validos.length === 1 ? '' : 's'}.`
        });
    } catch (err) {
        console.error('Error en /api/deshacerAscension:', err);
        return res.status(500).json({ exito: false, mensaje: 'Error al deshacer la ascensión de grado.' });
    }
});

router.get('/listado', verificarAutenticacion, (req, res) => {
    res.redirect('/baseDatos');
});

// Registrar nuevo estudiante (con todos los datos de planilla de inscripción incluidos)
router.post('/nuevoEstudiante', uploadFotoEstudiante.single('foto'), verificarAutenticacion, async (req, res) => {
    try {
        const { 
            cedula, nombre, apellido, ano, seccion, representante, telefono, correo, estado, fecha_ingreso, observaciones,
            fecha_nacimiento, lugar_nacimiento, edad, sexo, talla_camisa, talla_pantalon, talla_zapatos, direccion_estudiante,
            madre_nombres, madre_apellidos, madre_cedula, madre_fecha_nac, madre_direccion, madre_telefono,
            padre_nombres, padre_apellidos, padre_cedula, padre_fecha_nac, padre_direccion, padre_telefono,
            rep_nombres, rep_apellidos, rep_cedula, rep_fecha_nac, rep_direccion, rep_telefono, rep_parentesco
        } = req.body;

        if (!cedula || !nombre || !apellido || !ano || !seccion) {
            return res.json({ exito: false, mensaje: 'Por favor complete todos los campos requeridos (Cédula, Nombres, Apellidos, Grado y Sección).' });
        }

        const existe = await connect.query('SELECT cedula FROM estudiantes WHERE cedula = ? LIMIT 1', [cedula.trim()]);
        if (existe && existe.length > 0) {
            return res.json({ exito: false, mensaje: 'Ya existe un estudiante registrado con esta Cédula de Identidad.' });
        }

        const fotoPath = req.file ? `/uploads/estudiantes/${req.file.filename}` : null;
        const repFinal = (representante && representante.trim()) || ((rep_nombres || '') + (rep_apellidos ? ' ' + rep_apellidos : '')).trim();
        const telFinal = (telefono && telefono.trim()) || (rep_telefono || '').trim();
        const fechaIngresoFinal = (fecha_ingreso && fecha_ingreso.trim() !== '') ? fecha_ingreso : new Date().toISOString().split('T')[0];

        const datosInscripcionObj = {
            est_nombres: nombre.trim(),
            est_apellidos: apellido.trim(),
            est_cedula: cedula.trim(),
            est_fecha_nac: fecha_nacimiento || '',
            est_lugar_nac: lugar_nacimiento || '',
            est_edad: edad || '',
            est_sexo: sexo || 'Masculino',
            est_talla_camisa: talla_camisa || '',
            est_talla_pantalon: talla_pantalon || '',
            est_talla_zapatos: talla_zapatos || '',
            est_direccion: direccion_estudiante || '',
            madre_nombres: madre_nombres || '',
            madre_apellidos: madre_apellidos || '',
            madre_cedula: madre_cedula || '',
            madre_fecha_nac: madre_fecha_nac || '',
            madre_direccion: madre_direccion || '',
            madre_telefono: madre_telefono || '',
            padre_nombres: padre_nombres || '',
            padre_apellidos: padre_apellidos || '',
            padre_cedula: padre_cedula || '',
            padre_fecha_nac: padre_fecha_nac || '',
            padre_direccion: padre_direccion || '',
            padre_telefono: padre_telefono || '',
            rep_nombres: rep_nombres || repFinal,
            rep_apellidos: rep_apellidos || '',
            rep_cedula: rep_cedula || '',
            rep_fecha_nac: rep_fecha_nac || '',
            rep_direccion: rep_direccion || '',
            rep_telefono: rep_telefono || telFinal,
            rep_parentesco: rep_parentesco || 'Madre'
        };

        const nuevoEstudiante = {
            cedula: cedula.trim(),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            ano: ano.trim(),
            seccion: seccion.trim(),
            representante: repFinal,
            telefono: telFinal,
            correo: (correo || '').trim(),
            estado: estado || 'Activo',
            fecha_ingreso: fechaIngresoFinal,
            observaciones: (observaciones || '').trim(),
            fecha_nacimiento: fecha_nacimiento || '',
            lugar_nacimiento: lugar_nacimiento || '',
            edad: edad || '',
            sexo: sexo || 'Masculino',
            talla_camisa: talla_camisa || '',
            talla_pantalon: talla_pantalon || '',
            talla_zapatos: talla_zapatos || '',
            direccion_estudiante: direccion_estudiante || '',
            madre_nombres: madre_nombres || '',
            madre_apellidos: madre_apellidos || '',
            madre_cedula: madre_cedula || '',
            madre_fecha_nac: madre_fecha_nac || '',
            madre_direccion: madre_direccion || '',
            madre_telefono: madre_telefono || '',
            padre_nombres: padre_nombres || '',
            padre_apellidos: padre_apellidos || '',
            padre_cedula: padre_cedula || '',
            padre_fecha_nac: padre_fecha_nac || '',
            padre_direccion: padre_direccion || '',
            padre_telefono: padre_telefono || '',
            rep_nombres: rep_nombres || '',
            rep_apellidos: rep_apellidos || '',
            rep_cedula: rep_cedula || '',
            rep_fecha_nac: rep_fecha_nac || '',
            rep_direccion: rep_direccion || '',
            rep_telefono: rep_telefono || '',
            rep_parentesco: rep_parentesco || 'Madre',
            datos_inscripcion: JSON.stringify(datosInscripcionObj)
        };
        // La foto solo se incluye si se subió una (si no, la columna queda en NULL)
        if (fotoPath) nuevoEstudiante.foto = fotoPath;

        await connect.tabla('estudiantes').insert(nuevoEstudiante);

        return res.json({ exito: true, mensaje: 'Estudiante y datos de inscripción añadidos exitosamente.' });
    } catch (error) {
        console.error('Error al registrar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al registrar el estudiante.' });
    }
});

// Modificar estudiante
router.put('/editarEstudiante', uploadFotoEstudiante.single('foto'), verificarAutenticacion, async (req, res) => {
    try {
        const { 
            cedula, nombre, apellido, ano, seccion, representante, telefono, correo, estado, observaciones, eliminar_foto,
            fecha_nacimiento, lugar_nacimiento, edad, sexo, talla_camisa, talla_pantalon, talla_zapatos, direccion_estudiante,
            madre_nombres, madre_apellidos, madre_cedula, madre_fecha_nac, madre_direccion, madre_telefono,
            padre_nombres, padre_apellidos, padre_cedula, padre_fecha_nac, padre_direccion, padre_telefono,
            rep_nombres, rep_apellidos, rep_cedula, rep_fecha_nac, rep_direccion, rep_telefono, rep_parentesco
        } = req.body;

        if (!cedula || !nombre || !apellido) {
            return res.json({ exito: false, mensaje: 'Datos insuficientes para actualizar el estudiante.' });
        }

        const existe = await connect.query('SELECT cedula, foto FROM estudiantes WHERE cedula = ? LIMIT 1', [cedula.trim()]);
        if (!existe || existe.length === 0) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado en la base de datos.' });
        }

        const repFinal = (representante && representante.trim()) || ((rep_nombres || '') + (rep_apellidos ? ' ' + rep_apellidos : '')).trim();
        const telFinal = (telefono && telefono.trim()) || (rep_telefono || '').trim();

        const datosInscripcionObj = {
            est_nombres: nombre.trim(),
            est_apellidos: apellido.trim(),
            est_cedula: cedula.trim(),
            est_fecha_nac: fecha_nacimiento || '',
            est_lugar_nac: lugar_nacimiento || '',
            est_edad: edad || '',
            est_sexo: sexo || 'Masculino',
            est_talla_camisa: talla_camisa || '',
            est_talla_pantalon: talla_pantalon || '',
            est_talla_zapatos: talla_zapatos || '',
            est_direccion: direccion_estudiante || '',
            madre_nombres: madre_nombres || '',
            madre_apellidos: madre_apellidos || '',
            madre_cedula: madre_cedula || '',
            madre_fecha_nac: madre_fecha_nac || '',
            madre_direccion: madre_direccion || '',
            madre_telefono: madre_telefono || '',
            padre_nombres: padre_nombres || '',
            padre_apellidos: padre_apellidos || '',
            padre_cedula: padre_cedula || '',
            padre_fecha_nac: padre_fecha_nac || '',
            padre_direccion: padre_direccion || '',
            padre_telefono: padre_telefono || '',
            rep_nombres: rep_nombres || repFinal,
            rep_apellidos: rep_apellidos || '',
            rep_cedula: rep_cedula || '',
            rep_fecha_nac: rep_fecha_nac || '',
            rep_direccion: rep_direccion || '',
            rep_telefono: rep_telefono || telFinal,
            rep_parentesco: rep_parentesco || 'Madre'
        };

        const cambiosEstudiante = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            ano: (ano || '1er Grado').trim(),
            seccion: (seccion || 'A').trim(),
            representante: repFinal,
            telefono: telFinal,
            correo: (correo || '').trim(),
            estado: estado || 'Activo',
            observaciones: (observaciones || '').trim(),
            fecha_nacimiento: fecha_nacimiento || '',
            lugar_nacimiento: lugar_nacimiento || '',
            edad: edad || '',
            sexo: sexo || 'Masculino',
            talla_camisa: talla_camisa || '',
            talla_pantalon: talla_pantalon || '',
            talla_zapatos: talla_zapatos || '',
            direccion_estudiante: direccion_estudiante || '',
            madre_nombres: madre_nombres || '',
            madre_apellidos: madre_apellidos || '',
            madre_cedula: madre_cedula || '',
            madre_fecha_nac: madre_fecha_nac || '',
            madre_direccion: madre_direccion || '',
            madre_telefono: madre_telefono || '',
            padre_nombres: padre_nombres || '',
            padre_apellidos: padre_apellidos || '',
            padre_cedula: padre_cedula || '',
            padre_fecha_nac: padre_fecha_nac || '',
            padre_direccion: padre_direccion || '',
            padre_telefono: padre_telefono || '',
            rep_nombres: rep_nombres || '',
            rep_apellidos: rep_apellidos || '',
            rep_cedula: rep_cedula || '',
            rep_fecha_nac: rep_fecha_nac || '',
            rep_direccion: rep_direccion || '',
            rep_telefono: rep_telefono || '',
            rep_parentesco: rep_parentesco || 'Madre',
            datos_inscripcion: JSON.stringify(datosInscripcionObj)
        };

        if (req.file) {
            cambiosEstudiante.foto = `/uploads/estudiantes/${req.file.filename}`;
        }

        await connect.tabla('estudiantes').update(cambiosEstudiante, { cedula: cedula.trim() });

        // Quitar la foto actual (poner la columna en NULL)
        if (!req.file && eliminar_foto === 'true') {
            await connect.query('UPDATE estudiantes SET foto = NULL WHERE cedula = ?', [cedula.trim()]);
        }

        return res.json({ exito: true, mensaje: 'Datos del estudiante y planilla de inscripción actualizados correctamente.' });
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar estudiante.' });
    }
});

// Transición de Preescolar a 1er Grado o permanencia (Individual o por Lote)
router.post('/api/transicionPreescolar', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        let transiciones = req.body.transiciones;
        if (typeof transiciones === 'string') {
            try { transiciones = JSON.parse(transiciones); } catch(e) {}
        }

        // Manejo por lote si se envía una lista
        if (Array.isArray(transiciones) && transiciones.length > 0) {
            let actualizados = 0;
            for (const item of transiciones) {
                const { cedula, accion, seccion_destino } = item;
                if (!cedula) continue;
                const nuevoAno = (accion === 'promover') ? '1er Grado' : 'Preescolar';
                const nuevaSeccion = seccion_destino || 'A';
                await connect.tabla('estudiantes').update(
                    { ano: nuevoAno, seccion: nuevaSeccion },
                    { cedula: cedula.trim() }
                );
                actualizados++;
            }
            return res.json({ exito: true, mensaje: `Transición procesada exitosamente para ${actualizados} estudiante(s).` });
        }

        // Manejo individual
        const { cedula, accion, grado_destino, seccion_destino } = req.body;

        if (!cedula) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada.' });
        }

        const est = await connect.query('SELECT cedula, nombre, apellido, ano, seccion FROM estudiantes WHERE cedula = ? LIMIT 1', [cedula.trim()]);
        if (!est || est.length === 0) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        let nuevoAno = 'Preescolar';
        let nuevaSeccion = est[0].seccion;

        if (accion === 'promover' || grado_destino === '1er Grado') {
            nuevoAno = '1er Grado';
            nuevaSeccion = seccion_destino || 'A';
        } else {
            nuevoAno = 'Preescolar';
            nuevaSeccion = seccion_destino || est[0].seccion;
        }

        await connect.tabla('estudiantes').update(
                    { ano: nuevoAno, seccion: nuevaSeccion },
                    { cedula: cedula.trim() }
                );

        return res.json({ 
            exito: true, 
            mensaje: (accion === 'promover' || grado_destino === '1er Grado') 
                ? `${est[0].nombre} ${est[0].apellido} fue promovido/a exitosamente a 1er Grado "${nuevaSeccion}".` 
                : `${est[0].nombre} ${est[0].apellido} permanecerá en Preescolar "${nuevaSeccion}".`
        });
    } catch (err) {
        console.error('Error en /api/transicionPreescolar:', err);
        return res.status(500).json({ exito: false, mensaje: 'Error al procesar la transición de preescolar.' });
    }
});

// Obtener datos de un estudiante específico (para precarga de procesos)
router.get('/api/estudiante/:cedula', verificarAutenticacion, async (req, res) => {
    try {
        const { cedula } = req.params;
        const est = await connect.query('SELECT * FROM estudiantes WHERE cedula = ? LIMIT 1', [cedula.trim()]);
        if (est && est.length > 0) {
            return res.json({ exito: true, estudiante: est[0] });
        }
        return res.status(404).json({ exito: false, mensaje: 'Estudiante no encontrado' });
    } catch (err) {
        return res.status(500).json({ exito: false, mensaje: 'Error al consultar estudiante' });
    }
});

// Eliminar estudiante
router.delete('/eliminarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const cedula = (req.body && req.body.cedula) || (req.query && req.query.cedula);
        if (!cedula) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada.' });
        }

        await connect.query('DELETE FROM procesos WHERE estudiante_cedula = ?', [cedula.trim()]);
        await connect.tabla('estudiantes').delete({ cedula: cedula.trim() });
        await compactarProcesos();
        return res.json({ exito: true, mensaje: 'Estudiante eliminado del sistema institucional.' });
    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar estudiante.' });
    }
});

// ==========================================
// SECCIÓN AJUSTES & AVISOS
// ==========================================
router.get('/ajustes', verificarAutenticacion, async (req, res) => {
    try {
        const usuarioRes = await connect.query('SELECT id, user, nombre_completo, rol FROM usuarios WHERE user = ? LIMIT 1', [req.usuario.usuario]);
        const configRes = await connect.query(`SELECT * FROM configuracion LIMIT 1`);
        const avisosRes = await connect.query(`SELECT * FROM avisos ORDER BY id DESC`);

        res.render('ajustes', {
            paginaActiva: 'ajustes',
            usuario: (usuarioRes && usuarioRes[0]) || { user: 'admin', nombre_completo: 'LILIAN TINTORI', rol: 'Directivo' },
            configuracion: (configRes && configRes[0]) || {},
            avisos: avisosRes || [],
            temas: TEMAS,
            colorActual: (configRes && configRes[0] && TEMAS[configRes[0].color_interfaz]) ? configRes[0].color_interfaz : TEMA_POR_DEFECTO
        });
    } catch (error) {
        console.error('Error en /ajustes:', error);
        res.redirect('/inicio');
    }
});

// Guardar ajustes
// Cambiar el color de la interfaz (se guarda en la configuración y aplica a todo el sistema)
router.post('/api/colorInterfaz', verificarAutenticacion, async (req, res) => {
    try {
        const tema = String((req.body && req.body.tema) || '');
        if (!TEMAS[tema]) {
            return res.json({ exito: false, mensaje: 'Color no válido.' });
        }
        const filas = await connect.query('SELECT id FROM configuracion LIMIT 1') || [];
        if (filas.length === 0) {
            await connect.tabla('configuracion').insert({ color_interfaz: tema });
        } else {
            await connect.query('UPDATE configuracion SET color_interfaz = ?', [tema]);
        }
        return res.json({ exito: true, mensaje: `Color de la interfaz cambiado a ${TEMAS[tema].nombre}.` });
    } catch (error) {
        console.error('Error en /api/colorInterfaz:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al guardar el color de la interfaz.' });
    }
});

router.post('/guardarAjustes', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { nombre_completo, usuario, nueva_contrasena, nombre_institucion, codigo_dea, ano_escolar, director, contacto } = req.body;
        const currentUser = req.usuario.usuario;
        const nuevoUser = (usuario && usuario.trim() !== '') ? usuario.trim() : currentUser;

        // Si se cambia el nombre de usuario de login, validar que no colisione con otro
        if (nuevoUser !== currentUser) {
            const existeUser = await connect.query('SELECT id FROM usuarios WHERE user = ? AND user != ? LIMIT 1', [nuevoUser, currentUser]);
            if (existeUser && existeUser.length > 0) {
                return res.json({ exito: false, mensaje: 'El nombre de usuario ya está siendo usado por otra cuenta.' });
            }
        }

        const cambiosUsuario = {
            nombre_completo: nombre_completo || 'Administrador',
            user: nuevoUser
        };
        if (nueva_contrasena && nueva_contrasena.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            cambiosUsuario.hash = await bcrypt.hash(nueva_contrasena.trim(), salt);
        }
        await connect.tabla('usuarios').update(cambiosUsuario, { id: req.usuario.id });

        const anoFinal = (ano_escolar && ano_escolar.trim() !== '') ? ano_escolar : (connect.calcularAnoEscolar ? connect.calcularAnoEscolar() : '2026 - 2027');

        await connect.tabla('configuracion').update({
            nombre_institucion: nombre_institucion || 'Escuela "Las Américas"',
            codigo_dea: codigo_dea || 'OD11202117',
            ano_escolar: anoFinal,
            director: director || 'Lic. Keilly Briceño',
            contacto: contacto || ''
        }, { id: 1 });

        // Re-emitir cookie JWT con los nuevos datos actualizados
        const JWT_SECRET = process.env.JWT_SECRET || 'secreto_gestor_procesos_2026_seguro';
        const token = jwt.sign(
            { 
                id: req.usuario.id, 
                usuario: nuevoUser, 
                nombre_completo: (nombre_completo || req.usuario.nombre_completo || '').toUpperCase(),
                rol: req.usuario.rol,
                arranque: ARRANQUE_ID
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });

        return res.json({ exito: true, mensaje: 'Ajustes guardados y sesión actualizada correctamente.' });
    } catch (error) {
        console.error('Error en /guardarAjustes:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al guardar los ajustes.' });
    }
});

// Registrar nuevo aviso
router.post('/nuevoAviso', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { titulo, contenido, prioridad } = req.body;
        if (!titulo || !contenido) {
            return res.json({ exito: false, mensaje: 'Debe ingresar el título y contenido del aviso.' });
        }

        const fecha = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const autor = req.usuario.nombre_completo || 'Dirección';

        await connect.tabla('avisos').insert({
            titulo: titulo,
            contenido: contenido,
            fecha: fecha,
            prioridad: prioridad || 'Normal',
            autor: autor
        });

        return res.json({ exito: true, mensaje: 'Aviso publicado en el tablero.' });
    } catch (error) {
        console.error('Error en /nuevoAviso:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al publicar aviso.' });
    }
});

// Eliminar aviso
router.delete('/eliminarAviso/:id', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        await connect.tabla('avisos').delete({ id: Number(id) });
        return res.json({ exito: true, mensaje: 'Aviso eliminado.' });
    } catch (error) {
        console.error('Error al eliminar aviso:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al eliminar el aviso.' });
    }
});

// Vaciar todos los avisos (Compatible con SQLite usando DELETE FROM)
router.delete('/vaciarAvisos', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        await connect.query(`DELETE FROM avisos`);
        return res.json({ exito: true, mensaje: 'Bandeja de avisos vaciada.' });
    } catch (error) {
        console.error('Error al vaciar avisos:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al vaciar avisos.' });
    }
});

// ==========================================
// APIS JSON
// ==========================================
router.get('/api/estudiantes', verificarAutenticacion, async (req, res) => {
    try {
        const lista = await connect.query(`SELECT * FROM estudiantes ORDER BY apellido ASC, nombre ASC`);
        res.json(lista || []);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar estudiantes' });
    }
});

router.get('/api/procesos/recientes', verificarAutenticacion, async (req, res) => {
    try {
        const lista = await connect.query(`
            SELECT p.id, p.estudiante_cedula, p.tipo_proceso, p.fecha, p.estado,
                   e.nombre, e.apellido, e.ano, e.seccion
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            ORDER BY p.id DESC
            LIMIT 12
        `);
        res.json(lista || []);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar procesos' });
    }
});

module.exports = router;
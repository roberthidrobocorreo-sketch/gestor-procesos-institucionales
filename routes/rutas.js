const express = require('express');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const connect = require('../db.js');

const upload = multer();

// Middleware de verificación de autenticación
const verificarAutenticacion = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.redirect('/');
    }
    try {
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_gestor_procesos_liceo_2026_seguro');
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
            jwt.verify(token, process.env.JWT_SECRET || 'secreto_gestor_procesos_liceo_2026_seguro');
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
    const JWT_SECRET = process.env.JWT_SECRET || 'secreto_gestor_procesos_liceo_2026_seguro';
    try {
        const { usuario, contrasena } = req.body;
        if (!usuario || !contrasena) {
            console.log(">> Faltan campos en req.body");
            return res.status(400).json({ exito: false, mensaje: 'Por favor complete todos los campos.' });
        }

        // Consulta usando query genérica
        const usuarios = await connect.query(`SELECT * FROM usuarios WHERE user = '${usuario.trim()}' LIMIT 1`);
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
                        rol: usuarioObj.rol 
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
        const usuarios = await connect.query(`SELECT nombre_completo FROM usuarios WHERE user = '${req.usuario.usuario}' LIMIT 1`);
        const nombreUsuario = (usuarios && usuarios[0] && usuarios[0].nombre_completo) || req.usuario.nombre_completo || 'LILIAN TINTORI';

        const procesosRecientes = await connect.query(`
            SELECT p.id, p.estudiante_cedula, p.tipo_proceso, p.fecha, p.estado, p.descripcion,
                   e.nombre, e.apellido, e.ano, e.seccion
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            ORDER BY p.id DESC
            LIMIT 9
        `);

        const avisos = await connect.query(`SELECT * FROM avisos ORDER BY id DESC LIMIT 5`);

        const totalEstudiantesRes = await connect.query("SELECT COUNT(*) as total FROM estudiantes");
        const totalProcesosRes = await connect.query("SELECT COUNT(*) as total FROM procesos");
        const totalCompletadosRes = await connect.query("SELECT COUNT(*) as total FROM procesos WHERE estado = 'Completado'");

        res.render('inicio', {
            paginaActiva: 'inicio',
            nombreUsuario: nombreUsuario.toUpperCase(),
            procesosRecientes: procesosRecientes || [],
            avisos: avisos || [],
            totalEstudiantes: (totalEstudiantesRes[0] && totalEstudiantesRes[0].total) || 0,
            totalProcesos: (totalProcesosRes[0] && totalProcesosRes[0].total) || 0,
            totalCompletados: (totalCompletadosRes[0] && totalCompletadosRes[0].total) || 0
        });
    } catch (error) {
        console.error('Error en /inicio:', error);
        res.render('inicio', {
            paginaActiva: 'inicio',
            nombreUsuario: req.usuario.nombre_completo || 'LILIAN TINTORI',
            procesosRecientes: [],
            avisos: [],
            totalEstudiantes: 0,
            totalProcesos: 0,
            totalCompletados: 0
        });
    }
});

// ==========================================
// SECCIÓN DE PROCESOS INSTITUCIONALES
// ==========================================
router.get('/procesos', verificarAutenticacion, async (req, res) => {
    try {
        const procesos = await connect.query(`
            SELECT p.id, p.estudiante_cedula, p.tipo_proceso, p.fecha, p.estado, p.descripcion, p.creado_por,
                   e.nombre, e.apellido, e.ano, e.seccion, e.representante, e.telefono
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            ORDER BY p.id DESC
        `);

        const estudiantes = await connect.query(`SELECT cedula, nombre, apellido, ano, seccion FROM estudiantes ORDER BY apellido ASC`);

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
        const { estudiante_cedula, tipo_proceso, fecha, estado, descripcion } = req.body;

        if (!estudiante_cedula || !tipo_proceso) {
            return res.json({ exito: false, mensaje: 'Debe seleccionar un estudiante y un tipo de proceso.' });
        }

        const estudiante = await connect.query(`SELECT * FROM estudiantes WHERE cedula = '${estudiante_cedula.replace(/'/g, "\\'")}' LIMIT 1`);
        if (!estudiante || estudiante.length === 0) {
            return res.json({ exito: false, mensaje: 'El estudiante seleccionado no existe en el sistema.' });
        }

        const fechaFinal = fecha && fecha.trim() !== '' ? fecha : new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const estadoFinal = estado || 'Completado';
        const usuarioCreador = req.usuario.nombre_completo || 'LILIAN TINTORI';

        await connect.query(`
            INSERT INTO procesos (estudiante_cedula, tipo_proceso, fecha, estado, descripcion, creado_por)
            VALUES (
                '${estudiante_cedula.replace(/'/g, "\\'")}',
                '${tipo_proceso.replace(/'/g, "\\'")}',
                '${fechaFinal.replace(/'/g, "\\'")}',
                '${estadoFinal.replace(/'/g, "\\'")}',
                '${(descripcion || '').replace(/'/g, "\\'")}',
                '${usuarioCreador.replace(/'/g, "\\'")}'
            )
        `);

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
        const { tipo_proceso, fecha, estado, descripcion } = req.body;

        await connect.query(`
            UPDATE procesos 
            SET tipo_proceso = '${tipo_proceso.replace(/'/g, "\\'")}',
                fecha = '${fecha.replace(/'/g, "\\'")}',
                estado = '${estado.replace(/'/g, "\\'")}',
                descripcion = '${(descripcion || '').replace(/'/g, "\\'")}'
            WHERE id = ${Number(id)}
        `);

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
        await connect.query(`DELETE FROM procesos WHERE id = ${Number(id)}`);
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
            SELECT p.*, e.nombre, e.apellido, e.ano, e.seccion, e.representante, e.telefono, e.correo, e.fecha_ingreso
            FROM procesos p
            JOIN estudiantes e ON p.estudiante_cedula = e.cedula
            WHERE p.id = ${Number(id)}
            LIMIT 1
        `);

        if (!procesos || procesos.length === 0) {
            return res.redirect('/procesos');
        }

        const config = await connect.query(`SELECT * FROM configuracion LIMIT 1`);
        const infoInstitucion = (config && config[0]) || {
            nombre_institucion: 'Escuela "Las Américas"',
            codigo_dea: 'OD-04511503',
            ano_escolar: '2026 - 2027',
            director: 'Lcda. Keily Briceño',
            contacto: '0212-555-0192'
        };

        res.render('imprimirProceso', {
            proceso: procesos[0],
            institucion: infoInstitucion,
            usuarioEmisor: req.usuario.nombre_completo || 'LILIAN TINTORI'
        });
    } catch (error) {
        console.error('Error en /imprimirProceso:', error);
        res.redirect('/procesos');
    }
});

// ==========================================
// SECCIÓN "BASE DE DATOS" (ESTUDIANTES)
// ==========================================
router.get('/baseDatos', verificarAutenticacion, async (req, res) => {
    try {
        const estudiantes = await connect.query(`
            SELECT e.*, 
                   (SELECT COUNT(*) FROM procesos WHERE estudiante_cedula = e.cedula) as total_procesos,
                   (SELECT tipo_proceso FROM procesos WHERE estudiante_cedula = e.cedula ORDER BY id DESC LIMIT 1) as ultimo_proceso
            FROM estudiantes e
            ORDER BY e.apellido ASC, e.nombre ASC
        `);

        res.render('baseDatos', {
            paginaActiva: 'baseDatos',
            estudiantes: estudiantes || []
        });
    } catch (error) {
        console.error('Error en /baseDatos:', error);
        res.render('baseDatos', {
            paginaActiva: 'baseDatos',
            estudiantes: []
        });
    }
});

router.get('/listado', verificarAutenticacion, (req, res) => {
    res.redirect('/baseDatos');
});

// Registrar nuevo estudiante
router.post('/nuevoEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { cedula, nombre, apellido, ano, seccion, representante, telefono, correo, estado, fecha_ingreso, observaciones } = req.body;

        if (!cedula || !nombre || !apellido || !ano || !seccion) {
            return res.json({ exito: false, mensaje: 'Por favor complete todos los campos requeridos.' });
        }

        const existe = await connect.query(`SELECT cedula FROM estudiantes WHERE cedula = '${cedula.trim().replace(/'/g, "\\'")}' LIMIT 1`);
        if (existe && existe.length > 0) {
            return res.json({ exito: false, mensaje: 'Ya existe un estudiante registrado con esta Cédula de Identidad.' });
        }

        await connect.query(`
            INSERT INTO estudiantes (cedula, nombre, apellido, ano, seccion, representante, telefono, correo, estado, fecha_ingreso, observaciones)
            VALUES (
                '${cedula.trim().replace(/'/g, "\\'")}',
                '${nombre.trim().replace(/'/g, "\\'")}',
                '${apellido.trim().replace(/'/g, "\\'")}',
                '${ano.trim().replace(/'/g, "\\'")}',
                '${seccion.trim().replace(/'/g, "\\'")}',
                '${(representante || '').trim().replace(/'/g, "\\'")}',
                '${(telefono || '').trim().replace(/'/g, "\\'")}',
                '${(correo || '').trim().replace(/'/g, "\\'")}',
                '${estado || 'Activo'}',
                '${fecha_ingreso || new Date().toLocaleDateString('es-VE')}',
                '${(observaciones || '').trim().replace(/'/g, "\\'")}'
            )
        `);

        return res.json({ exito: true, mensaje: 'Estudiante añadido exitosamente al registro institucional.' });
    } catch (error) {
        console.error('Error al registrar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al registrar el estudiante.' });
    }
});

// Modificar estudiante
router.put('/editarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { cedula, nombre, apellido, ano, seccion, representante, telefono, correo, estado, observaciones } = req.body;

        if (!cedula || !nombre || !apellido) {
            return res.json({ exito: false, mensaje: 'Datos insuficientes para actualizar el estudiante.' });
        }

        const existe = await connect.query(`SELECT cedula FROM estudiantes WHERE cedula = '${cedula.trim().replace(/'/g, "\\'")}' LIMIT 1`);
        if (!existe || existe.length === 0) {
            return res.json({ exito: false, mensaje: 'Estudiante no encontrado en la base de datos.' });
        }

        await connect.query(`
            UPDATE estudiantes
            SET nombre = '${nombre.trim().replace(/'/g, "\\'")}',
                apellido = '${apellido.trim().replace(/'/g, "\\'")}',
                ano = '${(ano || '1er Grado').trim().replace(/'/g, "\\'")}',
                seccion = '${(seccion || 'A').trim().replace(/'/g, "\\'")}',
                representante = '${(representante || '').trim().replace(/'/g, "\\'")}',
                telefono = '${(telefono || '').trim().replace(/'/g, "\\'")}',
                correo = '${(correo || '').trim().replace(/'/g, "\\'")}',
                estado = '${estado || 'Activo'}',
                observaciones = '${(observaciones || '').trim().replace(/'/g, "\\'")}'
            WHERE cedula = '${cedula.trim().replace(/'/g, "\\'")}'
        `);

        return res.json({ exito: true, mensaje: 'Datos del estudiante actualizados correctamente.' });
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al actualizar estudiante.' });
    }
});

// Eliminar estudiante
router.delete('/eliminarEstudiante', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const cedula = (req.body && req.body.cedula) || (req.query && req.query.cedula);
        if (!cedula) {
            return res.json({ exito: false, mensaje: 'Cédula no proporcionada.' });
        }

        await connect.query(`DELETE FROM procesos WHERE estudiante_cedula = '${cedula.trim().replace(/'/g, "\\'")}'`);
        await connect.query(`DELETE FROM estudiantes WHERE cedula = '${cedula.trim().replace(/'/g, "\\'")}'`);
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
        const usuarioRes = await connect.query(`SELECT id, user, nombre_completo, rol FROM usuarios WHERE user = '${req.usuario.usuario}' LIMIT 1`);
        const configRes = await connect.query(`SELECT * FROM configuracion LIMIT 1`);
        const avisosRes = await connect.query(`SELECT * FROM avisos ORDER BY id DESC`);

        res.render('ajustes', {
            paginaActiva: 'ajustes',
            usuario: (usuarioRes && usuarioRes[0]) || { user: 'admin', nombre_completo: 'LILIAN TINTORI', rol: 'Directivo' },
            configuracion: (configRes && configRes[0]) || {},
            avisos: avisosRes || []
        });
    } catch (error) {
        console.error('Error en /ajustes:', error);
        res.redirect('/inicio');
    }
});

// Guardar ajustes
router.post('/guardarAjustes', upload.none(), verificarAutenticacion, async (req, res) => {
    try {
        const { nombre_completo, usuario, nueva_contrasena, nombre_institucion, codigo_dea, ano_escolar, director, contacto } = req.body;

        let sqlUsuario = `UPDATE usuarios SET nombre_completo = '${(nombre_completo || 'LILIAN TINTORI').replace(/'/g, "\\'")}'`;
        if (nueva_contrasena && nueva_contrasena.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(nueva_contrasena.trim(), salt);
            sqlUsuario += `, hash = '${hashed}'`;
        }
        sqlUsuario += ` WHERE user = '${req.usuario.usuario}'`;
        await connect.query(sqlUsuario);

        await connect.query(`
            UPDATE configuracion
            SET nombre_institucion = '${(nombre_institucion || 'Escuela "Las Américas"').replace(/'/g, "\\'")}',
                codigo_dea = '${(codigo_dea || '').replace(/'/g, "\\'")}',
                ano_escolar = '${(ano_escolar || '').replace(/'/g, "\\'")}',
                director = '${(director || '').replace(/'/g, "\\'")}',
                contacto = '${(contacto || '').replace(/'/g, "\\'")}'
            WHERE id = 1
        `);

        return res.json({ exito: true, mensaje: 'Ajustes guardados correctamente.' });
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

        await connect.query(`
            INSERT INTO avisos (titulo, contenido, fecha, prioridad, autor)
            VALUES (
                '${titulo.replace(/'/g, "\\'")}',
                '${contenido.replace(/'/g, "\\'")}',
                '${fecha}',
                '${prioridad || 'Normal'}',
                '${autor.replace(/'/g, "\\'")}'
            )
        `);

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
        await connect.query(`DELETE FROM avisos WHERE id = ${Number(id)}`);
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
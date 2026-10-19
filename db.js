const sqlite3 = require('sqlite3').verbose();
const SqliteTab = require('sqlite3-tab');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log(`>> Conectando a SQLite (${dbPath})...`);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(">> Error al conectar con SQLite:", err.message);
    } else {
        console.log(">> Conectado exitosamente a la base de datos SQLite.");
    }
});

// Conexión de alto nivel (librería sqlite3-tab) sobre la misma base de datos.
// - connect.query(sql, [params])  -> consultas SQL con parámetros
// - connect.tabla('nombre')       -> operaciones por tabla (insert, update, delete, ...)
const connect = new SqliteTab(db);

// Cálculo dinámico del año escolar según ciclo institucional (cambia en agosto de cada año)
function calcularAnoEscolar(fecha = new Date()) {
    const y = fecha.getFullYear();
    const m = fecha.getMonth() + 1; // 1 = Enero, ..., 8 = Agosto
    if (m >= 8) {
        return `${y} - ${y + 1}`;
    } else {
        return `${y - 1} - ${y}`;
    }
}

connect.calcularAnoEscolar = calcularAnoEscolar;

// Función autoejecutable síncrona para asegurar que todo esté listo antes de que lleguen peticiones
(async function inicializarBD() {
    try {
        db.serialize(async () => {
            // 1. Tabla de usuarios
            db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user TEXT NOT NULL UNIQUE,
                    nombre_completo TEXT NOT NULL DEFAULT 'Administrador',
                    rol TEXT NOT NULL DEFAULT 'Coordinador de Procesos',
                    hash TEXT NOT NULL,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 2. Tabla de estudiantes
            db.run(`
                CREATE TABLE IF NOT EXISTS estudiantes (
                    cedula TEXT PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    apellido TEXT NOT NULL,
                    ano TEXT NOT NULL,
                    seccion TEXT NOT NULL,
                    representante TEXT DEFAULT '',
                    telefono TEXT DEFAULT '',
                    correo TEXT DEFAULT '',
                    estado TEXT NOT NULL DEFAULT 'Activo',
                    fecha_ingreso TEXT DEFAULT '',
                    foto TEXT DEFAULT NULL,
                    observaciones TEXT DEFAULT NULL,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 3. Tabla de procesos
            db.run(`
                CREATE TABLE IF NOT EXISTS procesos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    estudiante_cedula TEXT,
                    tipo_proceso TEXT,
                    fecha TEXT,
                    estado TEXT,
                    descripcion TEXT,
                    datos_especificos TEXT DEFAULT NULL,
                    creado_por TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 4. Tabla de configuración institucional
            db.run(`
                CREATE TABLE IF NOT EXISTS configuracion (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre_institucion TEXT,
                    codigo_dea TEXT,
                    ano_escolar TEXT,
                    director TEXT,
                    contacto TEXT,
                    ultimo_ano_transicion TEXT DEFAULT NULL
                );
            `);

            // 5. Tabla de avisos
            db.run(`
                CREATE TABLE IF NOT EXISTS avisos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    contenido TEXT NOT NULL,
                    fecha TEXT,
                    prioridad TEXT DEFAULT 'Normal',
                    autor TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `, async () => {
                console.log(">> Tablas base verificadas/creadas con éxito en SQLite.");
                
                // MIGRACIONES: Columnas para la Planilla de Inscripción completa en estudiantes
                const columnasEstudiante = [
                    { name: 'foto', type: 'TEXT DEFAULT NULL' },
                    { name: 'fecha_nacimiento', type: 'TEXT DEFAULT NULL' },
                    { name: 'lugar_nacimiento', type: 'TEXT DEFAULT NULL' },
                    { name: 'edad', type: 'TEXT DEFAULT NULL' },
                    { name: 'sexo', type: 'TEXT DEFAULT NULL' },
                    { name: 'talla_camisa', type: 'TEXT DEFAULT NULL' },
                    { name: 'talla_pantalon', type: 'TEXT DEFAULT NULL' },
                    { name: 'talla_zapatos', type: 'TEXT DEFAULT NULL' },
                    { name: 'direccion_estudiante', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_nombres', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_apellidos', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_cedula', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_fecha_nac', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_direccion', type: 'TEXT DEFAULT NULL' },
                    { name: 'madre_telefono', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_nombres', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_apellidos', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_cedula', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_fecha_nac', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_direccion', type: 'TEXT DEFAULT NULL' },
                    { name: 'padre_telefono', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_nombres', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_apellidos', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_cedula', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_fecha_nac', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_direccion', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_telefono', type: 'TEXT DEFAULT NULL' },
                    { name: 'rep_parentesco', type: 'TEXT DEFAULT NULL' },
                    { name: 'datos_inscripcion', type: 'TEXT DEFAULT NULL' }
                ];

                db.all("PRAGMA table_info(estudiantes)", (err, existingCols) => {
                    if (!err && existingCols) {
                        const existingNames = new Set(existingCols.map(c => c.name));
                        columnasEstudiante.forEach(col => {
                            if (!existingNames.has(col.name)) {
                                db.run(`ALTER TABLE estudiantes ADD COLUMN ${col.name} ${col.type}`, () => {
                                    console.log(`>> Columna '${col.name}' añadida a estudiantes.`);
                                });
                            }
                        });
                    }
                });

                // MIGRACIÓN: Columna datos_especificos en procesos
                db.all("PRAGMA table_info(procesos)", (err, columns) => {
                    if (!err && columns && !columns.some(col => col.name === 'datos_especificos')) {
                        db.run("ALTER TABLE procesos ADD COLUMN datos_especificos TEXT DEFAULT NULL", () => {
                            console.log(">> Columna 'datos_especificos' añadida a procesos.");
                        });
                    }
                });

                // MIGRACIÓN Y GESTIÓN DE CONFIGURACIÓN INSTITUCIONAL
                db.all("PRAGMA table_info(configuracion)", (err, columns) => {
                    const procesarConfiguracion = () => {
                        const anoActualCalculado = calcularAnoEscolar();
                        db.get("SELECT * FROM configuracion LIMIT 1", (err, configRow) => {
                            if (!configRow) {
                                db.run(`
                                    INSERT INTO configuracion (nombre_institucion, codigo_dea, ano_escolar, director, contacto, ultimo_ano_transicion)
                                    VALUES ('Escuela "Las Américas"', 'OD11202117', '${anoActualCalculado}', 'Lic. Keilly Briceño', '0212-555-0192', '${anoActualCalculado}')
                                `, () => {
                                    console.log(`>> Configuración inicial creada. Año escolar activo: ${anoActualCalculado}`);
                                });
                            } else {
                                // La configuración existente (incluida la directora) se respeta tal como
                                // fue guardada en Ajustes; aquí ya no se sobrescribe al iniciar el servidor.

                                // VERIFICAR TRANSICIÓN ANUAL DE AGOSTO:
                                const ultimoProcesado = configRow.ultimo_ano_transicion || '';
                                if (ultimoProcesado !== anoActualCalculado) {
                                    console.log(`>> [CICLO DE AGOSTO] Ejecutando transición institucional hacia el año escolar ${anoActualCalculado}...`);
                                    
                                    // 1. Actualizar año escolar en configuración
                                    db.run(`
                                        UPDATE configuracion 
                                        SET ano_escolar = ?, ultimo_ano_transicion = ? 
                                        WHERE id = ?
                                    `, [anoActualCalculado, anoActualCalculado, configRow.id]);

                                    // 2. Inhabilitar estudiantes graduados de 6to Grado
                                    db.run(`
                                        UPDATE estudiantes 
                                        SET estado = 'Inhabilitado' 
                                        WHERE (ano = '6to Grado' OR ano LIKE '%6to%') AND estado = 'Activo'
                                    `, function (transErr) {
                                        if (!transErr) {
                                            console.log(`>> Transición de 6to Grado completada: ${this.changes} estudiante(s) promovidos a Inhabilitado (Graduados).`);
                                        }
                                    });
                                }
                            }
                        });
                    };

                    if (!err && columns && !columns.some(col => col.name === 'ultimo_ano_transicion')) {
                        db.run("ALTER TABLE configuracion ADD COLUMN ultimo_ano_transicion TEXT DEFAULT NULL", () => {
                            procesarConfiguracion();
                        });
                    } else {
                        procesarConfiguracion();
                    }
                });

                // PRESERVACIÓN DE USUARIOS:
                // SOLO crear usuario inicial si no existe NINGÚN usuario en la base de datos
                db.get("SELECT COUNT(*) as total FROM usuarios", async (err, row) => {
                    if (!err && (!row || row.total === 0)) {
                        const salt = await bcrypt.genSalt(10);
                        const hashedPass = await bcrypt.hash("admin", salt);
                        db.run(`
                            INSERT INTO usuarios (user, nombre_completo, rol, hash)
                            VALUES ('admin', 'Lic. Keilly Briceño', 'Coordinador/a de Procesos', ?)
                        `, [hashedPass], () => {
                            console.log(">> Usuario inicial 'admin' creado exitosamente.");
                        });
                    } else {
                        console.log(">> Usuarios existentes verificados (datos administrativos preservados sin sobrescribir).");
                    }
                });
            });
        });

    } catch (err) {
        console.error(">> Error al inicializar la base de datos SQLite:", err);
    }
})();

module.exports = connect;

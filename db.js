const sqlite3 = require('sqlite3').verbose();
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

const connect = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const trimmedSql = sql.trim().toUpperCase();
            if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA')) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ insertId: this.lastID, affectedRows: this.changes });
                });
            }
        });
    }
};

// Función autoejecutable síncrona para asegurar que todo esté listo antes de que lleguen peticiones
(async function inicializarBD() {
    try {
        // Usamos serialización para evitar conflictos de escritura simultánea en SQLite
        db.serialize(async () => {
            db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user TEXT NOT NULL UNIQUE,
                    nombre_completo TEXT NOT NULL DEFAULT 'LILIAN TINTORI',
                    rol TEXT NOT NULL DEFAULT 'Coordinador de Procesos',
                    hash TEXT NOT NULL,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

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
                    observaciones TEXT DEFAULT NULL,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS procesos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    estudiante_cedula TEXT,
                    tipo_proceso TEXT,
                    fecha TEXT,
                    estado TEXT,
                    descripcion TEXT,
                    creado_por TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS configuracion (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre_institucion TEXT,
                    codigo_dea TEXT,
                    ano_escolar TEXT,
                    director TEXT,
                    contacto TEXT
                );
            `);

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
                console.log(">> Tablas verificadas/creadas con éxito en SQLite.");
                
                // Crear o actualizar usuario admin por defecto
                const salt = await bcrypt.genSalt(10);
                const hashedPass = await bcrypt.hash("admin", salt);

                db.get("SELECT * FROM usuarios WHERE user = 'admin' LIMIT 1", async (err, row) => {
                    if (!row) {
                        db.run(`
                            INSERT INTO usuarios (user, nombre_completo, rol, hash)
                            VALUES ('admin', 'LILIAN TINTORI', 'Coordinador/a de Procesos', ?)
                        `, [hashedPass], () => {
                            console.log(">> Usuario 'admin' (LILIAN TINTORI) creado con contraseña 'admin'.");
                        });
                    } else {
                        db.run(`
                            UPDATE usuarios 
                            SET hash = ?, nombre_completo = 'LILIAN TINTORI' 
                            WHERE user = 'admin'
                        `, [hashedPass], () => {
                            console.log(">> Usuario 'admin' sincronizado correctamente.");
                        });
                    }
                });

                db.get("SELECT * FROM configuracion LIMIT 1", (err, row) => {
                    if (!row) {
                        db.run(`
                            INSERT INTO configuracion (nombre_institucion, codigo_dea, ano_escolar, director, contacto)
                            VALUES ('Escuela "Las Américas"', 'OD-04511503', '2026 - 2027', 'Lcda. Keily Briceño', '0212-555-0192')
                        `);
                    }
                });
            });
        });

    } catch (err) {
        console.error(">> Error al inicializar la base de datos SQLite:", err);
    }
})();

module.exports = connect;
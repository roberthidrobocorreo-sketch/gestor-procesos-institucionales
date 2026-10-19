require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const connect = require('./db.js');
const router = require('./routes/rutas.js');
const { cssTema, TEMA_POR_DEFECTO } = require('./temas.js');
const fs = require('fs');

const app = express();

// Middlewares
// style.css se sirve con el color elegido en Ajustes agregado al final (debe ir antes de express.static).
app.get('/css/style.css', async (req, res, next) => {
    try {
        const base = await fs.promises.readFile(path.join(__dirname, 'html/css/style.css'), 'utf8');
        let tema = TEMA_POR_DEFECTO;
        try {
            const filas = await connect.query('SELECT color_interfaz FROM configuracion LIMIT 1');
            if (filas && filas[0] && filas[0].color_interfaz) tema = filas[0].color_interfaz;
        } catch (e) { /* si la columna aún no existe, se usa el turquesa */ }
        res.set('Content-Type', 'text/css; charset=utf-8');
        res.set('Cache-Control', 'no-cache');
        res.send(base + cssTema(tema));
    } catch (err) {
        next(); // si algo falla, se sirve el archivo normal
    }
});
app.use(express.static(path.join(__dirname, 'html')));
app.use('/scripts', express.static(path.join(__dirname, 'html/scripts')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Compartir instancia de db en req
app.use((req, res, next) => {
    req.db = connect;
    next();
});

// Configuración de motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/', router);

// Manejador 404
app.use((req, res) => {
    res.status(404).render('login', { error: 'Página no encontrada' });
});

// Iniciar servidor
const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, () => {
    console.log(`================================================================`);
    console.log(`>> Gestor de Procesos Institucionales (Escuela "Las Américas")`);
    console.log(`>> Servidor corriendo exitosamente en: http://localhost:${PUERTO}`);
    console.log(`================================================================`);
});

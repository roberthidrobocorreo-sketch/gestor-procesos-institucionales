require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const connect = require('./db.js');
const router = require('./routes/rutas.js');

const app = express();

// Middlewares
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
    console.log(`>> Gestor de Procesos Institucionales (Liceo)`);
    console.log(`>> Servidor corriendo exitosamente en: http://localhost:${PUERTO}`);
    console.log(`================================================================`);
});

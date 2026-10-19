# 🏫 Gestor de Procesos Institucionales

> **Sistema de gestión documental para la Escuela “Las Américas”**

Aplicación web desarrollada como apoyo a la organización y administración de la documentación y los procesos institucionales de la **Escuela “Las Américas”**. El sistema permite centralizar la información de los estudiantes, gestionar procesos asociados a sus registros y consultar avisos y datos generales desde una interfaz clara y organizada.

🎯 **Propósito:** contribuir a una gestión institucional más ordenada, accesible y eficiente, reduciendo la dispersión de la información y facilitando las tareas administrativas de la institución.

🧰 **Tecnologías principales:** Node.js, Express, EJS, JavaScript y SQLite.

## 👥 Integrantes del equipo

- **Roberth Idrobo**
- **Venezuela Pérez**
- **Stephany Naveda**
- **Wuilver Guerrero**

## 📚 Contenido

- [Descripción general](#descripción-general)
- [Funcionalidades](#funcionalidades)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Acceso inicial](#acceso-inicial)
- [Base de datos](#base-de-datos)
- [Rutas principales](#rutas-principales)
- [Consideraciones de seguridad](#consideraciones-de-seguridad)
- [Estado del proyecto](#estado-del-proyecto)

## 🏫 Descripción general

El **Gestor de Procesos Institucionales** está pensado para apoyar la gestión de documentos y procesos administrativos de la **Escuela “Las Américas”**. Reúne en un mismo lugar la información de los estudiantes, los procesos asociados a cada registro, los avisos institucionales y los datos generales de la institución.

La aplicación utiliza un servidor construido con Express, páginas renderizadas mediante EJS y una base de datos SQLite almacenada localmente. La interfaz se compone de vistas para el inicio, los procesos, la base de datos de estudiantes y los ajustes del sistema.

## ✨ Funcionalidades

- **Inicio de sesión:** acceso al sistema mediante usuario y contraseña.
- **Panel de inicio:** visualización de indicadores generales, procesos recientes y avisos institucionales.
- **Gestión de estudiantes:** registro, consulta, edición y eliminación de estudiantes.
- **Gestión de procesos:** creación, edición, consulta y eliminación de procesos vinculados a estudiantes.
- **Impresión de procesos:** vista preparada para consultar e imprimir los datos de un proceso.
- **Búsqueda y consulta de información:** acceso a registros de estudiantes y procesos desde las vistas correspondientes.
- **Avisos institucionales:** publicación y eliminación de avisos, con opciones para administrar la lista.
- **Ajustes institucionales:** actualización de información general de la institución y datos del usuario.
- **Persistencia local:** almacenamiento de los datos mediante SQLite.

## 🧰 Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| Node.js | Entorno de ejecución del servidor. |
| Express 5 | Gestión del servidor HTTP y las rutas. |
| EJS | Renderizado de las vistas HTML. |
| JavaScript | Lógica del servidor e interacciones del navegador. |
| SQLite | Almacenamiento de los registros de la aplicación. |
| `sqlite3` | Conexión y consultas a la base de datos SQLite. |
| `bcryptjs` | Hash y verificación de contraseñas. |
| `jsonwebtoken` | Generación y validación de tokens de autenticación. |
| `cookie-parser` | Lectura de cookies de la solicitud. |
| `method-override` | Soporte para métodos HTTP como PUT y DELETE desde formularios. |
| `multer` | Procesamiento de formularios enviados por la aplicación. |
| `dotenv` | Lectura de variables de entorno. |

## 🗂️ Estructura del proyecto

```text
GestorProcesosInstitucionales/
├── db.js                         # Conexión e inicialización de SQLite
├── server.js                     # Configuración e inicio del servidor Express
├── package.json                  # Metadatos, dependencias y comandos npm
├── package-lock.json             # Versiones bloqueadas de dependencias
├── database.sqlite               # Base de datos local
├── .env.example                  # Ejemplo de configuración del entorno
├── routes/
│   └── rutas.js                  # Rutas, autenticación y operaciones del sistema
├── views/
│   ├── login.ejs                 # Inicio de sesión
│   ├── inicio.ejs                # Panel principal
│   ├── procesos.ejs              # Gestión de procesos
│   ├── baseDatos.ejs             # Registro de estudiantes
│   ├── imprimirProceso.ejs       # Vista imprimible de un proceso
│   ├── ajustes.ejs               # Ajustes y avisos
│   └── partials/
│       └── sidebar.ejs           # Menú lateral compartido
└── html/
    ├── css/
    │   └── style.css             # Estilos de la interfaz
    ├── img/
    │   └── escudo.png            # Recurso gráfico institucional
    └── scripts/
        ├── dashboard.js          # Interacciones del panel principal
        ├── estudiantes.js        # Interacciones de estudiantes
        ├── procesos.js           # Interacciones de procesos
        ├── login.js              # Interacciones del inicio de sesión
        └── ui.js                 # Funciones de interfaz compartidas
```

> `node_modules/` se genera al instalar las dependencias y no es necesario incluirlo en el repositorio.

## ⚙️ Requisitos

- Node.js instalado. Se recomienda una versión LTS compatible con las dependencias del proyecto.
- npm, incluido con Node.js.
- Un navegador web actualizado.

No es necesario instalar ni levantar un servidor MySQL: la implementación actual utiliza SQLite.

## 🚀 Instalación y ejecución

1. **Descargar o clonar el proyecto** y abrir una terminal en la carpeta raíz, donde se encuentra `package.json`.

2. **Instalar las dependencias:**

   ```bash
   npm install
   ```

3. **Configurar las variables de entorno.** Crear un archivo `.env` en la raíz tomando como referencia `.env.example`. Para esta versión, las variables relevantes son:

   ```env
   PORT=3001
   JWT_SECRET=coloca_aqui_una_clave_larga_y_aleatoria
   ```

   `PORT` define el puerto del servidor. `JWT_SECRET` debe ser una clave privada, larga y aleatoria. No publiques el archivo `.env` ni compartas sus valores reales.

4. **Iniciar la aplicación:**

   ```bash
   npm start
   ```

   También está disponible el comando de desarrollo:

   ```bash
   npm run dev
   ```

   Ambos comandos ejecutan `node server.js` en la configuración actual.

5. **Abrir el sistema** en el navegador:

   ```text
   http://localhost:3001
   ```

   Si se configura otro puerto en `.env`, utiliza ese puerto en la dirección.

## 🔐 Acceso inicial

La inicialización actual de `db.js` crea el usuario de desarrollo `admin` con la contraseña `admin` cuando arranca la aplicación. En la configuración actual, el código también vuelve a sincronizar esa contraseña al iniciar el servidor.

**Estas credenciales son únicamente para desarrollo y demostración local.** Antes de utilizar el sistema con datos reales, modifica la lógica de inicialización y establece un mecanismo seguro para crear y administrar cuentas y contraseñas.

## 🗄️ Base de datos

La aplicación utiliza el archivo local `database.sqlite`. El archivo `db.js` abre la conexión y crea, si no existen, las tablas principales:

- `usuarios`: credenciales y datos de los usuarios.
- `estudiantes`: datos personales y escolares de los estudiantes.
- `procesos`: procesos asociados a estudiantes.
- `configuracion`: información general de la institución.
- `avisos`: comunicados institucionales.

La base de datos se inicializa desde `db.js`, por lo que `bd.sql` no forma parte del flujo actual de ejecución. Si se conserva una copia de `database.sqlite`, debe tratarse como información importante: puede contener datos de estudiantes y usuarios.

## 🧭 Rutas principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Muestra el inicio de sesión. |
| `POST` | `/login` | Valida las credenciales e inicia sesión. |
| `GET` | `/logout` | Cierra la sesión. |
| `GET` | `/inicio` | Muestra el panel principal. |
| `GET` | `/procesos` | Consulta los procesos institucionales. |
| `POST` | `/nuevoProceso` | Registra un proceso. |
| `PUT` | `/editarProceso/:id` | Actualiza un proceso. |
| `DELETE` | `/eliminarProceso/:id` | Elimina un proceso. |
| `GET` | `/imprimirProceso/:id` | Abre la vista imprimible de un proceso. |
| `GET` | `/baseDatos` | Muestra la base de datos de estudiantes. |
| `POST` | `/nuevoEstudiante` | Registra un estudiante. |
| `PUT` | `/editarEstudiante` | Actualiza los datos de un estudiante. |
| `DELETE` | `/eliminarEstudiante` | Elimina un estudiante y sus procesos asociados. |
| `GET` | `/ajustes` | Muestra los ajustes y avisos. |
| `POST` | `/guardarAjustes` | Guarda los ajustes institucionales. |
| `POST` | `/nuevoAviso` | Registra un aviso institucional. |
| `DELETE` | `/eliminarAviso/:id` | Elimina un aviso específico. |
| `DELETE` | `/vaciarAvisos` | Elimina los avisos registrados. |
| `GET` | `/api/estudiantes` | Devuelve datos de estudiantes para las interacciones del cliente. |
| `GET` | `/api/procesos/recientes` | Devuelve procesos recientes. |

Las rutas que administran información requieren autenticación, según la configuración de `routes/rutas.js`.

## 🛡️ Consideraciones de seguridad

Este proyecto es una base académica y debe revisarse antes de utilizarse en un entorno real o con información personal de estudiantes.

- Sustituir las credenciales de desarrollo y corregir la sincronización automática de la contraseña inicial.
- Definir un `JWT_SECRET` fuerte mediante variables de entorno y evitar claves de respaldo dentro del código.
- Utilizar consultas SQL parametrizadas en todas las operaciones que incorporen datos de formularios. No concatenar directamente datos recibidos por el usuario en las consultas.
- Configurar las cookies de autenticación con opciones adecuadas para el entorno de despliegue, incluyendo `Secure` cuando se utilice HTTPS.
- No publicar `.env`, `database.sqlite` con datos reales ni copias de seguridad que contengan información personal.
- Crear copias de seguridad periódicas de la base de datos y comprobar que puedan restaurarse.

## 📌 Estado del proyecto

El proyecto cuenta con una interfaz web y módulos para la administración de estudiantes, procesos, avisos y configuración institucional, con enfoque en las necesidades de gestión documental de la Escuela “Las Américas”. La documentación describe la estructura y el funcionamiento previsto a partir del código disponible; no implica que se hayan ejecutado pruebas automatizadas o una auditoría de seguridad.

## 📄 Licencia

El `package.json` declara la licencia **ISC**. Si el proyecto se publica, conserva la información de autoría correspondiente y verifica que la licencia elegida sea la adecuada para todos los recursos incluidos.

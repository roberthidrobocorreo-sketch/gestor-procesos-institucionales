# 🏫 Gestor de Procesos Institucionales

> **Sistema de gestión documental para la Escuela “Las Américas”**

Aplicación web desarrollada como apoyo a la organización y administración de la documentación y los procesos institucionales de la **Escuela “Las Américas”**. El sistema permite registrar a los estudiantes con su planilla de inscripción completa, gestionar y emitir los documentos (procesos) asociados a cada uno, hacer la ascensión de grado de la matrícula y publicar avisos institucionales desde una interfaz clara y organizada.

🎯 **Propósito:** contribuir a una gestión institucional más ordenada, accesible y eficiente, reduciendo la dispersión de la información y facilitando las tareas administrativas de la institución.

🧰 **Tecnologías principales:** Node.js, Express, EJS, JavaScript y SQLite.

## 👥 Integrantes del equipo

- **Roberth Idrobo**
- **Venezuela Pérez**
- **Stephany Naveda**
- **Wuilver Guerrero**

## 📚 Contenido

- [Funcionalidades](#-funcionalidades)
- [Tecnologías utilizadas](#-tecnologías-utilizadas)
- [Estructura del proyecto](#️-estructura-del-proyecto)
- [Requisitos](#️-requisitos)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Acceso inicial](#-acceso-inicial)
- [Base de datos](#️-base-de-datos)
- [Reglas de negocio](#-reglas-de-negocio)
- [Rutas principales](#-rutas-principales)
- [Consideraciones de seguridad](#️-consideraciones-de-seguridad)
- [Estado del proyecto](#-estado-del-proyecto)
- [Licencia](#-licencia)

## ✨ Funcionalidades

- **Inicio de sesión:** acceso al sistema mediante usuario y contraseña. La sesión dura 24 horas.
- **Panel de inicio:** saludo al usuario, reloj digital y fecha en vivo, y tres contadores de procesos: realizados (total registrado), completados y en trámite, estos dos últimos con su porcentaje sobre el total.
- **Base de datos de estudiantes:**
  - La matrícula activa se muestra agrupada por grado y sección. Los estudiantes que están fuera de la matrícula se agrupan por estado (Inhabilitado, Egresado, Retirado).
  - Búsqueda por nombre, apellido o cédula.
  - Registro y edición con la planilla de inscripción completa: datos del estudiante (con foto), de la madre, del padre y del representante.
  - Eliminación de un estudiante, que también elimina los procesos asociados.
  - **Ascensión de grado** de los estudiantes seleccionados, con ventana de confirmación y vista previa, y opción de **deshacer** durante unos segundos.
- **Procesos institucionales:**
  - Tipos disponibles: Planilla de Inscripción, Carta de Buena Conducta, Carta de Aceptación, Carta de Retiro, Constancia de Promoción (6to Grado), Constancia de Estudio y Otro.
  - Estados: Completado, En Trámite y Pendiente.
  - Búsqueda por estudiante o cédula, y filtros por tipo y estado.
  - La numeración de los procesos se mantiene consecutiva, sin huecos, aunque se eliminen registros.
  - **Impresión** de cada proceso en una vista preparada para papel, con los datos de la institución y los del estudiante tomados de su perfil.
- **Ajustes:**
  - Datos institucionales (nombre, código DEA, año escolar, director y contacto) y perfil del usuario (nombre, usuario de acceso y nueva contraseña).
  - **Avisos institucionales:** publicar, eliminar uno o vaciar todos.
  - **Color de la interfaz:** cuatro temas (Turquesa, Guinda, Verde pino y Terracota). El tema elegido se aplica a todo el sistema, incluida la pantalla de inicio de sesión. La tarjeta “Procesos realizados” del panel de inicio se mantiene siempre en turquesa.
- **Persistencia local:** los datos se guardan en un archivo SQLite; no hace falta instalar un servidor de base de datos.

## 🧰 Tecnologías utilizadas

| Tecnología        | Uso en el proyecto                                                              |
|-------------------|---------------------------------------------------------------------------------|
| Node.js           | Entorno de ejecución del servidor.                                              |
| Express 5         | Servidor HTTP y rutas.                                                          |
| EJS               | Renderizado de las vistas HTML.                                                 |
| JavaScript        | Lógica del servidor e interacciones del navegador.                              |
| SQLite (`sqlite3`) | Almacenamiento local de los registros.                                         |
| `sqlite3-tab`     | Capa de consultas sobre SQLite (consultas con parámetros y operaciones por tabla). Se instala desde GitHub. |
| `bcryptjs`        | Cifrado (hash) y verificación de contraseñas.                                   |
| `jsonwebtoken`    | Generación y validación de los tokens de sesión.                                |
| `cookie-parser`   | Lectura de las cookies de la solicitud.                                         |
| `method-override` | Soporte para métodos HTTP como PUT y DELETE desde formularios.                  |
| `multer`          | Procesamiento de formularios y subida de las fotos de los estudiantes.          |
| `dotenv`          | Lectura de variables de entorno.                                                |

## 🗂️ Estructura del proyecto

```
GestorProcesosInstitucionales/
├── server.js                     # Configuración e inicio del servidor Express
├── db.js                         # Conexión a SQLite, creación de tablas y migraciones
├── temas.js                      # Temas de color de la interfaz
├── package.json                  # Metadatos, dependencias y comandos npm
├── package-lock.json             # Versiones bloqueadas de dependencias
├── .env.example                  # Ejemplo de configuración del entorno
├── .gitignore                    # Archivos que no se suben al repositorio
├── routes/
│   └── rutas.js                  # Rutas, autenticación y operaciones del sistema
├── views/
│   ├── login.ejs                 # Inicio de sesión
│   ├── inicio.ejs                # Panel principal
│   ├── baseDatos.ejs             # Registro de estudiantes y ascensión de grado
│   ├── procesos.ejs              # Gestión de procesos
│   ├── imprimirProceso.ejs       # Vista imprimible de un proceso
│   ├── ajustes.ejs               # Ajustes, avisos y color de la interfaz
│   └── partials/
│       └── sidebar.ejs           # Menú lateral compartido
└── html/
    ├── css/
    │   └── style.css             # Estilos de la interfaz
    ├── img/
    │   └── escudo.png            # Escudo de la institución
    └── scripts/
        ├── ui.js                 # Avisos flotantes y ventanas, compartidos
        ├── dashboard.js          # Reloj y fecha del panel principal
        ├── estudiantes.js        # Interacciones de estudiantes y ascensión de grado
        ├── procesos.js           # Interacciones de procesos
        └── login.js              # Interacciones del inicio de sesión
```

**Archivos que se generan al usar el proyecto y no se suben al repositorio** (están en `.gitignore`):

- `node_modules/`: se crea con `npm install`.
- `.env`: lo crea cada persona a partir de `.env.example`.
- `database.sqlite`: se crea sola al iniciar el servidor por primera vez.
- `html/uploads/estudiantes/`: fotos de los estudiantes que se registren.

## ⚙️ Requisitos

- Node.js instalado (se recomienda una versión LTS reciente).
- npm, incluido con Node.js.
- Conexión a internet durante `npm install`, porque la dependencia `sqlite3-tab` se descarga desde GitHub.
- Un navegador web actualizado.

No es necesario instalar ni configurar ningún servidor de base de datos: el sistema usa SQLite.

## 🚀 Instalación y ejecución

1. **Descargar o clonar el proyecto** y abrir una terminal en la carpeta raíz, donde está `package.json`.
2. **Instalar las dependencias:**

   ```bash
   npm install
   ```
3. **Crear el archivo de entorno.** Copiar `.env.example` con el nombre `.env`:

   ```bash
   # Linux / macOS
   cp .env.example .env

   # Windows (CMD)
   copy .env.example .env
   ```

   Después editar `.env` y definir los valores:

   ```
   PORT=3001
   JWT_SECRET=coloca_aqui_una_clave_larga_y_aleatoria
   ```

   `PORT` es el puerto del servidor (3001 si no se define). `JWT_SECRET` es la clave con la que se firman las sesiones: debe ser larga, aleatoria y privada. No publiques el archivo `.env`.
4. **Iniciar la aplicación:**

   ```bash
   npm start
   ```

   También existe `npm run dev`, que en la configuración actual ejecuta lo mismo (`node server.js`).
5. **Abrir el sistema** en el navegador: `http://localhost:3001` (o el puerto que hayas configurado).

## 🔐 Acceso inicial

La primera vez que se inicia el servidor, si no existe ningún usuario en la base de datos, `db.js` crea uno de desarrollo:

| Usuario | Contraseña |
|---------|------------|
| `admin` | `admin`    |

Si ya existe algún usuario, no se crea otro ni se modifica ninguna contraseña.

**Esas credenciales son solo para desarrollo y demostración.** Para cambiar el usuario, el nombre o la contraseña, entra a **Ajustes → Datos Institucionales y Usuario**. Hazlo antes de usar el sistema con datos reales.

## 🗄️ Base de datos

El sistema usa el archivo local `database.sqlite`, en la raíz del proyecto. Al arrancar, `db.js` abre la conexión y crea, si no existen, las tablas principales:

- `usuarios`: usuario de acceso, nombre, rol y contraseña cifrada.
- `estudiantes`: datos personales y escolares, planilla de inscripción (estudiante, madre, padre y representante) y ruta de la foto.
- `procesos`: procesos asociados a cada estudiante, con su tipo, fecha, estado, descripción y datos específicos.
- `configuracion`: datos de la institución, año escolar y tema de color elegido (`color_interfaz`).
- `avisos`: comunicados institucionales.

`db.js` también aplica **migraciones automáticas**: si una base de datos creada con una versión anterior no tiene alguna columna nueva (por ejemplo `color_interfaz` o las de la planilla de inscripción), la agrega al iniciar el servidor sin perder datos. Además, si la tabla de configuración está vacía, crea una configuración inicial de la institución que se puede editar en Ajustes.

Si conservas una copia de `database.sqlite`, trátala como información importante: contiene datos de estudiantes y usuarios.

## 📐 Reglas de negocio

### Año escolar y transición de agosto

El año escolar se calcula a partir de la fecha: a partir de agosto comienza el período siguiente (por ejemplo, en agosto de 2026 el año escolar pasa a “2026 - 2027”). Cuando el servidor arranca y detecta que cambió el año escolar, actualiza la configuración y marca como **Inhabilitado** a los estudiantes activos de 6to Grado (graduados).

### Ascensión de grado

Se hace desde **Base de Datos**, seleccionando a los estudiantes y pulsando **Ascensión de Grado**. Primero se muestra una vista previa agrupada y, al confirmar, se aplican los cambios. Después aparece un aviso con el botón **Deshacer**, disponible durante 5 segundos. Solo ascienden los estudiantes con estado Activo.

| Grado y sección actuales     | Resultado                                                  |
|------------------------------|------------------------------------------------------------|
| Preescolar A o B             | 1er Grado, sección A                                       |
| Preescolar C o D             | 1er Grado, sección B                                       |
| 1er a 5to Grado (A o B)      | Siguiente grado, conservando la sección                    |
| 6to Grado                    | Pasa a Inhabilitado (graduado) y conserva grado y sección  |

### Color de la interfaz

El tema se elige en **Ajustes → Color de la Interfaz** y se guarda en la base de datos, por lo que es **único para todo el sistema** (no por usuario). El servidor entrega `style.css` con las variables del tema elegido agregadas al final.

## 🧭 Rutas principales

Todas las rutas, excepto `/`, `/login` y `/logout`, requieren haber iniciado sesión.

| Método   | Ruta                         | Descripción                                                         |
|----------|------------------------------|---------------------------------------------------------------------|
| `GET`    | `/`                          | Muestra el inicio de sesión (o redirige a `/inicio` si ya hay sesión). |
| `POST`   | `/login`                     | Valida las credenciales e inicia sesión.                            |
| `GET`    | `/logout`                    | Cierra la sesión.                                                   |
| `GET`    | `/inicio`                    | Muestra el panel principal.                                         |
| `GET`    | `/procesos`                  | Lista los procesos institucionales.                                 |
| `POST`   | `/nuevoProceso`              | Registra un proceso.                                                |
| `PUT`    | `/editarProceso/:id`         | Actualiza un proceso.                                               |
| `DELETE` | `/eliminarProceso/:id`       | Elimina un proceso.                                                 |
| `GET`    | `/imprimirProceso/:id`       | Abre la vista imprimible de un proceso.                             |
| `GET`    | `/baseDatos`                 | Muestra la base de datos de estudiantes (`/listado` redirige aquí). |
| `POST`   | `/nuevoEstudiante`           | Registra un estudiante (con foto opcional).                         |
| `PUT`    | `/editarEstudiante`          | Actualiza los datos de un estudiante.                               |
| `DELETE` | `/eliminarEstudiante`        | Elimina un estudiante y sus procesos asociados.                     |
| `POST`   | `/api/ascensionGrado`        | Devuelve la vista previa o aplica la ascensión de grado.            |
| `POST`   | `/api/deshacerAscension`     | Deshace una ascensión recién aplicada.                              |
| `POST`   | `/api/transicionPreescolar`  | Promueve a 1er Grado o mantiene en Preescolar (individual o por lote). |
| `GET`    | `/api/estudiante/:cedula`    | Devuelve los datos de un estudiante.                                |
| `GET`    | `/api/estudiantes`           | Devuelve la lista de estudiantes.                                   |
| `GET`    | `/api/procesos/recientes`    | Devuelve los 12 procesos más recientes.                             |
| `GET`    | `/ajustes`                   | Muestra los ajustes, los avisos y el color de la interfaz.          |
| `POST`   | `/guardarAjustes`            | Guarda los datos institucionales y del usuario.                     |
| `POST`   | `/api/colorInterfaz`         | Cambia el tema de color del sistema.                                |
| `POST`   | `/nuevoAviso`                | Publica un aviso institucional.                                     |
| `DELETE` | `/eliminarAviso/:id`         | Elimina un aviso.                                                   |
| `DELETE` | `/vaciarAvisos`              | Elimina todos los avisos.                                           |

## 🛡️ Consideraciones de seguridad

Este proyecto es una base académica y debe revisarse antes de usarse en un entorno real o con información personal de estudiantes.

## 📌 Estado del proyecto

El proyecto cuenta con una interfaz web completa para administrar estudiantes, procesos, avisos y la configuración institucional de la Escuela “Las Américas”. Esta documentación describe la estructura y el funcionamiento a partir del código del proyecto; no implica que se hayan ejecutado pruebas automatizadas ni una auditoría de seguridad.

## 📄 Licencia

El `package.json` declara la licencia **ISC**. Si el proyecto se publica, conserva la información de autoría y verifica que la licencia sea adecuada para todos los recursos incluidos.

# Informe teórico del proyecto
## Gestor de Procesos Institucionales — Escuela "Las Américas"

| Dato | Valor |
| --- | --- |
| **Nombre del sistema** | Gestor de Procesos Institucionales |
| **Institución** | Escuela "Las Américas" (código DEA OD11202117) |
| **Integrantes del equipo** | Roberth Idrobo, Venezuela Pérez, Stephany Naveda, Wuilver Guerrero |
| **Versión del proyecto** | 1.0.0 |
| **Tipo de sistema** | Aplicación web de gestión académica y administrativa |
| **Enfoque del documento** | Descripción teórica: naturaleza del sistema, funciones, alcance actual y proyección |
| **Documentos relacionados** | `README.md` (descripción técnica y de uso), `diagramaentidadrelacion.md` (modelo de datos) |

---

## 1. Introducción

El proyecto es un sistema de información web destinado a organizar y controlar los procesos administrativos que se derivan de la vida escolar de los estudiantes de educación primaria: inscripción, constancias, cartas y promociones. La propuesta sustituye el manejo de la información en libros, planillas impresas y archivos personales por un único registro centralizado, accesible desde un navegador dentro de la institución.

Este documento describe el sistema desde el punto de vista teórico: el problema que atiende, los conceptos que lo fundamentan, las funciones que ofrece, las reglas que gobiernan su comportamiento y el alcance que se le reconoce hoy y al proyectarse. La explicación del funcionamiento, la estructura de archivos, las tecnologías con que está construido y los pasos para instalarlo corresponden al `README` del proyecto, y el detalle del modelo de datos al documento del diagrama entidad-relación.

## 2. Planteamiento de la necesidad

En la gestión diaria de una institución educativa de este nivel se concentran varias operaciones que, tratadas de forma manual, generan cuellos de botella:

- **Datos dispersos.** La información del estudiante, la planilla de inscripción y los antecedentes de trámites quedan repartidos entre expedientes físicos y hojas de cálculo independientes.
- **Redacción repetitiva de constancias.** Cada constancia de estudio, carta de buena conducta o de retiro vuelve a escribirse desde cero, con el riesgo de errores en nombres, cédulas y grados.
- **Control limitado del estado de los trámites.** No existe una vista que indique qué procesos están pendientes, cuáles en trámite y cuáles ya completados.
- **Procesos anuales de cambio de grado.** La ascensión de grado y la transición desde preescolar se ejecutan estudiante por estudiante, sin una regla uniforme que garantice coherencia entre secciones.

El sistema responde a esa necesidad con un registro único por estudiante, la generación de documentos a partir de esos datos y la automatización de las operaciones de cierre de año escolar.

## 3. Objetivos

### 3.1 Objetivo general

Centralizar el registro de estudiantes y la gestión de sus procesos institucionales en una aplicación web, reduciendo la duplicación de datos y el tiempo de emisión de documentos.

### 3.2 Objetivos específicos

1. Administrar el expediente del estudiante con la planilla de inscripción completa: datos personales, académicos, foto y datos de madre, padre y representante.
2. Registrar, editar, filtrar y dar seguimiento a los procesos institucionales asociados a cada estudiante.
3. Producir una versión imprimible de cada proceso con los datos de la institución y del estudiante ya incorporados.
4. Automatizar el ciclo escolar: determinación del año escolar, transición de agosto y promoción de grado según reglas fijas por nivel.
5. Mantener en un solo lugar la configuración institucional y los avisos internos.
6. Resguardar el acceso mediante identificación de usuario y sesión con vigencia definida.

## 4. Marco conceptual

**Sistema de información.** Conjunto organizado de personas, datos, procesos y tecnología que recolecta, almacena y procesa información para apoyar la operación y la toma de decisiones. En este proyecto el objeto de trabajo es el estudiante y su expediente administrativo, y el usuario principal es personal de secretaría y dirección.

**Gestión documental aplicada al ámbito escolar.** Todo documento que la institución emite es una derivación del expediente del alumno. El sistema asume que la información debe escribirse una sola vez y reutilizarse, principio que explica que las constancias se generen desde el registro del estudiante en lugar de redactarse de nuevo.

**Modelo relacional de datos.** La información se organiza en entidades con identificadores y relaciones entre ellas. El proyecto reconoce cinco entidades y las cardinalidades que las vinculan, presentadas en el documento del diagrama entidad-relación.

**Arquitectura cliente–servidor.** El navegador actúa como cliente que solicita y muestra la información, mientras un servidor central concentra las reglas del sistema y el acceso a los datos. Esta concentración es lo que permite que todos los usuarios vean la misma versión del año escolar y de la matrícula.

**Aplicación de una sola pieza.** El sistema se concibe y despliega como un único bloque funcional, no como servicios independientes. Es la decisión coherente con una instalación de tamaño reducido: un solo equipo que cumple las veces de servidor dentro de la institución.

**Almacenamiento local embebido.** La base de datos reside en un archivo del propio equipo, sin un servidor de base de datos que haya que instalar o administrar. A cambio de esa sencillez, el sistema está concebido para un número limitado de personas trabajando al mismo tiempo.

**Identificación y sesión.** El acceso se concede tras validar credenciales, y se mantiene mediante un token firmado que caduca. La identidad del usuario queda asociada a los procesos que registra, lo que habilita un responsable por trámite.

**Custodia de datos personales.** El sistema administra información personal de menores de edad y de sus representantes, además de imágenes. Ese carácter lo sitúa en el terreno de la protección de datos y condiciona las medidas de respaldo y de control de acceso que exige su uso real.

**Evolución del modelo de datos.** A medida que el proyecto amplió los datos del expediente, el modelo se fue extendiendo sobre la base existente sin descartar los registros anteriores. Se adopta así una política de crecimiento hacia adelante, que mantiene compatible la información ya cargada.

## 5. Concepción técnica

Desde el punto de vista técnico el sistema se apoya en cuatro decisiones: una aplicación web servida por un entorno de ejecución de JavaScript sobre el servidor, una base de datos relacional local de un solo archivo, autenticación por token de sesión con la contraseña resguardada cifrada, y un almacenamiento de documentos de imagen para la fotografía del estudiante. La elección de un motor de base de datos embebido y de una arquitectura de una sola pieza apunta a un objetivo concreto: que la institución pueda poner el sistema a funcionar sin infraestructura propia de tecnología, en un equipo administrativo común.

## 6. Módulos y funciones del sistema

### 6.1 Acceso identificado
Ingreso al sistema con usuario y contraseña. Toda función, salvo el propio ingreso y la salida, exige una sesión válida, que caduca a las veinticuatro horas. El módulo define quién realiza cada operación.

### 6.2 Panel de inicio
Pantalla de bienvenida con la fecha y la hora en curso y tres indicadores de gestión: procesos registrados, completados y en trámite, estos dos últimos con su proporción sobre el total. Ofrece una lectura rápida del estado administrativo sin necesidad de consultar listados.

### 6.3 Expediente del estudiante
Módulo central. Presenta la matrícula activa agrupada por grado y sección, y los estudiantes fuera de matrícula agrupados por situación (Inhabilitado, Egresado, Retirado). Permite buscar por nombre, apellido o cédula, registrar y editar la planilla de inscripción completa con su fotografía, y dar de baja a un estudiante junto con los procesos que le pertenecen.

### 6.4 Procesos institucionales
Registra los trámites por tipo —Planilla de Inscripción, Carta de Buena Conducta, Carta de Aceptación, Carta de Retiro, Constancia de Promoción de 6to Grado, Constancia de Estudio y Otro— con fecha, estado (Completado, En Trámite, Pendiente) y descripción. Cada tipo admite información particular del trámite. La consulta permite buscar por estudiante o cédula y filtrar por tipo y estado, de modo de responder cuántos trámites hay abiertos y de qué clase.

### 6.5 Emisión de documentos
Cada proceso dispone de una versión preparada para imprimir, con el escudo y los datos de la institución y la información del estudiante tomada de su expediente. Traslada la emisión de una constancia de una tarea de redacción a una de selección.

### 6.6 Automatización del ciclo escolar
Concentra las operaciones de cierre de período: ascensión de grado por selección múltiple, con vista previa y confirmación y posibilidad de reversa inmediata; transición de preescolar a primer grado de forma individual o por lote; y promoción automática de los estudiantes de sexto grado a la condición de graduados al iniciar el nuevo año escolar.

### 6.7 Configuración institucional y avisos
Reúne los datos de la institución —denominación, código, año escolar, dirección y contacto—, el perfil y la contraseña de acceso del usuario, y la publicación y retiro de avisos internos.

### 6.8 Presentación de la interfaz
Cuatro temas de color —Turquesa, Guinda, Verde pino y Terracota— seleccionables desde los ajustes. El tema elegido es único para toda la institución y se aplica también a la pantalla de acceso.

## 7. Modelo de datos

El sistema reconoce cinco entidades. **Estudiante** es la entidad principal y se identifica por la cédula. **Proceso** depende de un estudiante y de un usuario que lo registra. **Usuario** guarda la identidad y las credenciales de acceso. **Configuración** es un registro único con los datos institucionales, el año escolar vigente y la presentación elegida. **Aviso** es información interna suelta, sin dependencia de las demás.

Dos decisiones de modelado caracterizan el sistema. La primera es tomar la cédula como identificador natural del estudiante: el expediente se ancla en el documento de identidad real y no en un número interno, lo que alinea la base con la nomenclatura administrativa del sector y dificulta el duplicado. La segunda es concentrar la planilla de inscripción en la propia entidad de estudiante, de manera que los datos del alumno, de la madre, del padre y del representante conviven en un mismo registro. La ventaja es que el expediente se lee de una vez; el costo es una entidad muy ancha, donde un cambio en la estructura de la planilla afecta al estudiante en su conjunto.

Las relaciones entre estudiantes y procesos no las impone el almacén de datos sino la lógica del sistema, que verifica la existencia del estudiante antes de aceptar un proceso. La cardinalidad, los atributos y la representación gráfica están en `diagramaentidadrelacion.md`.

## 8. Reglas de negocio principales

- **Año escolar dinámico.** Se determina a partir de la fecha: desde agosto comienza el período siguiente, expresado como rango "año - año siguiente".
- **Transición de agosto.** Al iniciarse, el sistema reconoce si el año escolar cambió respecto del registrado; en ese caso lo actualiza y pasa a *Inhabilitado* a los estudiantes activos de 6to Grado, dejando constancia del período ya procesado para no repetir la operación.
- **Ascensión de grado.** Preescolar A o B pasa a 1er Grado sección A; Preescolar C o D pasa a 1er Grado sección B; de 1ero a 5to grado se conserva la sección y se avanza un grado; 6to Grado sale de la matrícula como graduado conservando grado y sección. Solo ascienden estudiantes en estado Activo.
- **Presentación única por institución.** El tema de color se decide una vez para toda la institución, no por usuario.
- **Coherencia del expediente.** Al dar de baja un estudiante desaparecen también sus procesos, para que no queden registros de personas que ya no forman parte de la matrícula.

## 9. Alcance actual

El sistema cubre, en su estado presente, la totalidad del flujo administrativo descrito: alta y edición del expediente del estudiante, registro y seguimiento de procesos, emisión imprimible de constancias, automatización del cambio de año escolar y de grado, administración de avisos y de la configuración institucional, todo con control de acceso por sesión.

Su alcance operativo es el de un **puesto de trabajo individual o una red interna pequeña**, porque el almacenamiento reside en un archivo local y la aplicación se instala en un equipo. La interfaz está en español y sigue la nomenclatura del subsistema educativo venezolano: cédula, grado y sección, año escolar, código DEA.

Quedan fuera del alcance actual la gestión de múltiples usuarios con permisos diferenciados, la firma digital o el archivo histórico de documentos ya emitidos, la conexión con los sistemas centrales del Ministerio de Educación, el control de personal docente, la comunicación con representantes por canales externos y cualquier reporte estadístico consolidado entre períodos.

## 10. Alcance una vez implementado

Llevado a operación dentro de la institución, el sistema se posiciona como el registro administrativo de referencia para la secretaría y la dirección. El alcance esperado en ese escenario es:

- **Unificación del expediente.** Un solo lugar donde consultar quién está inscrito, en qué grado y sección, quién figura como representante y qué trámites se le han emitido.
- **Reducción del tiempo de atención.** La emisión de una constancia deja de ser un documento nuevo y pasa a ser la impresión de un registro existente.
- **Consistencia del dato institucional.** El año escolar, la denominación de grados y secciones y la forma de redactar una constancia dejan de depender de criterios individuales.
- **Trazabilidad de los procesos.** El estado de cada trámite permite responder cuántos están abiertos, desde cuándo y a cargo de quién.
- **Cierre de año confiable.** La transición de agosto y la ascensión de grado se aplican por regla general y no de forma manual, con vista previa antes de confirmar.
- **Baja barrera de despliegue.** Al no requerir infraestructura de base de datos ni conexión a internet para funcionar, puede instalarse en un equipo administrativo existente.

Sostener ese alcance exige tres condiciones operacionales: respaldos periódicos y verificables de la base de datos, cambio de las credenciales de demostración antes de trabajar con datos reales, y acceso restringido a la red interna o a un equipo dedicado.

## 11. Proyección a futuro

La evolución natural del sistema se ordena en tres etapas, de menor a mayor esfuerzo.

### Etapa 1 — Consolidación
- Roles y permisos efectivos: dirección, secretaría, docente y acceso de solo lectura, aprovechando que el sistema ya distingue un rol por usuario.
- Registro de auditoría de los cambios en expedientes y procesos, con fecha y responsable.
- Respaldo automático programado de la base de datos, con procedimiento de restauración probado.
- Exportación directa a documento digital y aplicación de firma o sello institucional.

### Etapa 2 — Ampliación funcional
- Historial académico del estudiante: notas, secciones por período y años cursados, para acompañar al alumno a lo largo de la primaria.
- Reportes y estadísticas: matrícula por grado y sección, comparativos entre años escolares, informes de promoción y deserción.
- Plantillas configurables por tipo de proceso, con texto propio para cada clase de constancia.
- Avisos con control de vigencia y destinatarios.
- Migración del almacenamiento a un servidor de base de datos cuando el número de usuarios concurrentes supere lo que corresponde atender con un archivo local.

### Etapa 3 — Integración
- Servicios de datos para comunicar el sistema con otros módulos institucionales.
- Portal para representantes, con consulta del expediente y descarga de constancias.
- Carga masiva inicial desde planillas, para migrar el archivo físico existente.
- Operación en servidor con conexión segura, sesiones simultáneas controladas y política de contraseñas robusta.
- Adaptación del modelo a otros niveles educativos, parametrizando la malla de grados y las reglas de ascensión.

## 12. Limitaciones conocidas

El proyecto es una base académica y conviene declarar sus límites. El acceso distingue un solo nivel: el sistema registra un rol por usuario, pero no lo emplea para restringir funciones, de modo que quien entra puede operar todo. La conexión se concibe para el entorno local de una máquina o una red interna, sin las garantías de privacidad que aporta un canal cifrado externo, y conserva prácticas propias del desarrollo que deben cerrarse antes de un uso real, entre ellas la información que se deja en los registros del servidor y una clave de respaldo para las sesiones. La integridad entre estudiantes y procesos la sostiene la lógica de la aplicación, no el almacén de datos. No existen pruebas automatizadas que verifiquen el comportamiento ni un proceso de revisión de los componentes de terceros que se incorporan. Por último, los datos personales de estudiantes y sus fotografías quedan en el equipo donde se instala el sistema: su custodia depende de los respaldos y del control físico del puesto de trabajo.

Ninguna de estas limitaciones afecta la validez del modelo ni de las reglas de negocio; corresponden al grado de madurez propio de un proyecto de formación y están previstas en la Etapa 1 de la proyección.

## 13. Conclusión

El Gestor de Procesos Institucionales resuelve un problema concreto y acotado: la dispersión del expediente del estudiante y la redacción manual de los documentos que se derivan de él. Su valor no está en la tecnología, ampliamente difundida, sino en la modelación del dominio escolar venezolano —la cédula como identidad, el año escolar como ciclo dinámico, la ascensión por reglas fijas— y en la decisión de mantener el sistema en una forma simple y portable, capaz de funcionar sin infraestructura de datos propia.

El alcance alcanzable a corto plazo es la administración diaria de la secretaría de una institución de educación primaria. La proyección, mediante roles, auditoría, reportes y un almacenamiento más robusto, lo perfila como la base de un sistema institucional más amplio, condicionado a que se resuelvan las limitaciones de seguridad y respaldo que hoy corresponden a un entorno de desarrollo.

## 14. Referencias

- Documentación del proyecto: `README.md` (funcionalidades, tecnologías, estructura, instalación y consideraciones de seguridad).
- Modelo de datos: `diagramaentidadrelacion.md`.
- Gestión documental y sistemas de información administrativa: conceptos de registro único, reutilización del dato y trazabilidad.
- Modelo entidad-relación: notación de entidades, atributos, identificadores y cardinalidades.
- Autenticación por token de sesión y cifrado de contraseñas.
- Protección de datos personales de menores de edad en entornos escolares.

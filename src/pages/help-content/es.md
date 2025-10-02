# Ayuda y guía de uso

1.  [Inicio rápido](#quickstart)
2.  [Conceptos clave](#conceptos-clave)
3.  [Hoy y Ahora/Siguiente](#hoy-y-ahorasiguiente)
4.  [Ajustes](#ajustes)
    -   [Niños](#niños)
    -   [Asignaturas](#asignaturas)
    -   [Planificador](#planificador)
5.  [Compartir / Exportar e Importar](#compartir--exportar-e-importar)
6.  [Instalación y modo sin conexión](#instalación-y-modo-sin-conexión)
7.  [FAQ y resolución de problemas](#faq-y-resolución-de-problemas)
8.  [Datos y privacidad](#datos-y-privacidad)
9.  [Contacto](#contacto)

## Inicio rápido

1.  Ve a [Asignaturas](/matters) y crea tus materias/actividades. Ponles un nombre, un color y (opcionalmente) un rango de fechas durante el cual estarán activas.
2.  Ve a [Niños](/kids) y añade a cada niño (la app genera un avatar automáticamente).
3.  Abre el [Planificador](/timetable-scheduler), elige un niño y haz clic en celdas vacías de la cuadrícula para añadir asignaturas. Arrastra para mover; arrastra las barras finas de arriba o abajo para redimensionar.
4.  Ajusta tu semana en [Ajustes](/settings) (horas de inicio/fin, días visibles/ocultos, día de inicio de semana).
5.  Usa [Hoy](/today) para ver el día de un vistazo (o el resumen Ahora/Siguiente en Inicio).

## Conceptos clave

### Niños

Personas para las que planificas. Cada niño tiene un nombre y un avatar. Los horarios son por niño.

### Asignaturas

Materias/actividades con un color y fechas activas opcionales (inicio/fin). Los bloques del horario hacen referencia a una asignatura.

### Configuración

Ajustes globales: horas visibles, días de la semana ocultos y día de inicio de la semana. Esto da forma a la cuadrícula del planificador.

## Hoy y Ahora/Siguiente

La vista [Hoy](/today) muestra un único día con un marcador de “hora actual”. La tarjeta de cada niño también muestra la asignatura **Ahora** (con barra de progreso) y la **Siguiente**, solo si están dentro de sus rangos de fechas.

-   Cambia entre días con ◀︎ / ▶︎ en la vista Hoy; usa “Hoy” para volver a la fecha actual.
-   Si no hay nada ocurriendo “ahora”, verás solo la asignatura “siguiente” (si existe).

## Ajustes

-   **Horas del planificador:** define la hora visible de inicio/fin de la cuadrícula.
-   **Días visibles:** muestra/oculta días (p. ej., fines de semana).
-   **Inicio de semana:** elige con qué día comienza tu semana; el planificador reordena las columnas en consecuencia.

La app valida las horas para que la de fin siempre sea posterior a la de inicio.

### Niños

-   **Añadir / editar / eliminar** niños en [Niños](/kids).
-   Los avatares se generan automáticamente; el selector muestra avatar y nombre—haz clic para seleccionar.
-   Los horarios son por niño. Cambia de niño con el selector de avatares en la parte superior del Planificador.

### Asignaturas

-   Crea/edita asignaturas en [Asignaturas](/matters).
-   El **rango de fechas** (Inicio/Fin) opcional controla cuándo se considera activa la asignatura.
-   El color se usa para estilizar los bloques; mantén una paleta coherente para facilitar la lectura.

## Planificador

El planificador muestra una cuadrícula semanal. Las columnas son los días de la semana (respetando los días ocultos y el inicio de semana elegido). Las filas son franjas horarias (pasos de 5 minutos). El rango vertical visible se controla desde Ajustes.

-   **Añadir un bloque:** haz clic en una celda vacía → elige una asignatura en la ventana emergente.
-   **Mover:** arrastra el bloque a cualquier lugar, incluso a otros días.
-   **Redimensionar:** arrastra el asa fina superior o inferior. Los bloques se ajustan a incrementos de 5 minutos.
-   **Eliminar:** pulsa el icono 🗑️ del bloque y confirma.
-   **Resaltado al pasar el cursor:** la fila bajo el cursor se resalta suavemente para facilitar el arrastre.
-   **Fechas de asignatura:** una asignatura solo se considera “en curso” entre sus fechas de inicio y fin; eso afecta a las vistas de Hoy/Ahora.

Consejo: si no ves las franjas de mañana/tarde que esperas, amplía el rango visible en [Ajustes](/settings).

## Compartir / Exportar e Importar

Usa el botón **Compartir** (icono de compartir) para exportar los horarios de los niños seleccionados junto con las asignaturas usadas y la configuración global en un enlace. En navegadores compatibles, se abre la hoja nativa de compartir; en caso contrario se muestra un enlace para copiar.

### Qué se exporta

-   Niños seleccionados
-   Solo las _asignaturas usadas_ en sus horarios
-   Configuración global (horas, días ocultos, inicio de semana)

### Comportamiento de importación

-   **Niños:** se añaden si son nuevos; si un niño ya existe (por nombre o ID según tu implementación), se mantiene, y su horario se _sobrescribe_ con el importado.
-   **Asignaturas:** se casan por nombre; las nuevas se añaden y las existentes se reutilizan. Las fechas de inicio/fin se amplían solo si el rango entrante empieza antes/termina después.
-   **Configuración:** la hora de inicio solo se adelanta si la entrante es anterior; la hora de fin solo se retrasa si la entrante es posterior; los días ocultos y el inicio de semana se combinan de forma razonable.

También puedes pegar un enlace con `#data=…` en la barra de direcciones; la pantalla de importación te permitirá elegir qué traer.

## Instalación y modo sin conexión

-   Pulsa **Instalar app** (cuando se ofrezca) para añadirla a tu dispositivo.
-   La app funciona sin conexión; tus datos se guardan en este dispositivo (almacenamiento local).

## FAQ y resolución de problemas

**Mis bloques no muestran horas muy tempranas/tardías.** Aumenta el rango de horas visibles en [Ajustes](/settings).

**No puedo soltar un bloque exactamente donde quiero.** Los bloques se ajustan a incrementos de 5 minutos. Prueba a soltarlo cerca de la hora deseada.

**No aparece nada en Ahora/Siguiente.** Revisa las fechas de inicio/fin de la asignatura y la fecha de hoy. Las asignaturas fuera de rango se ignoran.

**No puedo ver/compartir el enlace de exportación.** Algunos navegadores bloquean la hoja nativa de compartir; la app muestra un enlace copiable como alternativa.

**¿Cómo restablezco todo?** Usa los controles de almacenamiento del sitio de tu navegador para borrar el almacenamiento local de esta app (esto elimina todos los datos).

## Datos y privacidad

## Datos y privacidad

-   **Local primero.** Todos tus datos del día a día (niños, materias, horarios, configuración) se guardan en el almacenamiento local de tu navegador.
-   **Nada se sube salvo que compartas.** Cuando tocas **Compartir / Exportar**, la app crea un **paquete temporal** que contiene solo:
    -   los niños seleccionados y sus horarios,
    -   las materias usadas en esos horarios,
    -   y (opcionalmente) las horas del planificador.
-   **Cómo funciona el intercambio.** Ese paquete se guarda de forma privada en el **almacenamiento Netlify Blobs** de la app y recibes un enlace corto con un ID aleatorio. El enlace **no contiene datos personales**, solo el ID.
-   **Quién puede acceder.** Cualquiera con el enlace puede descargar ese paquete e importarlo en la app. El paquete no está indexado ni listado públicamente.
-   **Caducidad automática.** Los paquetes compartidos **caducan automáticamente a los 30 días** y se eliminan de forma permanente. Si alguien abre un enlace caducado, verá un error y no se importará nada.
-   **Revocar un enlace.** No hay sistema de cuentas, así que no puedes “revocar” un enlace concreto tras compartirlo. Si necesitas una eliminación anticipada, espera a la caducidad automática o genera un enlace nuevo.
-   **Funciona sin conexión.** Fuera de compartir/importar, la app funciona completamente sin conexión.

## Contacto

¿Preguntas, ideas o errores? Escríbenos cuando quieras:

-   [📧 Email — jmtalarn+timetablepwa@gmail.com](mailto:jmtalarn+timetablepwa@gmail.com)
-   [𝕏 / Twitter — @jmtalarn](https://x.com/jmtalarn)
-   [Bluesky — @jmtalarn.com](https://bsky.app/profile/jmtalarn.com)
-   [LinkedIn — /in/jmtalarn](https://www.linkedin.com/in/jmtalarn)

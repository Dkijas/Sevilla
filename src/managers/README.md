# Gestores del Juego

Este directorio contiene las clases que gestionan diversos subsistemas del juego de simulación de hermandades y procesiones de Sevilla.

## EventManager

Gestor de eventos que permite la comunicación entre distintos componentes del juego utilizando un patrón observador. Facilita la desvinculación entre componentes, permitiendo que se comuniquen sin depender directamente unos de otros.

**Eventos principales:**
- `BROTHERHOOD_CREATED`: Cuando se crea una nueva hermandad
- `ROUTE_CREATED`: Cuando se finaliza la creación de una ruta
- `PROCESSION_STARTED`: Cuando comienza una procesión
- `PROCESSION_COMPLETED`: Cuando finaliza una procesión
- `PROCESSION_CANCELLED`: Cuando se cancela una procesión manualmente

## TimeManager

Controla el paso del tiempo en el juego, permitiendo avanzar años y generando eventos históricos que pueden afectar a las hermandades.

**Funcionalidades:**
- Avanzar años
- Generar eventos históricos
- Notificar cambios de tiempo a los sistemas suscritos

## RouteManager

Gestiona la creación y visualización de rutas para las procesiones.

**Funcionalidades:**
- Iniciar el modo de creación de ruta
- Registrar puntos en el mapa al hacer clic
- Validar rutas (inicio y fin en la sede)
- Dibujar representación visual de la ruta
- Finalizar la creación de la ruta

## ProcessionManager

Controla la simulación de procesiones, gestionando el movimiento de nazarenos y pasos por la ruta definida.

**Funcionalidades:**
- Crear elementos visuales de la procesión (nazarenos, pasos, cruz de guía)
- Gestionar el movimiento a lo largo de la ruta
- Reproducir animaciones durante el recorrido
- Permitir pausar, reanudar y cancelar procesiones
- Calcular y notificar el progreso de la procesión

## LogManager

Sistema de registro y depuración que captura eventos, información y errores durante la ejecución del juego.

**Funcionalidades:**
- Registrar mensajes con diferentes niveles de severidad (debug, info, warning, error, fatal)
- Capturar automáticamente errores no controlados
- Guardar logs en archivos de texto para su posterior análisis
- Formatear y mostrar logs en consola con formato enriquecido
- Gestionar sesiones de juego con identificadores únicos

**Niveles de log:**
- **DEBUG**: Información detallada útil durante el desarrollo
- **INFO**: Mensajes informativos sobre el estado normal del juego
- **WARNING**: Advertencias sobre situaciones que requieren atención
- **ERROR**: Errores que afectan al funcionamiento pero no detienen la ejecución
- **FATAL**: Errores críticos que pueden detener la ejecución del juego

Los archivos de log se generan automáticamente cuando ocurren errores o advertencias, con el formato `sevilla_log_AAAAMMDD_sessionID.txt`.

## UIManager

Gestiona los elementos de interfaz de usuario, proporcionando métodos para crear, mostrar y ocultar componentes UI.

**Funcionalidades:**
- Crear botones, textos y otros elementos de interfaz
- Gestionar formularios y paneles
- Mostrar mensajes temporales
- Mantener estilos consistentes en toda la aplicación

## BrotherhoodManager

Gestiona la creación y administración de hermandades en el juego.

**Funcionalidades:**
- Mostrar formulario de creación de hermandad
- Gestionar la interfaz de información de la hermandad
- Crear marcadores visuales para la sede
- Actualizar el estado de la hermandad en la interfaz

## StateManager

Controla el estado global del juego, permitiendo transiciones controladas entre diferentes modos.

**Funcionalidades:**
- Definir estados del juego (idle, creando hermandad, creando ruta, procesionando)
- Gestionar transiciones entre estados
- Notificar a otros componentes sobre cambios de estado
- Habilitar/deshabilitar funcionalidades según el estado actual

## Integración

Los gestores trabajan juntos para proporcionar una experiencia de juego coherente:

1. El usuario crea una hermandad (usando `BrotherhoodManager`)
2. El `RouteManager` permite al usuario crear un itinerario para la procesión
3. El `ProcessionManager` usa esa ruta para simular la procesión
4. El `EventManager` facilita la comunicación entre estos componentes
5. El `TimeManager` proporciona el contexto temporal para todos los eventos
6. El `LogManager` registra toda la actividad y captura errores para su depuración
7. El `UIManager` proporciona la interfaz visual para todas las interacciones
8. El `StateManager` coordina el estado global y las transiciones

Esta arquitectura modular facilita la extensión y mantenimiento del código, permitiendo añadir nuevas funcionalidades sin modificar excesivamente el código existente. 
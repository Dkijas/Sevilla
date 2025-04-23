# Sistema de Logs para Depuración - Sevilla

Este documento describe el sistema de logs implementado para la depuración del juego Sevilla.

## Características principales

- **Diferentes niveles de log**: DEBUG, INFO, WARNING, ERROR y FATAL
- **Guardado automático**: Los logs de nivel WARNING o superior se guardan automáticamente en archivos
- **Captura automática de errores**: Captura errores no controlados y promesas rechazadas
- **Formato enriquecido**: Los logs incluyen timestamps, niveles y datos adicionales
- **Visualización en consola**: Muestra logs formateados en la consola del navegador
- **Generación de archivos**: Crea archivos .txt descargables con los logs

## Uso básico

Para registrar un mensaje en el sistema de logs:

```javascript
// Mensajes informativos
this.logManager.info('Mensaje informativo', { datos: 'adicionales' });

// Advertencias
this.logManager.warning('Algo no va bien', { razón: 'Configuración incorrecta' });

// Errores
this.logManager.error('Error al cargar el recurso', error);

// Errores fatales
this.logManager.fatal('Error crítico en el sistema', { error: error.stack });
```

## Archivos generados

Los archivos de log se generan con el siguiente formato:

```
sevilla_log_AAAAMMDD_sessionID.txt
```

Donde:
- `AAAAMMDD` es la fecha actual
- `sessionID` es un identificador único de la sesión de juego

## Contenido del archivo de logs

El archivo contiene todos los logs de nivel WARNING o superior, formateados de la siguiente manera:

```
=== LOGS DE SEVILLA - SESIÓN: session_20230615_123456_7890 ===
Generado: 15/06/2023 12:34:56

[WARNING] 15/06/2023 12:30:45: Mensaje de advertencia
  {
    "datos": "adicionales",
    "otrosDatos": 123
  }

[ERROR] 15/06/2023 12:32:10: Error al cargar recurso
  {
    "message": "Error: No se pudo cargar el archivo",
    "name": "Error",
    "stack": "Error: No se pudo cargar el archivo\n    at loadResource (main.js:123)"
  }

[FATAL] 15/06/2023 12:33:22: Error crítico en el sistema
  {
    "message": "Cannot read property 'x' of null",
    "name": "TypeError",
    "stack": "TypeError: Cannot read property 'x' of null\n    at processData (main.js:456)"
  }
```

## Integración con el sistema de eventos

El sistema de logs está integrado con el EventManager del juego, y escucha los siguientes eventos:

- `GAME_INIT`, `GAME_PAUSE`, `GAME_RESUME`: Eventos del ciclo de vida del juego
- `PROCESSION_STARTED`, `PROCESSION_COMPLETED`, `PROCESSION_CANCELLED`: Eventos de procesión
- `ERROR`, `FATAL_ERROR`: Eventos de error emitidos por cualquier componente

## Implementación

El sistema está implementado en la clase `LogManager` ubicada en `Sevilla/src/managers/LogManager.js`. 

Se integra en la escena principal a través del método `create()` en `GameScene.js`, y proporciona una interfaz de usuario para probar su funcionamiento mediante un botón de "Test Logs" ubicado en la esquina inferior derecha.

## Pruebas

Para probar el sistema de logs, se ha implementado un botón que genera logs de diferentes niveles y simula errores controlados y fatales. Al hacer clic en el botón "Test Logs", se pueden ver los resultados en la consola y se genera un archivo de logs.

## Guardado automático y manual

Los logs se guardan automáticamente cuando:

1. Se produce un error fatal
2. Después de 5 segundos de inactividad si hay logs pendientes

También se pueden guardar manualmente llamando a:

```javascript
this.logManager.forceSave();
```

## Recomendaciones de uso

- Usar `debug()` para información detallada durante el desarrollo
- Usar `info()` para eventos normales del juego
- Usar `warning()` para situaciones inesperadas pero no críticas
- Usar `error()` para problemas que afectan la funcionalidad pero no detienen el juego
- Usar `fatal()` para errores críticos que podrían detener el juego

Al incluir datos adicionales, proporcionar información relevante que ayude en la depuración. 
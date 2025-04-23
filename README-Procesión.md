# Sistema de Movimiento de Procesiones

## Introducción

Este documento describe el sistema de movimiento para las procesiones en el juego Sevilla. El sistema está diseñado para representar el recorrido de diferentes elementos (cruz de guía, nazarenos, pasos) a lo largo de una ruta predefinida.

## Arquitectura

El sistema de movimiento está compuesto por los siguientes componentes:

1. **ProcessionElement (src/entities/ProcessionElement.js)**
   - Clase base para cada elemento individual de la procesión
   - Maneja el movimiento, animación y estado de un elemento a lo largo de la ruta
   - Proporciona métodos para actualizar la posición, aplicar efectos de balanceo y controlar el progreso

2. **ProcessionMovement (src/entities/ProcessionMovement.js)**
   - Gestiona el conjunto completo de elementos de una procesión
   - Coordina la creación, distribución, movimiento y finalización de todos los elementos
   - Implementa el bucle de actualización y el cálculo de progreso general

3. **ProcessionManager (src/managers/ProcessionManager.js)**
   - Integra el sistema de movimiento con el resto del juego
   - Proporciona una interfaz para iniciar, pausar y cancelar procesiones
   - Mantiene compatibilidad con el sistema anterior mediante un enfoque de fallback

## Características Principales

- **Movimiento Realista**: Cada elemento tiene su propia velocidad y comportamiento
- **Efecto de Balanceo**: Los elementos se balancean sutilmente durante el recorrido
- **Sistema de Progresión**: Seguimiento preciso del avance de la procesión
- **Animaciones de Finalización**: Efectos visuales para el inicio y fin de la procesión
- **Sistema de Eventos**: Notificaciones para eventos importantes (inicio, progreso, pausa, finalización)
- **Compatibilidad con Versiones Anteriores**: Funciona como mejora sobre el sistema existente

## Integración con el Juego

El sistema se integra con el resto del juego a través del `ProcessionManager`, que recibe órdenes desde el `GameScene`. El flujo típico es:

1. El usuario define una ruta para la procesión
2. Se inicia la procesión con `startProcession()`
3. El `ProcessionManager` crea una instancia de `ProcessionMovement`
4. Los elementos se mueven automáticamente a lo largo de la ruta
5. Cuando todos los elementos completan el recorrido, la procesión finaliza

## Personalización

El sistema permite personalizar múltiples parámetros:

- Velocidad base de la procesión
- Espaciado entre elementos
- Número de nazarenos basado en la popularidad de la hermandad
- Efectos visuales y animaciones
- Retrasos y pausas durante el recorrido

## Ejemplo de Uso

```javascript
// En GameScene.js
startProcession() {
  if (this.brotherhood && this.processionRoute) {
    this.processionManager.startProcession(this.brotherhood, this.processionRoute);
  }
}

// En ProcessionManager.js
startProcession(brotherhood, route) {
  // Inicialización...
  this.startProcessionMovement();
}

// ProcessionMovement gestiona automáticamente el movimiento
```

## Limitaciones y Mejoras Futuras

- Implementar colisiones con obstáculos en la ruta
- Añadir comportamientos más realistas para nazarenos y pasos
- Mejorar la interacción con la multitud
- Incorporar efectos ambientales (día/noche, clima) 
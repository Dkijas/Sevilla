import ProcessionElement from './ProcessionElement';

/**
 * Clase para gestionar el movimiento de una procesión completa
 * @class ProcessionMovement
 */
export default class ProcessionMovement {
  /**
   * Crea una instancia del gestor de movimiento de procesión
   * @param {Phaser.Scene} scene - La escena del juego
   * @param {EventManager} eventManager - El gestor de eventos
   * @param {Object} config - Configuración del movimiento
   */
  constructor(scene, eventManager, config = {}) {
    this.scene = scene;
    this.eventManager = eventManager;
    
    // Configuración
    this.config = {
      nazarenoSpacing: config.nazarenoSpacing || 20,
      stepDelay: config.stepDelay || 100,
      pauseDelay: config.pauseDelay || 2000,
      baseSpeed: config.baseSpeed || 1,
      ...config
    };
    
    // Estado
    this.isActive = false;
    this.isPaused = false;
    this.elements = [];
    this.route = [];
    this.step = 0;
    this.elapsedTime = 0;
    this.completedElements = 0;
    
    // Referencias
    this.movementLoop = null;
    this.logManager = this.scene.logManager;
    
    if (this.logManager) {
      this.logManager.debug('ProcessionMovement inicializado', {
        config: this.config
      });
    }
  }
  
  /**
   * Inicializa una procesión con sus elementos
   * @param {Array} route - Ruta a seguir
   * @param {Object} brotherhood - Hermandad a la que pertenece la procesión
   * @returns {boolean} - True si se inicializó correctamente
   */
  initialize(route, brotherhood) {
    if (!route || route.length < 3 || !brotherhood) {
      if (this.logManager) {
        this.logManager.error('Error al inicializar procesión: datos insuficientes', {
          hasRoute: !!route,
          routeLength: route?.length || 0,
          hasBrotherhood: !!brotherhood
        });
      }
      return false;
    }
    
    // Almacenar ruta
    this.route = route;
    this.brotherhood = brotherhood;
    
    // Resetear estado
    this.clearElements();
    this.step = 0;
    this.elapsedTime = 0;
    this.completedElements = 0;
    this.isActive = false;
    this.isPaused = false;
    
    // Crear elementos de la procesión
    this.createProcessionElements(brotherhood);
    
    // Distribuir elementos a lo largo de la ruta
    this.distributeElements();
    
    if (this.logManager) {
      this.logManager.info('Procesión inicializada correctamente', {
        elementsCount: this.elements.length,
        routeLength: this.route.length
      });
    }
    
    return true;
  }
  
  /**
   * Crea los elementos de la procesión
   * @param {Object} brotherhood - Hermandad a la que pertenece la procesión
   * @private
   */
  createProcessionElements(brotherhood) {
    // Punto inicial
    const startPoint = this.route[0];
    
    // Calcular número de nazarenos basado en popularidad
    const popularity = brotherhood.popularity || 10;
    const nazarenoCount = Math.min(
      Math.ceil(popularity / 2),
      50 // Máximo de nazarenos
    );
    
    // 1. Cruz de guía (siempre va al inicio)
    this.elements.push(new ProcessionElement(this.scene, {
      type: 'cruz',
      texture: 'cruz_guia',
      x: startPoint.x,
      y: startPoint.y,
      scale: 0.8,
      depth: 10,
      speed: this.config.baseSpeed * 1.1
    }, this.route));
    
    // 2. Añadir nazarenos
    for (let i = 0; i < nazarenoCount; i++) {
      this.elements.push(new ProcessionElement(this.scene, {
        type: 'nazareno',
        texture: 'nazareno',
        x: startPoint.x,
        y: startPoint.y,
        scale: 0.7,
        depth: 11 + i,
        speed: this.config.baseSpeed * (1 - (i * 0.005)) // Velocidad ligeramente decreciente
      }, this.route));
    }
    
    // 3. Añadir pasos (Misterio y Gloria)
    this.elements.push(new ProcessionElement(this.scene, {
      type: 'paso',
      texture: 'paso_misterio',
      x: startPoint.x,
      y: startPoint.y,
      scale: 1,
      depth: 50,
      speed: this.config.baseSpeed * 0.8 // Más lento que nazarenos
    }, this.route));
    
    if (brotherhood.hasGloriaStage) {
      this.elements.push(new ProcessionElement(this.scene, {
        type: 'paso',
        texture: 'paso_gloria',
        x: startPoint.x,
        y: startPoint.y,
        scale: 1,
        depth: 51,
        speed: this.config.baseSpeed * 0.75 // Más lento aún
      }, this.route));
    }
    
    if (this.logManager) {
      this.logManager.debug('Elementos de procesión creados', {
        totalElements: this.elements.length,
        nazarenos: nazarenoCount,
        pasos: brotherhood.hasGloriaStage ? 2 : 1
      });
    }
  }
  
  /**
   * Distribuye los elementos a lo largo de la ruta con espaciado adecuado
   * @private
   */
  distributeElements() {
    if (!this.elements.length) return;
    
    // Colocar todos los elementos en el punto de inicio inicialmente
    const startPoint = this.route[0];
    this.elements.forEach(element => {
      element.resetToStart();
    });
  }
  
  /**
   * Inicia el movimiento de la procesión
   * @returns {boolean} - True si se inició correctamente
   */
  startMovement() {
    if (this.isActive) {
      if (this.logManager) {
        this.logManager.warning('Intento de iniciar movimiento con procesión ya activa');
      }
      return false;
    }
    
    try {
      // Marcar como activa
      this.isActive = true;
      this.isPaused = false;
      
      // Configurar bucle de movimiento
      this.movementLoop = this.scene.time.addEvent({
        delay: this.config.stepDelay,
        callback: this.updateMovement,
        callbackScope: this,
        loop: true
      });
      
      // Notificar inicio
      this.eventManager.emit('PROCESSION_MOVEMENT_STARTED', {
        elementsCount: this.elements.length,
        brotherhood: this.brotherhood.name
      });
      
      if (this.logManager) {
        this.logManager.info('Movimiento de procesión iniciado', {
          stepDelay: this.config.stepDelay,
          elementsCount: this.elements.length
        });
      }
      
      return true;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al iniciar movimiento de procesión', {
          error: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }
  
  /**
   * Actualiza la posición de todos los elementos
   * @private
   */
  updateMovement() {
    if (!this.isActive || this.isPaused) return;
    
    // Incrementar contador y tiempo
    this.step++;
    this.elapsedTime += this.config.stepDelay;
    
    // Flag para log periódico (cada 50 pasos)
    const shouldLog = this.step % 50 === 0;
    
    try {
      // Contador de elementos completados en esta iteración
      let newlyCompleted = 0;
      
      // Actualizar cada elemento con su velocidad individual
      this.elements.forEach((element, index) => {
        const result = element.update(this.config.stepDelay);
        
        // Aplicar efecto de balanceo
        if (['nazareno', 'paso'].includes(element.type)) {
          element.applySwayEffect(this.step, element.type === 'paso' ? 0.05 : 0.02);
        }
        
        // Verificar si el elemento completó su recorrido en esta iteración
        if (result && result.completed && !element.wasCompletedBefore) {
          element.wasCompletedBefore = true;
          newlyCompleted++;
          
          if (this.logManager) {
            this.logManager.debug(`Elemento ${element.type} completó recorrido`, {
              index: index,
              totalElements: this.elements.length
            });
          }
        }
      });
      
      // Actualizar contador de elementos completados
      this.completedElements += newlyCompleted;
      
      // Verificar si todos los elementos han completado la ruta
      if (this.completedElements >= this.elements.length) {
        if (this.logManager) {
          this.logManager.info('Todos los elementos completaron la ruta');
        }
        this.completeProcession();
        return;
      }
      
      // Log periódico de progreso
      if (shouldLog && this.logManager) {
        const progress = this.calculateProgress();
        this.logManager.debug(`Progreso de procesión: ${Math.round(progress * 100)}%`, {
          elapsedTime: this.elapsedTime,
          completedElements: this.completedElements,
          totalElements: this.elements.length
        });
      }
      
      // Notificar progreso cada 30 segundos
      if (this.elapsedTime % 30000 < this.config.stepDelay) {
        const progress = this.calculateProgress();
        
        this.eventManager.emit('PROCESSION_PROGRESS', {
          brotherhood: this.brotherhood,
          progress: progress,
          elapsedTime: this.elapsedTime,
          completedElements: this.completedElements,
          totalElements: this.elements.length
        });
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error en actualización de movimiento', {
          step: this.step,
          error: error.message,
          stack: error.stack
        });
      }
    }
  }
  
  /**
   * Calcula el progreso general de la procesión
   * @returns {number} - Progreso de 0 a 1
   */
  calculateProgress() {
    if (!this.elements.length) return 0;
    
    // Sumar progreso de todos los elementos
    let totalProgress = 0;
    this.elements.forEach(element => {
      // Calcular progreso de cada elemento (0-1)
      const elementProgress = (element.routeIndex + element.progress) / (this.route.length - 1);
      totalProgress += Math.min(1, elementProgress);
    });
    
    // Promedio de progreso
    return totalProgress / this.elements.length;
  }
  
  /**
   * Pausa o reanuda el movimiento de la procesión
   * @returns {boolean} - Estado actual (true = pausado)
   */
  togglePause() {
    if (!this.isActive) return false;
    
    this.isPaused = !this.isPaused;
    
    if (this.logManager) {
      this.logManager.info(`Procesión ${this.isPaused ? 'pausada' : 'reanudada'}`);
    }
    
    // Notificar cambio de estado
    this.eventManager.emit('PROCESSION_PAUSE_CHANGED', {
      isPaused: this.isPaused,
      elapsedTime: this.elapsedTime
    });
    
    return this.isPaused;
  }
  
  /**
   * Finaliza la procesión correctamente
   */
  completeProcession() {
    if (!this.isActive) return;
    
    if (this.logManager) {
      this.logManager.info('Completando procesión', {
        elapsedTimeSeconds: Math.round(this.elapsedTime / 1000),
        elementsCount: this.elements.length
      });
    }
    
    // Detener bucle de movimiento
    if (this.movementLoop) {
      this.movementLoop.remove();
      this.movementLoop = null;
    }
    
    // Actualizar estado
    this.isActive = false;
    
    // Animación de finalización
    this.animateProcessionEnd();
    
    // Notificar finalización
    this.eventManager.emit('PROCESSION_COMPLETED', {
      brotherhood: this.brotherhood,
      elapsedTime: this.elapsedTime,
      elementsCount: this.elements.length
    });
  }
  
  /**
   * Anima la finalización de la procesión
   * @private
   */
  animateProcessionEnd() {
    // Efecto de desvanecimiento para todos los elementos
    this.elements.forEach((element, index) => {
      if (!element.sprite) return;
      
      // Desvanecer con retraso basado en posición
      this.scene.tweens.add({
        targets: element.sprite,
        alpha: 0,
        scale: element.scale * 0.8,
        delay: index * 100,
        duration: 1000,
        onComplete: () => {
          // Eliminar elemento cuando termine animación
          element.destroy();
          
          // Si es el último elemento, limpiar referencias
          if (index === this.elements.length - 1) {
            this.clearElements();
          }
        }
      });
    });
  }
  
  /**
   * Cancela la procesión antes de completarse
   */
  cancelProcession() {
    if (!this.isActive) return;
    
    if (this.logManager) {
      this.logManager.info('Cancelando procesión', {
        elapsedTimeSeconds: Math.round(this.elapsedTime / 1000)
      });
    }
    
    // Detener bucle de movimiento
    if (this.movementLoop) {
      this.movementLoop.remove();
      this.movementLoop = null;
    }
    
    // Actualizar estado
    this.isActive = false;
    
    // Limpiar elementos
    this.clearElements();
    
    // Notificar cancelación
    this.eventManager.emit('PROCESSION_CANCELLED', {
      brotherhood: this.brotherhood,
      elapsedTime: this.elapsedTime
    });
  }
  
  /**
   * Limpia todos los elementos de la procesión
   * @private
   */
  clearElements() {
    if (this.logManager) {
      this.logManager.debug('Limpiando elementos de procesión', {
        count: this.elements.length
      });
    }
    
    // Destruir todos los elementos
    this.elements.forEach(element => {
      if (element) element.destroy();
    });
    
    // Vaciar array
    this.elements = [];
    
    // Resetear contadores
    this.completedElements = 0;
  }
  
  /**
   * Verifica si la procesión está actualmente activa
   * @returns {boolean} - True si la procesión está activa
   */
  isProcessionActive() {
    return this.isActive;
  }
  
  /**
   * Destruye la instancia y libera recursos
   */
  destroy() {
    // Detener actualización
    if (this.movementLoop) {
      this.movementLoop.remove();
      this.movementLoop = null;
    }
    
    // Limpiar elementos
    this.clearElements();
    
    // Limpiar referencias
    this.route = [];
    this.brotherhood = null;
    
    if (this.logManager) {
      this.logManager.debug('ProcessionMovement destruido');
    }
  }
} 
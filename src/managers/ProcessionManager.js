/**
 * Gestor de procesiones
 * @class ProcessionManager
 */
export default class ProcessionManager {
  /**
   * Crea una instancia del gestor de procesiones
   * @param {Phaser.Scene} scene - La escena del juego
   * @param {RouteManager} routeManager - El gestor de rutas
   * @param {EventManager} eventManager - El gestor de eventos
   */
  constructor(scene, routeManager, eventManager) {
    this.scene = scene;
    this.routeManager = routeManager;
    this.eventManager = eventManager;
    
    // Estado de la procesión
    this.currentProcession = null;
    this.isProcessionActive = false;
    this.processionElements = [];
    this.processionStep = 0;
    this.processionSpeed = 100; // Velocidad base en ms por paso
    
    // Configuración de la procesión
    this.config = {
      nazarenoSpacing: 20, // Espacio entre nazarenos
      maxNazarenos: 50, // Máximo número de nazarenos
      stepDelay: 100, // Retraso entre pasos en ms
      pauseDelay: 2000, // Retraso en cada pausa en ms
      animationDuration: 500 // Duración de las animaciones en ms
    };
    
    // Obtener referencia al LogManager desde la escena
    this.logManager = this.scene.logManager;
    
    // Suscripción a eventos
    this.registerEvents();
    
    if (this.logManager) {
      this.logManager.debug('ProcessionManager inicializado');
    }
  }
  
  /**
   * Registra escuchas para eventos relevantes
   * @private
   */
  registerEvents() {
    this.eventManager.on('ROUTE_CREATED', this.onRouteCreated, this);
    this.eventManager.on('BROTHERHOOD_SELECTED', this.onBrotherhoodSelected, this);
  }
  
  /**
   * Manejador para cuando se crea una ruta
   * @param {Object} data - Datos del evento
   * @private
   */
  onRouteCreated(data) {
    if (data && data.route) {
      this.updateMenuOptions(true);
    }
  }
  
  /**
   * Manejador para cuando se selecciona una hermandad
   * @param {Object} data - Datos del evento
   * @private
   */
  onBrotherhoodSelected(data) {
    if (data && data.brotherhood) {
      // Actualizar opciones disponibles basadas en la hermandad seleccionada
      this.updateMenuOptions();
    }
  }
  
  /**
   * Actualiza las opciones del menú relacionadas con procesiones
   * @param {boolean} hasRoute - Indica si hay una ruta disponible
   */
  updateMenuOptions(hasRoute = false) {
    // Esta función será llamada desde fuera para actualizar UI
    this.eventManager.emit('UPDATE_PROCESSION_MENU', { 
      canStartProcession: hasRoute && !this.isProcessionActive,
      isProcessionActive: this.isProcessionActive
    });
  }
  
  /**
   * Inicia una nueva procesión
   * @param {Object} brotherhood - La hermandad que realiza la procesión
   * @param {Array|Object} route - La ruta de la procesión o un objeto con propiedad 'points'
   * @returns {boolean} - True si se inició correctamente
   */
  startProcession(brotherhood, route) {
    if (this.logManager) {
      this.logManager.info('Intentando iniciar procesión', { 
        brotherhood: brotherhood?.name, 
        routeType: typeof route,
        isArray: Array.isArray(route),
        hasPoints: route && typeof route === 'object' && 'points' in route
      });
    }
    
    if (this.isProcessionActive) {
      if (this.logManager) this.logManager.warning('Intento de iniciar procesión con otra ya activa');
      console.error('Ya hay una procesión en curso');
      return false;
    }
    
    // Normalizar la ruta: puede ser un array directo o un objeto con propiedad points
    let routePoints;
    if (Array.isArray(route)) {
      routePoints = route;
    } else if (route && typeof route === 'object' && Array.isArray(route.points)) {
      routePoints = route.points;
    } else {
      if (this.logManager) {
        this.logManager.error('Error al iniciar procesión: formato de ruta inválido', {
          hasBrotherhood: !!brotherhood,
          hasRoute: !!route,
          routeType: typeof route,
          routeValue: JSON.stringify(route).substring(0, 200) // Limitar longitud
        });
      }
      console.error('Se requiere una hermandad y una ruta válida para iniciar una procesión');
      return false;
    }
    
    // Validar que la ruta normalizada tiene suficientes puntos
    if (!brotherhood || !routePoints || routePoints.length < 3) {
      if (this.logManager) {
        this.logManager.error('Error al iniciar procesión: datos insuficientes', {
          hasBrotherhood: !!brotherhood,
          hasRoutePoints: !!routePoints,
          routePointsLength: routePoints?.length || 0
        });
      }
      console.error('Se requiere una hermandad y una ruta válida para iniciar una procesión');
      return false;
    }
    
    // Crear la procesión con la ruta normalizada
    this.currentProcession = {
      brotherhood: brotherhood,
      route: routePoints, // Usamos los puntos normalizados
      startTime: new Date(),
      elapsedTime: 0,
      currentStep: 0,
      paused: false,
      completed: false
    };
    
    if (this.logManager) {
      this.logManager.debug('Procesión inicializada con ruta normalizada', {
        routePoints: routePoints.length
      });
    }
    
    this.isProcessionActive = true;
    this.processionStep = 0;
    
    // Crear elementos visuales
    this.createProcessionElements(brotherhood, routePoints);
    
    // Iniciar el movimiento
    this.startProcessionMovement();
    
    // Notificar que la procesión ha comenzado
    this.eventManager.emit('PROCESSION_STARTED', {
      brotherhood: brotherhood,
      routeLength: routePoints.length
    });
    
    if (this.logManager) {
      this.logManager.info('Procesión iniciada correctamente', {
        brotherhood: brotherhood.name,
        routeLength: routePoints.length,
        elementCount: this.processionElements.length
      });
    }
    
    return true;
  }
  
  /**
   * Crea los elementos visuales de la procesión
   * @param {Object} brotherhood - La hermandad
   * @param {Array} route - La ruta (array de puntos)
   * @private
   */
  createProcessionElements(brotherhood, route) {
    if (this.logManager) {
      this.logManager.debug('Creando elementos visuales de la procesión', {
        brotherhood: brotherhood?.name,
        routePointsLength: Array.isArray(route) ? route.length : 'No es array'
      });
    }
    
    // Validación de parámetros
    if (!brotherhood) {
      if (this.logManager) {
        this.logManager.error('No se pueden crear elementos: falta hermandad');
      }
      return;
    }
    
    if (!Array.isArray(route) || route.length < 2) {
      if (this.logManager) {
        this.logManager.error('No se pueden crear elementos: ruta inválida', {
          routeType: typeof route,
          isArray: Array.isArray(route),
          length: Array.isArray(route) ? route.length : 'N/A'
        });
      }
      return;
    }
    
    // Limpiar elementos previos
    this.clearProcessionElements();
    
    // Calcular número de nazarenos basado en la popularidad
    const popularity = brotherhood.popularity || 10; // Valor por defecto
    const nazarenoCount = Math.min(
      Math.ceil(popularity / 2),
      this.config.maxNazarenos
    );
    
    // Punto inicial (sede)
    const startPoint = route[0];
    
    if (this.logManager) {
      this.logManager.debug('Punto inicial de procesión', {
        x: startPoint.x,
        y: startPoint.y,
        nazarenoCount: nazarenoCount
      });
    }
    
    // Crear grupo de la procesión
    this.processionGroup = this.scene.add.group();
    
    try {
      // Verificar que las texturas existen
      const requiredTextures = ['cruz_guia', 'nazareno', 'paso_misterio', 'paso_gloria'];
      const missingTextures = requiredTextures.filter(texture => !this.scene.textures.exists(texture));
      
      if (missingTextures.length > 0) {
        if (this.logManager) {
          this.logManager.warning('Faltan texturas para la procesión', {
            missingTextures
          });
        }
        
        // Intentar crear texturas de respaldo
        missingTextures.forEach(texture => {
          this.createFallbackTexture(texture);
        });
        
        // Verificar nuevamente
        const stillMissing = requiredTextures.filter(texture => !this.scene.textures.exists(texture));
        if (stillMissing.length > 0) {
          if (this.logManager) {
            this.logManager.error('No se pudieron crear texturas de respaldo', {
              stillMissing
            });
          }
          throw new Error(`Faltan texturas necesarias: ${stillMissing.join(', ')}`);
        }
      }
      
      // Crear la cruz de guía (primer elemento)
      const cruz = this.scene.add.sprite(startPoint.x, startPoint.y, 'cruz_guia')
        .setScale(0.5)
        .setDepth(10);
      this.processionGroup.add(cruz);
      this.processionElements.push({ 
        type: 'cruz', 
        sprite: cruz, 
        routeIndex: 0,
        progress: 0
      });
      
      if (this.logManager) {
        this.logManager.debug('Cruz de guía creada');
      }
      
      // Crear nazarenos
      for (let i = 0; i < nazarenoCount; i++) {
        const nazareno = this.scene.add.sprite(
          startPoint.x, 
          startPoint.y, 
          'nazareno'
        ).setScale(0.4)
         .setDepth(10);
        
        // Tinte según el color del hábito
        if (brotherhood.habitColor) {
          nazareno.setTint(brotherhood.habitColor);
        }
        
        this.processionGroup.add(nazareno);
        this.processionElements.push({ 
          type: 'nazareno', 
          sprite: nazareno, 
          routeIndex: 0,
          progress: 0
        });
      }
      
      if (this.logManager) {
        this.logManager.debug(`${nazarenoCount} nazarenos creados`);
      }
      
      // Crear el paso de misterio/palio
      const pasoTexture = brotherhood.type === 'gloria' ? 'paso_gloria' : 'paso_misterio';
      const paso = this.scene.add.sprite(
        startPoint.x, 
        startPoint.y, 
        pasoTexture
      ).setScale(0.7)
       .setDepth(11);
      
      this.processionGroup.add(paso);
      this.processionElements.push({ 
        type: 'paso', 
        sprite: paso, 
        routeIndex: 0,
        progress: 0
      });
      
      if (this.logManager) {
        this.logManager.debug('Paso creado', {
          type: brotherhood.type === 'gloria' ? 'gloria' : 'misterio',
          texture: pasoTexture
        });
      }
      
      // Distribuir los elementos a lo largo del primer tramo
      this.distributeProcessionElements();
      
      if (this.logManager) {
        this.logManager.info('Elementos de procesión creados correctamente', {
          totalElements: this.processionElements.length
        });
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al crear elementos de procesión', {
          error: error.message,
          stack: error.stack
        });
      }
      throw error; // Re-lanzar para que pueda ser manejado por el llamador
    }
  }
  
  /**
   * Crea una textura de respaldo para elementos de procesión
   * @param {string} textureKey - Clave de la textura a crear
   * @private
   */
  createFallbackTexture(textureKey) {
    if (this.logManager) {
      this.logManager.warning(`Creando textura de respaldo para ${textureKey}`);
    }
    
    const graphics = this.scene.add.graphics();
    
    try {
      switch (textureKey) {
        case 'cruz_guia':
          // Dibujar una cruz simple
          graphics.lineStyle(4, 0xFFD700);
          graphics.beginPath();
          graphics.moveTo(32, 8);
          graphics.lineTo(32, 56);
          graphics.moveTo(16, 20);
          graphics.lineTo(48, 20);
          graphics.strokePath();
          graphics.generateTexture('cruz_guia', 64, 64);
          break;
          
        case 'nazareno':
          // Dibujar un nazareno simple
          graphics.fillStyle(0x7E1E9C);
          // Capirote
          graphics.fillTriangle(16, 0, 32, 32, 48, 0);
          // Cuerpo
          graphics.fillRect(16, 32, 32, 32);
          graphics.generateTexture('nazareno', 64, 64);
          break;
          
        case 'paso_misterio':
          // Dibujar un paso de misterio simple
          graphics.fillStyle(0x8B0000);
          graphics.fillRect(8, 16, 112, 64);
          graphics.fillStyle(0xFFD700);
          graphics.fillRect(8, 8, 112, 8);
          graphics.fillRect(8, 80, 112, 8);
          graphics.lineStyle(2, 0xFFD700);
          graphics.strokeRect(8, 16, 112, 64);
          graphics.generateTexture('paso_misterio', 128, 96);
          break;
          
        case 'paso_gloria':
          // Dibujar un paso de gloria simple
          graphics.fillStyle(0x4682B4);
          graphics.fillRect(8, 16, 112, 64);
          graphics.fillStyle(0xFFD700);
          graphics.fillRect(8, 8, 112, 8);
          graphics.fillRect(8, 80, 112, 8);
          graphics.lineStyle(2, 0xFFD700);
          graphics.strokeRect(8, 16, 112, 64);
          graphics.generateTexture('paso_gloria', 128, 96);
          break;
      }
      
      if (this.logManager) {
        this.logManager.info(`Textura de respaldo creada para ${textureKey}`);
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error(`Error al crear textura de respaldo para ${textureKey}`, {
          error: error.message,
          stack: error.stack
        });
      }
    } finally {
      graphics.destroy();
    }
  }
  
  /**
   * Distribuye los elementos de la procesión a lo largo del primer tramo
   * @private
   */
  distributeProcessionElements() {
    if (!this.currentProcession || !this.processionElements.length) return;
    
    const route = this.currentProcession.route;
    if (route.length < 2) return;
    
    // Primer tramo (entre punto 0 y 1)
    const p0 = route[0];
    const p1 = route[1];
    
    // Calcular dirección del tramo
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / distance;
    const normY = dy / distance;
    
    // Distribuir elementos
    const elementCount = this.processionElements.length;
    const spacing = this.config.nazarenoSpacing;
    const totalLength = (elementCount - 1) * spacing;
    
    if (totalLength > distance) {
      // Si la procesión es más larga que el primer tramo, ajustar
      const ratio = distance / totalLength;
      spacing = spacing * ratio;
    }
    
    // Posicionar cada elemento
    this.processionElements.forEach((element, index) => {
      const offset = index * spacing;
      const x = p0.x + normX * offset;
      const y = p0.y + normY * offset;
      
      element.sprite.setPosition(x, y);
      element.routeIndex = 0;
      element.progress = offset / distance;
    });
  }
  
  /**
   * Inicia el movimiento de la procesión
   * @private
   */
  startProcessionMovement() {
    if (this.logManager) {
      this.logManager.debug('Iniciando movimiento de procesión');
    }
    
    if (!this.isProcessionActive || !this.currentProcession) {
      if (this.logManager) {
        this.logManager.warning('No se puede iniciar movimiento: no hay procesión activa');
      }
      return;
    }
    
    try {
      // Importar dinámicamente el gestor de movimiento
      import('../entities/ProcessionMovement.js').then((module) => {
        const ProcessionMovement = module.default;
        
        // Crear una instancia del gestor de movimiento
        this.processionMovement = new ProcessionMovement(
          this.scene, 
          this.eventManager,
          {
            nazarenoSpacing: this.config.nazarenoSpacing,
            stepDelay: this.config.stepDelay,
            pauseDelay: this.config.pauseDelay,
            baseSpeed: 1
          }
        );
        
        // Inicializar con la ruta y hermandad
        const initialized = this.processionMovement.initialize(
          this.currentProcession.route,
          this.currentProcession.brotherhood
        );
        
        if (initialized) {
          // Iniciar el movimiento
          this.processionMovement.startMovement();
          
          if (this.logManager) {
            this.logManager.info('Movimiento de procesión iniciado correctamente con ProcessionMovement');
          }
        } else {
          if (this.logManager) {
            this.logManager.error('Error al inicializar ProcessionMovement');
          }
          // En caso de error, usar el método antiguo como fallback
          this.startLegacyProcessionMovement();
        }
      }).catch(error => {
        if (this.logManager) {
          this.logManager.error('Error al importar ProcessionMovement', {
            error: error.message,
            stack: error.stack
          });
        }
        // En caso de error, usar el método antiguo como fallback
        this.startLegacyProcessionMovement();
      });
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al iniciar movimiento con ProcessionMovement', {
          error: error.message,
          stack: error.stack
        });
      }
      // Usar el método antiguo como fallback
      this.startLegacyProcessionMovement();
    }
  }
  
  /**
   * Método de respaldo para iniciar el movimiento de la procesión
   * usando la implementación original
   * @private
   */
  startLegacyProcessionMovement() {
    if (this.logManager) {
      this.logManager.warning('Usando método legacy para iniciar movimiento de procesión');
    }
    
    // Configurar el bucle de movimiento
    this.processionMovementLoop = this.scene.time.addEvent({
      delay: this.config.stepDelay,
      callback: this.updateProcessionPosition,
      callbackScope: this,
      loop: true
    });
    
    if (this.logManager) {
      this.logManager.info('Bucle de movimiento legacy iniciado', {
        delay: this.config.stepDelay
      });
    }
  }
  
  /**
   * Actualiza la posición de los elementos de la procesión
   * @private
   */
  updateProcessionPosition() {
    // Log cada 50 pasos para no saturar
    const shouldLog = this.processionStep % 50 === 0;
    
    if (shouldLog && this.logManager) {
      this.logManager.debug(`Actualizando posición paso ${this.processionStep}`, {
        isActive: this.isProcessionActive,
        isPaused: this.currentProcession?.paused
      });
    }
    
    if (!this.isProcessionActive || !this.currentProcession || this.currentProcession.paused) return;
    
    const route = this.currentProcession.route;
    if (!route || route.length < 2) {
      if (this.logManager) {
        this.logManager.warning('Ruta inválida para actualizar posición');
      }
      return;
    }
    
    // Incrementar el paso general de la procesión
    this.processionStep++;
    
    try {
      // Actualizar cada elemento
      this.processionElements.forEach((element, index) => {
        // Retardo basado en la posición en la procesión
        const delay = index * 0.1;
        const step = this.processionStep - Math.floor(delay * 100);
        if (step <= 0) return;
        
        // Calcular nueva posición
        const { x, y, routeIndex, progress, completed } = this.calculateElementPosition(
          element, step, this.processionSpeed
        );
        
        // Si todos los elementos han completado la ruta, finalizar
        if (completed && index === this.processionElements.length - 1) {
          if (this.logManager) {
            this.logManager.info('Último elemento completó la ruta, finalizando procesión');
          }
          this.completeProcession();
          return;
        }
        
        // Actualizar el sprite
        element.sprite.setPosition(x, y);
        element.routeIndex = routeIndex;
        element.progress = progress;
        
        // Animar pasos (solo nazarenos y pasos)
        if (['nazareno', 'paso'].includes(element.type)) {
          // Balanceo sutil
          const swayAmount = element.type === 'paso' ? 0.05 : 0.02;
          const sway = Math.sin(step / 10) * swayAmount;
          element.sprite.setScale(
            element.sprite.scaleX + sway,
            element.sprite.scaleY - sway
          );
        }
      });
      
      // Actualizar tiempo transcurrido
      this.currentProcession.elapsedTime += this.config.stepDelay;
      
      // Log de progreso periódico
      if (shouldLog && this.logManager) {
        const progress = this.calculateProcessionProgress();
        this.logManager.debug(`Progreso de procesión: ${Math.round(progress * 100)}%`, {
          elapsedTime: this.currentProcession.elapsedTime,
          elementCount: this.processionElements.length
        });
      }
      
      // Notificar progreso cada 30 segundos
      if (this.currentProcession.elapsedTime % 30000 < this.config.stepDelay) {
        const totalDistance = this.calculateRouteLength(route);
        const progress = this.calculateProcessionProgress();
        
        if (this.logManager) {
          this.logManager.info('Progreso de procesión', {
            progress: `${Math.round(progress * 100)}%`,
            elapsedTimeSeconds: Math.round(this.currentProcession.elapsedTime / 1000)
          });
        }
        
        this.eventManager.emit('PROCESSION_PROGRESS', {
          brotherhood: this.currentProcession.brotherhood,
          progress: progress,
          elapsedTime: this.currentProcession.elapsedTime
        });
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error en actualización de procesión', {
          paso: this.processionStep,
          error: error.message,
          stack: error.stack
        });
      }
    }
  }
  
  /**
   * Calcula la nueva posición de un elemento en la ruta
   * @param {Object} element - Elemento de la procesión
   * @param {number} step - Paso actual
   * @param {number} speed - Velocidad de movimiento
   * @returns {Object} - Nueva posición y estado
   * @private
   */
  calculateElementPosition(element, step, speed) {
    const route = this.currentProcession.route;
    let routeIndex = element.routeIndex;
    let progress = element.progress;
    
    // Avanzar en la ruta basado en el paso y velocidad
    const stepProgress = (step * 0.001) / speed;
    progress += stepProgress;
    
    // Log detallado solo para el primer y último elemento cada 100 pasos
    const isFirstOrLast = element.type === 'cruz' || element.type === 'paso';
    const shouldLogDetail = this.processionStep % 100 === 0 && isFirstOrLast;
    
    if (shouldLogDetail && this.logManager) {
      this.logManager.debug(`Posición de ${element.type}`, {
        routeIndex: routeIndex,
        progress: progress.toFixed(4),
        stepProgress: stepProgress.toFixed(6)
      });
    }
    
    // Si se completa el tramo actual, pasar al siguiente
    while (progress >= 1 && routeIndex < route.length - 2) {
      routeIndex++;
      progress -= 1;
      
      if (shouldLogDetail && this.logManager) {
        this.logManager.debug(`${element.type} avanza al segmento ${routeIndex}`);
      }
    }
    
    // Verificar si ha completado toda la ruta
    if (routeIndex >= route.length - 2 && progress >= 1) {
      if (shouldLogDetail && this.logManager) {
        this.logManager.debug(`${element.type} ha completado la ruta`);
      }
      
      // Colocar en el punto final
      return {
        x: route[route.length - 1].x,
        y: route[route.length - 1].y,
        routeIndex: route.length - 1,
        progress: 1,
        completed: true
      };
    }
    
    // Interpolar entre los puntos actual y siguiente
    const currentPoint = route[routeIndex];
    const nextPoint = route[routeIndex + 1];
    
    // Interpolación lineal
    const x = currentPoint.x + (nextPoint.x - currentPoint.x) * progress;
    const y = currentPoint.y + (nextPoint.y - currentPoint.y) * progress;
    
    return { x, y, routeIndex, progress, completed: false };
  }
  
  /**
   * Calcula el progreso general de la procesión
   * @returns {number} - Progreso de 0 a 1
   * @private
   */
  calculateProcessionProgress() {
    // Usar el gestor de movimiento si está disponible
    if (this.processionMovement) {
      return this.processionMovement.calculateProgress();
    }
    
    // Cálculo original
    if (!this.processionElements.length) return 0;
    
    // Contar elementos que han completado la ruta
    const completedElements = this.processionElements.filter(el => el.completed).length;
    
    // Calcular progreso del resto
    let totalProgress = completedElements;
    this.processionElements.forEach(element => {
      if (!element.completed) {
        const routeLength = this.currentProcession.route.length;
        totalProgress += (element.routeIndex / routeLength);
      }
    });
    
    return totalProgress / this.processionElements.length;
  }
  
  /**
   * Calcula la longitud total de la ruta
   * @param {Array} route - Ruta a calcular
   * @returns {number} - Longitud total
   * @private
   */
  calculateRouteLength(route) {
    if (!route || route.length < 2) return 0;
    
    let totalLength = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const dx = route[i+1].x - route[i].x;
      const dy = route[i+1].y - route[i].y;
      totalLength += Math.sqrt(dx*dx + dy*dy);
    }
    
    return totalLength;
  }
  
  /**
   * Pausa o reanuda la procesión
   * @returns {boolean} - Estado actual (true = pausado)
   */
  togglePauseProcession() {
    // Usar el gestor de movimiento si está disponible
    if (this.processionMovement) {
      return this.processionMovement.togglePause();
    }
    
    if (!this.isProcessionActive || !this.currentProcession) return false;
    
    this.currentProcession.paused = !this.currentProcession.paused;
    
    if (this.logManager) {
      this.logManager.info(`Procesión ${this.currentProcession.paused ? 'pausada' : 'reanudada'}`);
    }
    
    return this.currentProcession.paused;
  }
  
  /**
   * Finaliza la procesión correctamente
   */
  completeProcession() {
    // Usar el gestor de movimiento si está disponible
    if (this.processionMovement) {
      return this.processionMovement.completeProcession();
    }
    
    if (!this.isProcessionActive) return;
    
    if (this.logManager) {
      this.logManager.info('Completando procesión', {
        timeElapsed: this.currentProcession.elapsedTime,
        brotherhood: this.currentProcession.brotherhood.name
      });
    }
    
    // Detener bucle de movimiento
    if (this.processionMovementLoop) {
      this.processionMovementLoop.remove();
      this.processionMovementLoop = null;
    }
    
    // Marcar como completada
    this.currentProcession.completed = true;
    this.isProcessionActive = false;
    
    // Animar finalización
    this.animateProcessionEnd();
    
    // Emitir evento
    this.eventManager.emit('PROCESSION_COMPLETED', {
      brotherhood: this.currentProcession.brotherhood,
      elapsedTime: this.currentProcession.elapsedTime
    });
  }
  
  /**
   * Anima el final de la procesión con efectos visuales
   * @private
   */
  animateProcessionEnd() {
    // Usar el gestor de movimiento si está disponible
    if (this.processionMovement) {
      return;
    }
    
    if (this.logManager) {
      this.logManager.debug('Animando finalización de procesión');
    }
    
    // Animar cada elemento
    this.processionElements.forEach((element, index) => {
      if (!element.sprite) return;
      
      // Desvanecer con retraso basado en posición
      this.scene.tweens.add({
        targets: element.sprite,
        alpha: 0,
        scale: element.sprite.scale * 0.8,
        delay: index * 100,
        duration: 1000,
        onComplete: () => {
          if (element.sprite) element.sprite.destroy();
          
          // Si es el último elemento, limpiar todo
          if (index === this.processionElements.length - 1) {
            this.clearProcessionElements();
          }
        }
      });
    });
  }
  
  /**
   * Cancela la procesión activa
   * @returns {boolean} - True si se canceló correctamente
   */
  cancelProcession() {
    // Usar el gestor de movimiento si está disponible
    if (this.processionMovement) {
      this.processionMovement.cancelProcession();
      this.currentProcession = null;
      this.isProcessionActive = false;
      this.updateMenuOptions();
      return true;
    }
    
    if (!this.isProcessionActive || !this.currentProcession) {
      if (this.logManager) {
        this.logManager.warning('Intento de cancelar procesión cuando no hay ninguna activa');
      }
      return false;
    }
    
    if (this.logManager) {
      this.logManager.info('Cancelando procesión', {
        brotherhood: this.currentProcession.brotherhood.name,
        timeElapsed: this.currentProcession.elapsedTime
      });
    }
    
    // Detener bucle de movimiento
    if (this.processionMovementLoop) {
      this.processionMovementLoop.remove();
      this.processionMovementLoop = null;
    }
    
    // Actualizar estado
    this.isProcessionActive = false;
    
    // Limpiar elementos
    this.clearProcessionElements();
    
    // Notificar cancelación
    this.eventManager.emit('PROCESSION_CANCELLED', {
      brotherhood: this.currentProcession.brotherhood
    });
    
    // Actualizar UI
    this.updateMenuOptions();
    
    this.currentProcession = null;
    
    return true;
  }
  
  /**
   * Limpia todos los elementos visuales de la procesión
   * @private
   */
  clearProcessionElements() {
    // Si estamos usando el nuevo sistema de movimiento, delegar la limpieza
    if (this.processionMovement) {
      this.processionMovement.clearElements();
      this.processionMovement = null;
      return;
    }
    
    if (this.logManager) {
      this.logManager.debug('Limpiando elementos de procesión', {
        elementCount: this.processionElements.length
      });
    }
    
    // Destruir cada elemento
    this.processionElements.forEach(element => {
      if (element.sprite) {
        element.sprite.destroy();
      }
    });
    
    // Vaciar array
    this.processionElements = [];
  }
  
  /**
   * Destruye el gestor y libera recursos
   */
  destroy() {
    // Cancelar cualquier procesión activa
    if (this.isProcessionActive) {
      this.cancelProcession();
    }
    
    // Limpiar el gestor de movimiento si existe
    if (this.processionMovement) {
      this.processionMovement.destroy();
      this.processionMovement = null;
    }
    
    // Limpiar eventos
    this.eventManager.off('ROUTE_CREATED', this.onRouteCreated, this);
    this.eventManager.off('BROTHERHOOD_SELECTED', this.onBrotherhoodSelected, this);
    
    // Limpiar referencias
    this.scene = null;
    this.routeManager = null;
    this.eventManager = null;
    this.logManager = null;
  }
} 
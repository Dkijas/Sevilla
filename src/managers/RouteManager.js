/**
 * Gestor de rutas para las procesiones
 * @class RouteManager
 */
export default class RouteManager {
  /**
   * Crea una instancia del gestor de rutas
   * @param {Phaser.Scene} scene - La escena del juego
   * @param {EventManager} eventManager - El gestor de eventos
   */
  constructor(scene, eventManager) {
    this.scene = scene;
    this.eventManager = eventManager;
    
    // Estado de la creación de rutas
    this.isCreatingRoute = false;
    this.routePoints = [];
    this.routeGraphics = null;
    this.currentBrotherhood = null;
    
    // Configuración de ruta
    this.routeConfig = {
      lineColor: 0x4a7c59,
      lineWidth: 3,
      pointRadius: 8,
      minPoints: 3, // Mínimo de puntos necesarios para una ruta válida
      maxDistance: 500, // Distancia máxima entre puntos
      headquartersProximityRadius: 50, // Radio de proximidad para considerar un clic cerca de la sede
      headquartersPointColor: 0x00ff00, // Color del punto de sede
      pointColor: 0xff8800, // Color del resto de los puntos
      pointSize: 8, // Tamaño del punto
      showPointNumbers: true, // Mostrar números de puntos
      textDepth: 20, // Profundidad del texto de puntos
      lineAlpha: 1, // Opacidad de la línea
      guideLineColor: 0xffff00, // Color de la línea guía
      guideLineAlpha: 0.7 // Opacidad de la línea guía
    };
    
    // Obtener referencia al LogManager
    this.logManager = this.scene.logManager;
    
    // Inicializar gráficos
    this.initGraphics();
    
    if (this.logManager) {
      this.logManager.debug('RouteManager inicializado');
    }
  }
  
  /**
   * Inicializa los objetos gráficos para dibujar las rutas
   * @private
   */
  initGraphics() {
    try {
      // Si ya existe, destruirlo primero para evitar duplicados o referencias perdidas
      if (this.routeGraphics && !this.routeGraphics.destroyed) {
        this.routeGraphics.clear();
      } else {
        this.routeGraphics = this.scene.add.graphics();
      }
      
      // Verificar que se creó correctamente
      if (this.logManager && this.routeGraphics) {
        this.logManager.debug('Gráficos de ruta inicializados correctamente');
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al inicializar gráficos de ruta', {
          error: error.message,
          stack: error.stack
        });
      }
      // Intentar crear nuevamente como último recurso
      this.routeGraphics = this.scene.add.graphics();
    }
  }
  
  /**
   * Inicia el proceso de creación de una ruta
   * @param {Object} brotherhood - La hermandad para la que se crea la ruta
   * @returns {boolean} - True si se inició correctamente
   */
  startRouteCreation(brotherhood) {
    try {
      if (this.logManager) {
        this.logManager.info('Iniciando creación de ruta', {
          brotherhood: brotherhood ? brotherhood.name : 'ninguna',
          isAlreadyCreating: this.isCreatingRoute,
          existingPoints: this.routePoints.length
        });
      }
      
      // Verificar que existe una hermandad
      if (!brotherhood) {
        const errorMsg = 'No se puede crear una ruta sin una hermandad';
        if (this.logManager) {
          this.logManager.error(errorMsg);
        }
        this.eventManager.emit('ERROR', { message: errorMsg });
        return false;
      }
      
      // Verificar que la hermandad tiene sede
      if (!brotherhood.headquarters) {
        const errorMsg = 'La hermandad no tiene sede asignada. No se puede crear la ruta.';
        if (this.logManager) {
          this.logManager.error(errorMsg, {
            brotherhood: brotherhood.name
          });
        }
        this.eventManager.emit('ERROR', { message: errorMsg });
        return false;
      }
      
      // Si ya estamos creando una ruta, limpiarla primero
      if (this.isCreatingRoute) {
        if (this.logManager) {
          this.logManager.warning('Ya hay una creación de ruta activa. Cancelando la anterior.');
        }
        this.cancelRouteCreation();
      }
      
      // Guardar referencia a la hermandad
      this.currentBrotherhood = brotherhood;
      
      // Inicializar array de puntos de ruta y gráficos
      this.routePoints = [];
      this.initGraphics();
      
      // Actualizar estado y UI
      this.isCreatingRoute = true;
      this.updateRouteInfoPanel();
      
      // Mostrar indicador de sede (punto de inicio/fin)
      this.highlightHeadquarters();
      
      // Verificar que todo se ha inicializado correctamente
      if (this.logManager) {
        this.logManager.debug('Estado tras iniciar creación de ruta', {
          isCreatingRoute: this.isCreatingRoute,
          brotherhood: this.currentBrotherhood.name,
          graphicsInitialized: !!this.routeGraphics && !this.routeGraphics.destroyed,
          headquartersHighlighted: !!this.headquartersHighlight && !this.headquartersHighlight.destroyed
        });
      }
      
      // Emitir evento de inicio de creación
      this.eventManager.emit('ROUTE_CREATION_STARTED', { brotherhood: this.currentBrotherhood });
      
      return true;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al iniciar creación de ruta', {
          error: error.message,
          stack: error.stack
        });
      }
      this.eventManager.emit('ERROR', { message: 'Error al iniciar creación de ruta: ' + error.message });
      return false;
    }
  }
  
  /**
   * Crea elementos gráficos de ayuda para la creación de rutas
   * @private
   * @returns {boolean} - True si se crearon correctamente los elementos
   */
  createRouteHelperGraphics() {
    try {
      // Verificar que tenemos referencias válidas
      if (!this.scene || !this.currentBrotherhood || !this.currentBrotherhood.headquarters) {
        if (this.logManager) {
          this.logManager.warning('No se pueden crear gráficos de ayuda: faltan referencias', {
            hasScene: !!this.scene,
            hasBrotherhood: !!this.currentBrotherhood,
            hasHeadquarters: !!(this.currentBrotherhood?.headquarters)
          });
        }
        return false;
      }
      
      // Obtener la posición de la sede
      const hq = this.currentBrotherhood.headquarters;
      
      // Limpiar elementos previos primero
      this.removeRouteHelperGraphics();
      
      // Círculo pulsante alrededor de la sede
      const pulseCircle = this.scene.add.circle(hq.x, hq.y, 25, 0x00ff00, 0.6)
        .setName('route_helper_pulse')
        .setDepth(100);
      
      // Verificar que el círculo se creó correctamente
      if (!pulseCircle) {
        if (this.logManager) {
          this.logManager.warning('No se pudo crear el círculo pulsante');
        }
        return false;
      }
      
      // Añadir animación pulsante
      try {
        this.scene.tweens.add({
          targets: pulseCircle,
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 0.6, to: 0 },
          duration: 1500,
          repeat: -1
        });
      } catch (tweenError) {
        if (this.logManager) {
          this.logManager.warning('Error al crear animación pulsante', {
            error: tweenError.message
          });
        }
        // Seguir adelante incluso sin la animación
      }
      
      // Texto indicador
      try {
        const helperText = this.scene.add.text(hq.x, hq.y - 40, 'Comienza aquí', {
          font: 'bold 14px Arial',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 6, y: 4 }
        }).setOrigin(0.5)
          .setName('route_helper_text')
          .setDepth(100);
          
        if (this.logManager) {
          this.logManager.debug('Elementos gráficos de ayuda creados correctamente', {
            sede: `(${hq.x}, ${hq.y})`,
            textCreated: !!helperText
          });
        }
      } catch (textError) {
        if (this.logManager) {
          this.logManager.warning('Error al crear texto de ayuda', {
            error: textError.message
          });
        }
        // Seguir adelante incluso sin el texto
      }
      
      return true;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al crear elementos gráficos de ayuda', {
          error: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }
  
  /**
   * Crea un panel informativo sobre la creación de ruta
   * @private
   */
  createRouteInfoPanel() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Panel de fondo
    const panel = this.scene.add.rectangle(
      width - 150,
      height - 100,
      280,
      180,
      0x000000,
      0.8
    ).setScrollFactor(0)
     .setOrigin(1, 1)
     .setStrokeStyle(2, 0xffffff)
     .setName('route_info_panel')
     .setData('isUI', true);
    
    // Título
    const title = this.scene.add.text(
      width - 290,
      height - 180,
      'CREANDO ITINERARIO',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff'
      }
    ).setScrollFactor(0)
     .setName('route_info_title')
     .setData('isUI', true);
    
    // Info de hermandad
    const brotherhoodInfo = this.scene.add.text(
      width - 290,
      height - 155,
      `Hermandad: ${this.currentBrotherhood.name}`,
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setScrollFactor(0)
     .setName('route_info_brotherhood')
     .setData('isUI', true);
    
    // Contador de puntos
    this.routePointsCounter = this.scene.add.text(
      width - 290,
      height - 130,
      'Puntos: 0',
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setScrollFactor(0)
     .setName('route_info_points')
     .setData('isUI', true);
    
    // Estado de la ruta
    this.routeStatusText = this.scene.add.text(
      width - 290,
      height - 105,
      'Estado: Incompleta',
      {
        font: '14px Arial',
        fill: '#ff9999'
      }
    ).setScrollFactor(0)
     .setName('route_info_status')
     .setData('isUI', true);
    
    // Instrucciones
    this.scene.add.text(
      width - 290,
      height - 70,
      'ESC: Cancelar\nCTRL+Z: Eliminar último punto\nENTER: Finalizar',
      {
        font: '12px Arial',
        fill: '#ffffff',
        lineSpacing: 5
      }
    ).setScrollFactor(0)
     .setName('route_info_help')
     .setData('isUI', true);
  }
  
  /**
   * Actualiza el panel de información de la ruta
   * @private
   */
  updateRouteInfoPanel() {
    if (!this.routePointsCounter || !this.routeStatusText) return;
    
    // Actualizar contador de puntos
    this.routePointsCounter.setText(`Puntos: ${this.routePoints.length}`);
    
    // Actualizar estado
    if (this.routePoints.length < this.routeConfig.minPoints) {
      this.routeStatusText.setText('Estado: Incompleta');
      this.routeStatusText.setFill('#ff9999');
    } else {
      this.routeStatusText.setText('Estado: Lista para finalizar');
      this.routeStatusText.setFill('#99ff99');
    }
  }
  
  /**
   * Elimina el panel de información de la ruta
   * @private
   */
  removeRouteInfoPanel() {
    const panelElements = [
      'route_info_panel',
      'route_info_title',
      'route_info_brotherhood',
      'route_info_points',
      'route_info_status',
      'route_info_help'
    ];
    
    panelElements.forEach(name => {
      const element = this.scene.children.getByName(name);
      if (element) element.destroy();
    });
    
    this.routePointsCounter = null;
    this.routeStatusText = null;
  }
  
  /**
   * Elimina los elementos gráficos de ayuda
   * @private
   */
  removeRouteHelperGraphics() {
    const pulseCircle = this.scene.children.getByName('route_helper_pulse');
    const helperText = this.scene.children.getByName('route_helper_text');
    
    if (pulseCircle) pulseCircle.destroy();
    if (helperText) helperText.destroy();
  }
  
  /**
   * Maneja el clic en el mapa para añadir un punto a la ruta
   * @param {number} x - Coordenada X del mundo
   * @param {number} y - Coordenada Y del mundo
   * @returns {boolean} - True si el clic fue procesado, false en caso contrario
   */
  handleRouteClick(x, y) {
    // Añadir logs detallados para depuración
    if (this.logManager) {
      this.logManager.debug('handleRouteClick llamado', { 
        x, 
        y, 
        isCreatingRoute: this.isCreatingRoute,
        routePointsLength: this.routePoints.length,
        hasBrotherhood: !!this.currentBrotherhood,
        hasHeadquarters: !!(this.currentBrotherhood?.headquarters)
      });
    }
    
    try {
      // Verificar que estamos en modo de creación de ruta
      if (!this.isCreatingRoute) {
        if (this.logManager) {
          this.logManager.warning('Intento de añadir punto cuando no estamos en modo de creación de ruta');
        }
        return false;
      }
      
      // Obtener posición de la sede
      const headquarters = this.currentBrotherhood?.headquarters;
      if (!headquarters) {
        if (this.logManager) {
          this.logManager.error('No se puede añadir punto: sede no definida');
        }
        return false;
      }
      
      // Verificar si el clic está cerca de la sede
      const isNearHeadquarters = this.isClickNearHeadquarters(x, y);
      
      // Si tenemos al menos 2 puntos y estamos cerca de la sede, sugerir finalizar la ruta
      if (isNearHeadquarters && this.routePoints.length >= 2) {
        // Emitir evento de sugerencia para finalizar ruta
        if (this.eventManager) {
          this.logManager.info('Sugiriendo finalizar ruta (clic cerca de sede)', {
            pointCount: this.routePoints.length
          });
          this.eventManager.emit('ROUTE_FINISH_SUGGESTED', { 
            pointCount: this.routePoints.length 
          });
        }
        return true;
      }
      
      // Si es el primer clic, añadir sede y el punto clicado en la misma acción
      if (this.routePoints.length === 0) {
        if (this.logManager) {
          this.logManager.debug('Primer clic: añadiendo sede y punto clicado', { 
            hqX: headquarters.x, 
            hqY: headquarters.y,
            clickX: x,
            clickY: y
          });
        }
        // Añadir sede como primer punto
        this.routePoints.push({ x: headquarters.x, y: headquarters.y });
        // Añadir el punto clicado como segundo punto
        this.routePoints.push({ x, y });

        // Notificar eventos para ambos puntos
        if (this.eventManager) {
          this.eventManager.emit('ROUTE_POINT_ADDED', { pointIndex: 0, point: { x: headquarters.x, y: headquarters.y }, totalPoints: this.routePoints.length });
          this.eventManager.emit('ROUTE_POINT_ADDED', { pointIndex: 1, point: { x, y }, totalPoints: this.routePoints.length });
        }

        // Actualizar visualización y panel
        this.updateRouteDisplay();
        this.updateRouteInfoPanel();
        return true;
      }
      
      // Añadir el punto en la posición del clic
      if (this.logManager) {
        this.logManager.debug('Añadiendo punto a la ruta', { 
          x, 
          y, 
          pointIndex: this.routePoints.length 
        });
      }
      
      this.routePoints.push({ x, y });
      
      // Actualizar contador de puntos en la interfaz y emitir evento
      if (this.eventManager) {
        this.eventManager.emit('ROUTE_POINT_ADDED', { 
          pointIndex: this.routePoints.length - 1,
          point: { x, y },
          totalPoints: this.routePoints.length
        });
      }
      
      // Actualizar visualización
      this.updateRouteDisplay();
      // Actualizar panel informativo
      this.updateRouteInfoPanel();
      
      return true;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error en handleRouteClick', {
          error: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }
  
  /**
   * Comprueba si un clic está cerca de la sede
   * @param {number} x - Coordenada X del mundo
   * @param {number} y - Coordenada Y del mundo
   * @returns {boolean} - true si el clic está cerca de la sede
   */
  isClickNearHeadquarters(x, y) {
    try {
      if (!this.currentBrotherhood || !this.currentBrotherhood.headquarters) {
        if (this.logManager) {
          this.logManager.warning('No hay hermandad o sede definida para comprobar proximidad');
        }
        return false;
      }
      
      const headquarters = this.currentBrotherhood.headquarters;
      
      // Calcular distancia entre el clic y la sede
      const dx = x - headquarters.x;
      const dy = y - headquarters.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Comprobar si está dentro del radio de proximidad
      const isNear = distance <= this.routeConfig.headquartersProximityRadius;
      
      if (this.logManager) {
        this.logManager.debug('Comprobación de proximidad a sede', {
          clickPosition: { x, y },
          headquartersPosition: { x: headquarters.x, y: headquarters.y },
          distance: distance,
          proximityRadius: this.routeConfig.headquartersProximityRadius,
          isNear: isNear
        });
      }
      
      return isNear;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al comprobar proximidad a sede', {
          error: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }
  
  /**
   * Actualiza la visualización gráfica de la ruta en el mapa
   */
  updateRouteDisplay() {
    try {
      // Limpiar gráficos existentes
      if (this.routeGraphics) {
        this.routeGraphics.clear();
      } else {
        // Inicializar gráficos si no existen
        this.initGraphics();
      }
      
      if (this.routePoints.length === 0) {
        if (this.logManager) {
          this.logManager.debug('No hay puntos para dibujar la ruta');
        }
        return;
      }
      
      // Dibujar líneas entre puntos
      if (this.routePoints.length > 1) {
        // Configurar estilo para la línea de la ruta
        this.routeGraphics.lineStyle(
          this.routeConfig.lineWidth, 
          this.routeConfig.lineColor, 
          this.routeConfig.lineAlpha
        );
        
        // Comenzar a dibujar desde el primer punto
        this.routeGraphics.moveTo(this.routePoints[0].x, this.routePoints[0].y);
        
        // Dibujar línea conectando todos los puntos
        for (let i = 1; i < this.routePoints.length; i++) {
          this.routeGraphics.lineTo(this.routePoints[i].x, this.routePoints[i].y);
        }
        
        // Dibujar línea punteada hasta la posición del puntero si estamos en modo de creación
        if (this.isCreatingRoute && this.scene.input.activePointer && this.routePoints.length > 0) {
          const lastPoint = this.routePoints[this.routePoints.length - 1];
          const pointer = this.scene.input.activePointer;
          const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          
          // Estilo para línea punteada guía
          this.routeGraphics.lineStyle(
            this.routeConfig.lineWidth / 2, 
            this.routeConfig.guideLineColor, 
            this.routeConfig.guideLineAlpha
          );
          this.routeGraphics.lineTo(worldPoint.x, worldPoint.y);
        }
      }
      
      // Dibujar puntos
      for (let i = 0; i < this.routePoints.length; i++) {
        const point = this.routePoints[i];
        // Estilo especial para el primer y último punto (sede)
        const isHeadquarters = (i === 0 || (i === this.routePoints.length - 1 && 
            this.isClickNearHeadquarters(point.x, point.y)));
        
        // Configurar estilo para los puntos
        const fillColor = isHeadquarters ? 
          this.routeConfig.headquartersPointColor : 
          this.routeConfig.pointColor;
        
        const pointSize = isHeadquarters ? 
          this.routeConfig.headquartersPointSize : 
          this.routeConfig.pointSize;
          
        // Dibujar el punto
        this.routeGraphics.fillStyle(fillColor, 1);
        this.routeGraphics.fillCircle(point.x, point.y, pointSize);
        
        // Añadir número de secuencia al punto
        if (this.routeConfig.showPointNumbers) {
          this.scene.add.text(
            point.x, 
            point.y, 
            `${i}`, 
            { 
              font: '12px Arial', 
              fill: '#FFFFFF',
              stroke: '#000000',
              strokeThickness: 2
            }
          ).setOrigin(0.5, 0.5)
           .setDepth(this.routeConfig.textDepth)
           .setName(`route_point_text_${i}`);
        }
      }
      
      if (this.logManager) {
        this.logManager.debug('Ruta actualizada gráficamente', {
          numPoints: this.routePoints.length
        });
      }
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al actualizar visualización de ruta', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }
  
  /**
   * Finaliza la creación de la ruta
   * @returns {Object|null} - La ruta creada o null si no es válida
   */
  finishRouteCreation() {
    if (this.logManager) {
      this.logManager.info('Intentando finalizar la creación de ruta', {
        isCreatingRoute: this.isCreatingRoute,
        brotherhood: this.currentBrotherhood?.name,
        pointCount: this.routePoints.length
      });
    }
    
    if (!this.isCreatingRoute || !this.currentBrotherhood) {
      if (this.logManager) {
        this.logManager.warning('No se puede finalizar la ruta: no hay ruta en creación activa');
      }
      return null;
    }
    
    // Verificar que hay suficientes puntos
    if (this.routePoints.length < this.routeConfig.minPoints) {
      if (this.logManager) {
        this.logManager.warning('No se puede finalizar la ruta: puntos insuficientes', {
          actual: this.routePoints.length,
          requerido: this.routeConfig.minPoints
        });
      }
      
      this.eventManager.emit('ROUTE_CREATION_ERROR', { 
        message: `Se necesitan al menos ${this.routeConfig.minPoints} puntos para crear una ruta válida.`
      });
      
      // Mostrar mensaje de error al usuario
      if (this.scene.showMessage) {
        this.scene.showMessage(`Se necesitan al menos ${this.routeConfig.minPoints} puntos para crear una ruta válida.`);
      }
      
      return null;
    }
    
    // Eliminar gráficos de ayuda
    this.removeRouteHelperGraphics();
    
    // Eliminar panel informativo
    this.removeRouteInfoPanel();
    
    // Asegurarse de que la ruta comienza y termina en la sede
    const headquarters = this.currentBrotherhood.headquarters;
    const firstPoint = this.routePoints[0];
    
    // Log información de la sede y primer punto
    if (this.logManager) {
      this.logManager.debug('Verificando puntos de inicio/fin de ruta', {
        headquarters: `(${headquarters.x}, ${headquarters.y})`,
        firstPoint: `(${firstPoint.x}, ${firstPoint.y})`,
        lastPoint: `(${this.routePoints[this.routePoints.length-1].x}, ${this.routePoints[this.routePoints.length-1].y})`
      });
    }
    
    // Cerrar la ruta si no comienza en la sede
    if (Phaser.Math.Distance.Between(firstPoint.x, firstPoint.y, headquarters.x, headquarters.y) > 50) {
      // Añadir la sede al principio
      this.routePoints.unshift({ x: headquarters.x, y: headquarters.y });
      
      if (this.logManager) {
        this.logManager.debug('Añadiendo sede al inicio de la ruta');
      }
    }
    
    // Si la ruta no termina en la sede, añadirla al final
    const lastPoint = this.routePoints[this.routePoints.length - 1];
    if (Phaser.Math.Distance.Between(lastPoint.x, lastPoint.y, headquarters.x, headquarters.y) > 50) {
      this.routePoints.push({ x: headquarters.x, y: headquarters.y });
      
      if (this.logManager) {
        this.logManager.debug('Añadiendo sede al final de la ruta');
      }
    }
    
    // Crear el objeto de ruta final
    const route = {
      id: `route_${Date.now()}`,
      brotherhood: this.currentBrotherhood.id,
      points: [...this.routePoints],
      created: new Date().toISOString()
    };
    
    if (this.logManager) {
      this.logManager.info('Ruta creada correctamente', {
        id: route.id,
        brotherhood: this.currentBrotherhood.name,
        pointCount: route.points.length
      });
      
      // Loguear todos los puntos de la ruta para depuración
      route.points.forEach((point, index) => {
        this.logManager.debug(`Punto ${index + 1} de la ruta`, {
          x: point.x,
          y: point.y
        });
      });
    }
    
    // Limpiar los textos de numeración
    this.routePoints.forEach((point, index) => {
      const existingText = this.scene.children.getByName(`routePoint_${index}`);
      if (existingText) existingText.destroy();
    });
    
    // Dibujar la ruta final
    this.routeGraphics.clear();
    this.routeGraphics.lineStyle(4, 0x00aaff, 0.8);
    this.routeGraphics.moveTo(this.routePoints[0].x, this.routePoints[0].y);
    
    for (let i = 1; i < this.routePoints.length; i++) {
      this.routeGraphics.lineTo(this.routePoints[i].x, this.routePoints[i].y);
    }
    
    // Marcar sede al inicio y final
    this.routeGraphics.fillStyle(0x00ff00, 1);
    this.routeGraphics.fillCircle(this.routePoints[0].x, this.routePoints[0].y, 10);
    this.routeGraphics.fillStyle(0xff0000, 1);
    this.routeGraphics.fillCircle(this.routePoints[this.routePoints.length - 1].x, this.routePoints[this.routePoints.length - 1].y, 10);
    
    // Resetear el estado de creación
    this.isCreatingRoute = false;
    
    // Emitir evento de ruta creada
    this.eventManager.emit('ROUTE_CREATED', { route });
    
    // Vaciar el array de puntos (pero conservamos la visualización)
    this.routePoints = [];
    
    return route;
  }
  
  /**
   * Cancela la creación de la ruta actual
   */
  cancelRouteCreation() {
    if (!this.isCreatingRoute) return;
    
    // Eliminar gráficos de ayuda
    this.removeRouteHelperGraphics();
    
    // Eliminar panel informativo
    this.removeRouteInfoPanel();
    
    // Limpiamos los textos de numeración primero
    if (this.routePoints.length > 0) {
      this.routePoints.forEach((point, index) => {
        const existingText = this.scene.children.getByName(`routePoint_${index}`);
        if (existingText) existingText.destroy();
      });
    }
    
    this.isCreatingRoute = false;
    this.routePoints = [];
    this.routeGraphics.clear();
    
    // Emitir evento de creación cancelada
    this.eventManager.emit('ROUTE_CREATION_CANCELLED');
    
    // Mostrar mensaje al usuario
    if (this.scene.showMessage) {
      this.scene.showMessage('Creación de itinerario cancelada');
    }
  }
  
  /**
   * Elimina el último punto añadido a la ruta
   * @returns {Object|null} - El punto eliminado o null si no hay puntos
   */
  removeLastPoint() {
    if (!this.isCreatingRoute || this.routePoints.length === 0) {
      return null;
    }
    
    // Eliminar el texto de numeración del último punto
    const lastIndex = this.routePoints.length - 1;
    const existingText = this.scene.children.getByName(`routePoint_${lastIndex}`);
    if (existingText) existingText.destroy();
    
    const removedPoint = this.routePoints.pop();
    this.updateRouteDisplay();
    
    // Actualizar panel informativo
    this.updateRouteInfoPanel();
    
    // Emitir evento de punto eliminado
    this.eventManager.emit('ROUTE_POINT_REMOVED', { 
      point: removedPoint, 
      remainingPoints: this.routePoints.length 
    });
    
    // Mostrar mensaje al usuario
    if (this.scene.showMessage) {
      this.scene.showMessage('Punto eliminado del itinerario');
    }
    
    return removedPoint;
  }
  
  /**
   * Dibuja una ruta existente en el mapa
   * @param {Object} route - La ruta a dibujar
   * @param {number} color - Color de la línea (hexadecimal)
   * @param {number} width - Ancho de la línea
   * @returns {Phaser.GameObjects.Graphics} - El objeto gráfico creado
   */
  drawExistingRoute(route, color = 0x4a7c59, width = 3) {
    if (this.logManager) {
      this.logManager.debug('Dibujando ruta existente', {
        routeID: route?.id,
        pointCount: route?.points?.length,
        color: color,
        width: width
      });
    }
    
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(width, color);
    
    if (route.points && route.points.length > 1) {
      try {
        // Mover al primer punto
        graphics.moveTo(route.points[0].x, route.points[0].y);
        
        // Dibujar líneas a cada punto subsiguiente
        for (let i = 1; i < route.points.length; i++) {
          graphics.lineTo(route.points[i].x, route.points[i].y);
        }
        
        // Marcar inicio y fin
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillCircle(route.points[0].x, route.points[0].y, 8);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(route.points[route.points.length - 1].x, route.points[route.points.length - 1].y, 8);
        
        if (this.logManager) {
          this.logManager.debug('Ruta dibujada correctamente');
        }
      } catch (error) {
        if (this.logManager) {
          this.logManager.error('Error al dibujar ruta', {
            error: error.message,
            stack: error.stack
          });
        }
      }
    } else {
      if (this.logManager) {
        this.logManager.warning('No se puede dibujar la ruta: puntos insuficientes');
      }
    }
    
    return graphics;
  }
  
  /**
   * Verifica si hay una ruta en creación actualmente
   * @returns {boolean} - True si está creando una ruta
   */
  isCreatingRouteActive() {
    return this.isCreatingRoute;
  }
  
  /**
   * Limpia todos los recursos gráficos
   */
  clear() {
    if (this.routeGraphics) {
      this.routeGraphics.clear();
    }
    
    // Limpiar textos de numeración de puntos
    if (this.routePoints.length > 0) {
      this.routePoints.forEach((point, index) => {
        const existingText = this.scene.children.getByName(`routePoint_${index}`);
        if (existingText) existingText.destroy();
      });
    }
    
    this.isCreatingRoute = false;
    this.routePoints = [];
    this.currentBrotherhood = null;
  }
  
  /**
   * Destruye el gestor de rutas y libera recursos
   */
  destroy() {
    this.clear();
    
    if (this.routeGraphics) {
      this.routeGraphics.destroy();
      this.routeGraphics = null;
    }
  }
  
  /**
   * Muestra una línea guía desde el último punto hasta la posición actual del ratón
   * @param {number} x - Coordenada X actual del ratón
   * @param {number} y - Coordenada Y actual del ratón
   */
  showRouteGuideLine(x, y) {
    if (!this.isCreatingRoute || this.routePoints.length === 0) return;
    
    // Actualizar la visualización normal de la ruta
    this.updateRouteDisplay();
    
    // Añadir línea guía desde el último punto hasta la posición del ratón
    const lastPoint = this.routePoints[this.routePoints.length - 1];
    
    this.routeGraphics.lineStyle(2, 0xffff00, 0.7);
    this.routeGraphics.lineTo(x, y);
    
    // Círculo indicador en la posición del ratón
    this.routeGraphics.fillStyle(0xffff00, 0.5);
    this.routeGraphics.fillCircle(x, y, 6);
    this.routeGraphics.lineStyle(1, 0xffffff);
    this.routeGraphics.strokeCircle(x, y, 6);
  }
  
  /**
   * Resalta la sede en el mapa como punto de inicio/fin de la ruta
   * @private
   * @returns {boolean} Verdadero si la sede fue resaltada correctamente
   */
  highlightHeadquarters() {
    try {
      // Verificar que hay una hermandad y sede
      if (!this.currentBrotherhood || !this.currentBrotherhood.headquarters) {
        if (this.logManager) {
          this.logManager.warning('No se puede resaltar la sede: no hay sede definida', {
            hasBrotherhood: !!this.currentBrotherhood,
            hasHeadquarters: !!(this.currentBrotherhood?.headquarters)
          });
        }
        return false;
      }

      const hq = this.currentBrotherhood.headquarters;
      if (this.logManager) {
        this.logManager.debug('Resaltando sede de hermandad', {
          x: hq.x,
          y: hq.y,
          brotherhood: this.currentBrotherhood.name
        });
      }

      // Limpiar cualquier resaltado previo
      this.removeRouteHelperGraphics();
      
      // Crear elementos gráficos de ayuda, con manejo de errores
      const graphicsCreated = this.createRouteHelperGraphics();
      if (!graphicsCreated) {
        this.logManager.warning('No se pudieron crear los gráficos de ayuda');
      }
      
      // Añadir panel informativo si no existe
      try {
        if (!this.routePointsCounter || !this.routeStatusText) {
          this.createRouteInfoPanel();
        }
      } catch (panelError) {
        if (this.logManager) {
          this.logManager.error('Error al crear panel informativo', {
            error: panelError.message,
            stack: panelError.stack
          });
        }
        // Continuar incluso sin el panel
      }
      
      if (this.logManager) {
        const hasHelperGraphics = !!this.scene.children.getByName('route_helper_pulse');
        this.logManager.debug('Estado final de resaltado de sede', {
          hasHelperGraphics: hasHelperGraphics,
          hasPanelInfo: !!(this.routePointsCounter && this.routeStatusText)
        });
      }
      
      return true;
    } catch (error) {
      if (this.logManager) {
        this.logManager.error('Error al resaltar sede', {
          error: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }
} 
import Brotherhood from '../entities/Brotherhood.js';
import Nazareno from '../entities/Nazareno.js';
import Paso from '../entities/Paso.js';
import TimeManager from '../managers/TimeManager.js';
import EventManager from '../managers/EventManager.js';
import RouteManager from '../managers/RouteManager.js';
import ProcessionManager from '../managers/ProcessionManager.js';
import LogManager from '../managers/LogManager.js';

/**
 * Escena principal del juego
 * @class GameScene
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.map = null;
    this.controls = null;
    this.brotherhood = null;
    this.timeManager = null;
    this.eventManager = null;
    this.routeManager = null;
    this.processionManager = null;
    this.logManager = null;
    this.isCreatingBrotherhood = false;
    this.nazarenos = [];
    this.pasos = [];
    this.formUI = null;
    this.isCreatingRoute = false;
    this.routePoints = [];
    this.routeGraphics = null;
    this.routeMarkers = [];
    this.processionRoute = null;
  }

  /**
   * Inicializa la escena con datos recibidos
   * @param {Object} data - Datos de inicialización
   */
  init(data) {
    console.log('GameScene init con datos:', data);
    // Asegurarnos de que isNewGame tenga un valor por defecto
    this.isNewGame = data.newGame !== undefined ? data.newGame : true;
    this.savedData = data.savedData || null;
    this.currentYear = data.currentYear || 1500;
    window.gameData.currentYear = this.currentYear;
    
    console.log("GameScene iniciada con:", { isNewGame: this.isNewGame, hasSavedData: !!this.savedData });
  }

  /**
   * Crea todos los elementos de la escena
   */
  create() {
    console.log('GameScene create');
    // Establecer estado inicial
    this.isPaused = false;
    this.isCreatingBrotherhood = false;
    this.isCreatingRoute = false;
    this.isProcessionActive = false;
    this.selectedPath = null;
    this.pathToFollow = null;
    this.nastedMarkers = [];
    
    // Inicializar gestores
    this.eventManager = new EventManager(this);
    
    // Inicializar sistema de logs
    this.logManager = new LogManager(this.eventManager);
    this.logManager.info('GameScene iniciada', { gameMode: this.isNewGame ? 'nueva partida' : 'partida guardada' });
    
    try {
      // Crear el mapa de Sevilla
      this.createMap();
      
      // Configurar cámara y controles
      this.setupCamera();
      
      // Crear UI básica
      this.createUI();
      
      // Inicializar gestor de tiempo
      this.timeManager = new TimeManager(this);
      this.logManager.debug('TimeManager inicializado');
      
      // Inicializar gestor de rutas
      this.routeManager = new RouteManager(this, this.eventManager);
      this.logManager.debug('RouteManager inicializado');
      
      // Configurar manejo de clics para la creación de rutas
      this.input.on('pointerdown', (pointer) => {
        // Agregar log detallado para cada clic
        this.logManager.debug('Clic detectado en el mapa', {
          x: pointer.x,
          y: pointer.y,
          button: pointer.button,
          isClickOnUI: this.isClickOnUI(pointer),
          isCreatingRoute: this.routeManager.isCreatingRouteActive()
        });
        
        // Solo manejamos el botón principal
        if (pointer.button !== 0) {
          this.logManager.debug('Clic ignorado: botón no principal');
          return;
        }
        
        // Si estamos en modo de creación de ruta, delegamos siempre
        if (this.routeManager.isCreatingRouteActive()) {
          this.logManager.debug('En modo creación de ruta, delegando al RouteManager sin filtrar UI');
          const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.logManager.debug('Coordenadas convertidas', {
            screenX: pointer.x,
            screenY: pointer.y,
            worldX: worldPoint.x,
            worldY: worldPoint.y
          });
          
          // MARCADOR DE DEPURACIÓN: dibujar un punto en la posición del clic
          this.add.circle(worldPoint.x, worldPoint.y, 6, 0xff0000, 0.8)
            .setDepth(1000)
            .setScrollFactor(0);
          
          try {
            const handled = this.routeManager.handleRouteClick(worldPoint.x, worldPoint.y);
            this.logManager.debug(`RouteManager.handleRouteClick resultado: ${handled ? 'procesado' : 'ignorado'}`);
          } catch (error) {
            this.logManager.error('Error en handleRouteClick', {
              error: error.message,
              stack: error.stack
            });
          }
          return;
        }
        
        // Si no estamos creando ruta, ignorar clics en UI
        if (!this.isClickOnUI(pointer)) {
          this.logManager.debug('Clic válido para interacción con mapa');
          // Aquí irían otras interacciones con el mapa si las hubiera
        } else {
          this.logManager.debug('Clic ignorado: clic en UI');
        }
      });
      
      // Añadir evento de movimiento del puntero para mostrar línea guía
      this.input.on('pointermove', (pointer) => {
        if (this.routeManager.isCreatingRouteActive() && !this.isClickOnUI(pointer)) {
          // Convertir coordenadas de pantalla a mundo
          const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          // Mostrar línea guía
          this.routeManager.showRouteGuideLine(worldPoint.x, worldPoint.y);
        }
      });
      
      // Suscribirse a eventos de ruta
      this.eventManager.on('ROUTE_CREATION_STARTED', (data) => {
        try {
          this.logManager.info('Evento ROUTE_CREATION_STARTED recibido', data);
          this.showMessage('Haz clic en el mapa para añadir puntos a la ruta');
        } catch (error) {
          this.logManager.error('Error al manejar evento ROUTE_CREATION_STARTED', {
            error: error.message,
            stack: error.stack
          });
        }
      });
      
      this.eventManager.on('ROUTE_POINT_ADDED', (data) => {
        try {
          this.logManager.debug('Punto añadido a la ruta', data);
          // Actualizar interfaz o mostrar feedback si es necesario
        } catch (error) {
          this.logManager.error('Error al manejar evento ROUTE_POINT_ADDED', {
            error: error.message,
            stack: error.stack
          });
        }
      });
      
      this.eventManager.on('ROUTE_FINISH_SUGGESTED', (data) => {
        try {
          this.logManager.info('Sugerencia de finalización de ruta recibida', data);
          if (confirm('¿Deseas finalizar la ruta?')) {
            this.routeManager.finishRouteCreation();
          }
        } catch (error) {
          this.logManager.error('Error al manejar evento ROUTE_FINISH_SUGGESTED', {
            error: error.message,
            stack: error.stack
          });
        }
      });
      
      // Añadir evento para cancelación de ruta
      this.eventManager.on('ROUTE_CREATION_CANCELLED', () => {
        this.logManager.info('Creación de ruta cancelada');
        this.showMessage('Creación de ruta cancelada');
      });
      
      // Añadir evento para error en creación de ruta
      this.eventManager.on('ROUTE_CREATION_ERROR', (data) => {
        this.logManager.warning('Error en creación de ruta', data);
        this.showMessage(data.message || 'Error al crear la ruta');
      });
      
      // Añadir teclas de acceso rápido para manejo de rutas
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.routeManager.isCreatingRouteActive()) {
          if (confirm('¿Deseas cancelar la creación del itinerario?')) {
            this.routeManager.cancelRouteCreation();
          }
        }
      });
      
      this.input.keyboard.on('keydown-Z', (event) => {
        // Comprobar si Ctrl/Cmd está presionado
        if ((event.ctrlKey || event.metaKey) && this.routeManager.isCreatingRouteActive()) {
          this.routeManager.removeLastPoint();
        }
      });
      
      this.input.keyboard.on('keydown-ENTER', () => {
        if (this.routeManager.isCreatingRouteActive()) {
          if (confirm('¿Deseas finalizar el itinerario?')) {
            this.routeManager.finishRouteCreation();
          }
        }
      });
      
      // Inicializar gestor de procesiones
      this.processionManager = new ProcessionManager(this, this.routeManager, this.eventManager);
      this.logManager.debug('ProcessionManager inicializado');
      
      // Registrar callback para eventos de Semana Santa
      this.timeManager.onTimeChange(this.checkHolyWeekEvent.bind(this));
      
      // Si es partida nueva, mostrar formulario para crear hermandad
      if (this.isNewGame) {
        // Pequeño retraso para asegurar que la escena esté completamente cargada
        this.time.delayedCall(100, () => {
          this.showBrotherhoodForm();
        });
      } else if (this.savedData) {
        // Cargar datos guardados
        this.loadSavedGame(this.savedData);
      }
      
      // Crear controlador de audio
      this.setupAudio();
      
      // Inicializar arrays para nazarenos y pasos (estarán vacíos hasta la Salida Penitencial)
      this.nazarenos = [];
      this.pasos = [];
      
      // Añadir botón para activar Salida Penitencial (solo para pruebas)
      this.createProcessionButton();
      
      // Añadir botón de prueba de logs
      this.addLogTestButton();
      
      this.logManager.info('GameScene inicializada completamente');
    } catch (error) {
      this.logManager.fatal('Error durante la inicialización de GameScene', error);
      this.showMessage('Error durante la inicialización del juego');
    }
  }

  /**
   * Actualiza la escena en cada frame
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo desde el último frame
   */
  update(time, delta) {
    try {
      // Actualizar controles de cámara
      if (this.controls) {
        this.controls.update(delta);
      }
      
      // Actualizar nazarenos si existen
      if (this.nazarenos.length > 0) {
        this.nazarenos.forEach(nazareno => nazareno.update(delta));
      }
      
      // Actualizar pasos si existen
      if (this.pasos.length > 0) {
        this.pasos.forEach(paso => paso.update(delta));
      }
      
      // Actualizar posiciones de UI para asegurar estabilidad
      this.updateUIPositions();
    } catch (error) {
      this.logManager.error('Error en método update', error);
    }
  }

  /**
   * Crea el mapa de Sevilla utilizando Tiled
   */
  createMap() {
    // Verificar si el mapa existe antes de intentar crearlo
    try {
      // Verificamos si el mapa está cargado
      if (this.cache.tilemap.exists('sevilla')) {
        // Crear mapa desde el tilemap
        this.map = this.make.tilemap({ key: 'sevilla' });
        
        // Verificar si el tileset existe
        if (this.textures.exists('tiles')) {
          const tileset = this.map.addTilesetImage('sevilla_tileset', 'tiles');
          
          // Crear capas
          const backgroundLayer = this.map.createLayer('fondo', tileset, 0, 0);
          const buildingsLayer = this.map.createLayer('edificios', tileset, 0, 0);
          const streetsLayer = this.map.createLayer('calles', tileset, 0, 0);
          const routesLayer = this.map.createLayer('rutas', tileset, 0, 0);
          
          // Configurar colisiones si es necesario
          if (buildingsLayer) {
            buildingsLayer.setCollisionByProperty({ collides: true });
          }
        } else {
          console.warn('Tileset "tiles" no encontrado, usando mapa alternativo');
          this.createSimpleMap();
        }
      } else {
        console.warn('Mapa "sevilla" no encontrado, usando mapa alternativo');
        this.createSimpleMap();
      }
    } catch (error) {
      console.error('Error al crear el mapa:', error);
      this.createSimpleMap();
    }
  }
  
  /**
   * Crea un mapa simple para desarrollo cuando no hay tilemap
   */
  createSimpleMap() {
    // Crear un mapa simple para desarrollo
    this.map = {
      widthInPixels: 1920,
      heightInPixels: 1920
    };
    
    // Intentar cargar el plano de Sevilla como imagen de fondo
    if (this.textures.exists('plano-sevilla-img')) {
      // Si el plano ya está cargado como imagen, usarlo
      console.log("Usando plano-sevilla-img como fondo del mapa");
      this.add.image(this.map.widthInPixels / 2, this.map.heightInPixels / 2, 'plano-sevilla-img')
        .setOrigin(0.5);
    } else {
      // Si no hay imagen disponible, crear un mapa básico
      console.warn("El plano de Sevilla no está cargado como imagen. Se usará un mapa básico.");
      
      // Fondo simple
      const bgGraphics = this.add.graphics();
      bgGraphics.fillStyle(0xead4aa); // Color tierra/arena como el mapa de Sevilla
      bgGraphics.fillRect(0, 0, this.map.widthInPixels, this.map.heightInPixels);
      
      // Añadir algunos elementos visuales para simular el mapa
      const grid = this.add.grid(
        this.map.widthInPixels / 2, 
        this.map.heightInPixels / 2,
        this.map.widthInPixels, 
        this.map.heightInPixels,
        64, 
        64, 
        0, 
        0,
        0x9c8569, 
        0.3
      );
      
      // Simular río
      const riverGraphics = this.add.graphics();
      riverGraphics.fillStyle(0x6abed5);
      riverGraphics.fillRect(600, 0, 150, this.map.heightInPixels);
      
      // Simular algunas calles
      const streetsGraphics = this.add.graphics();
      streetsGraphics.fillStyle(0xcccccc, 0.5);
      // Calle horizontal
      streetsGraphics.fillRect(0, 400, this.map.widthInPixels, 60);
      streetsGraphics.fillRect(0, 800, this.map.widthInPixels, 60);
      // Calle vertical
      streetsGraphics.fillRect(300, 0, 60, this.map.heightInPixels);
      streetsGraphics.fillRect(900, 0, 60, this.map.heightInPixels);
    }
    
    // Mostrar texto informativo
    this.add.text(
      this.cameras.main.width / 2,
      50,
      'Mapa de desarrollo (convierte plano-sevilla.pdf a PNG)',
      { font: '18px Arial', fill: '#000000', backgroundColor: 'rgba(255,255,255,0.7)', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setScrollFactor(0);
  }
  
  /**
   * Configura la cámara y los controles de zoom/pan
   */
  setupCamera() {
    // Configurar límites de la cámara
    if (this.map) {
      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    } else {
      // Valores por defecto si no hay mapa
      this.cameras.main.setBounds(0, 0, 1920, 1920);
    }
    
    // Añadir controles de zoom y pan
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.cameras.main,
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      speed: 0.5
    });
    
    // Añadir control de zoom con rueda del ratón
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (deltaY > 0) {
        this.decreaseZoom();
      } else {
        this.increaseZoom();
      }
    });
    
    // Habilitar arrastre de mapa con el ratón (pan)
    this.enableMapDrag();
    
    // Crear controles visuales de zoom
    this.createZoomControls();
    
    // Crear controles visuales de navegación
    this.createNavigationControls();
    
    // Listener para detectar cambios en el tamaño de la ventana
    this.scale.on('resize', this.handleResize, this);
  }
  
  /**
   * Habilita la funcionalidad de arrastrar el mapa con el ratón
   */
  enableMapDrag() {
    // Solo permitir arrastrar el mapa si no estamos creando una ruta o en modo de creación de hermandad
    if (!this.isCreatingRoute && !this.isCreatingBrotherhood) {
      this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && !this.isPaused) {
          this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
          this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        }
      });
    }
  }

  /**
   * Crea controles visuales para la navegación del mapa
   */
  createNavigationControls() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Panel para los controles de navegación
    const navPanel = this.add.rectangle(
      70, 
      height - 100, 
      120, 
      120, 
      0x000000, 
      0.6
    ).setScrollFactor(0)
      .setName('navPanel')
      .setData('isUI', true);
    
    // Botones de dirección
    const upButton = this.createNavButton(70, height - 140, '⬆️', '#1a237e', 'navUp');
    const downButton = this.createNavButton(70, height - 60, '⬇️', '#1a237e', 'navDown');
    const leftButton = this.createNavButton(30, height - 100, '⬅️', '#1a237e', 'navLeft');
    const rightButton = this.createNavButton(110, height - 100, '➡️', '#1a237e', 'navRight');
    
    // Botón central (restablecer posición)
    const centerButton = this.createNavButton(70, height - 100, '⦿', '#800000', 'navCenter');
    
    // Eventos para los botones
    upButton.on('pointerdown', () => this.moveCamera(0, -1));
    downButton.on('pointerdown', () => this.moveCamera(0, 1));
    leftButton.on('pointerdown', () => this.moveCamera(-1, 0));
    rightButton.on('pointerdown', () => this.moveCamera(1, 0));
    
    // El botón central centra el mapa en la posición inicial o en la hermandad
    centerButton.on('pointerdown', () => {
      // Si hay una hermandad, centrar en su sede
      if (this.brotherhood && this.brotherhood.headquarters) {
        this.cameras.main.pan(
          this.brotherhood.headquarters.x,
          this.brotherhood.headquarters.y,
          500,
          'Power2'
        );
      } else {
        // Si no hay hermandad, centrar en el medio del mapa
        const mapCenterX = this.map ? this.map.widthInPixels / 2 : 960;
        const mapCenterY = this.map ? this.map.heightInPixels / 2 : 960;
        this.cameras.main.pan(mapCenterX, mapCenterY, 500, 'Power2');
      }
    });
  }
  
  /**
   * Crea un botón para los controles de navegación
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} text - Texto/emoji del botón
   * @param {string} [color='#1a237e'] - Color de fondo del botón
   * @param {string} [name=''] - Nombre del botón para poder referenciarlo
   * @returns {Phaser.GameObjects.Text} - El botón creado
   */
  createNavButton(x, y, text, color = '#1a237e', name = '') {
    const button = this.add.text(
      x,
      y,
      text,
      {
        font: '20px Arial',
        fill: '#ffffff',
        backgroundColor: color,
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setData('isUI', true);
    
    if (name) {
      button.setName(name);
    }
    
    // Efecto hover
    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: this.getLighterColor(color) });
    });
    
    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: color });
    });
    
    return button;
  }
  
  /**
   * Retorna una versión más clara del color dado
   * @param {string} color - Color hexadecimal
   * @returns {string} - Color más claro
   */
  getLighterColor(color) {
    if (color === '#1a237e') return '#3949ab';
    if (color === '#800000') return '#b71c1c';
    return color; // Por defecto
  }
  
  /**
   * Mueve la cámara en una dirección dada
   * @param {number} x - Dirección X (-1, 0, 1)
   * @param {number} y - Dirección Y (-1, 0, 1)
   */
  moveCamera(x, y) {
    // Velocidad de movimiento ajustable
    const speed = 20;
    
    // Mover la cámara según la dirección
    this.cameras.main.scrollX += x * speed / this.cameras.main.zoom;
    this.cameras.main.scrollY += y * speed / this.cameras.main.zoom;
  }
  
  /**
   * Manejador para el evento de cambio de tamaño de la ventana
   * @param {Phaser.Scale.ScaleManager} scaleManager - El gestor de escala
   * @param {number} gameSize - El nuevo tamaño del juego
   * @param {Phaser.Structs.Size} baseSize - El tamaño base
   * @param {number} displaySize - El tamaño del display
   * @param {number} resolution - La resolución
   * @private
   */
  handleResize(scaleManager, gameSize, baseSize, displaySize, resolution) {
    // Actualizar los límites de la cámara si el mapa está definido
    if (this.map) {
      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
    
    // Actualizar posiciones de elementos de UI
    this.updateUIPositions();
    
    if (this.logManager) {
      this.logManager.debug('Ventana redimensionada', { 
        width: gameSize.width, 
        height: gameSize.height 
      });
    }
  }
  
  /**
   * Crea controles visuales para el zoom
   */
  createZoomControls() {
    const width = this.cameras.main.width;
    
    // Panel para los controles de zoom - ajustado para no solapar con info de hermandad
    const zoomPanel = this.add.rectangle(
      width - 100, 
      280, // Movido más abajo
      60, 
      120, 
      0x000000, 
      0.6
    ).setScrollFactor(0)
      .setName('zoomPanel')
      .setData('isUI', true);
    
    // Botón de acercar zoom
    const zoomInButton = this.add.text(
      width - 100,
      250,
      '🔍+',
      {
        font: '20px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('zoomInButton')
      .setData('isUI', true);
    
    // Botón de alejar zoom
    const zoomOutButton = this.add.text(
      width - 100,
      310,
      '🔍-',
      {
        font: '20px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('zoomOutButton')
      .setData('isUI', true);
    
    // Texto que muestra el nivel de zoom actual
    this.zoomLevelText = this.add.text(
      width - 100,
      280,
      'x1.0',
      {
        font: '14px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5)
      .setScrollFactor(0)
      .setName('zoomLevelText')
      .setData('isUI', true);
    
    // Eventos para los botones
    zoomInButton.on('pointerdown', () => {
      this.increaseZoom();
    });
    
    zoomOutButton.on('pointerdown', () => {
      this.decreaseZoom();
    });
    
    // Efecto hover para los botones
    [zoomInButton, zoomOutButton].forEach(button => {
      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#3949ab' });
      });
      
      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#1a237e' });
      });
    });
  }
  
  /**
   * Actualiza el texto que muestra el nivel de zoom
   */
  updateZoomText() {
    if (this.zoomLevelText) {
      this.zoomLevelText.setText(`x${this.cameras.main.zoom.toFixed(1)}`);
    }
  }
  
  /**
   * Actualiza las posiciones de los elementos de UI después de un cambio de zoom
   */
  updateUIPositions() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Asegurar que todos los elementos de UI están anclados a la cámara
    // sin ser afectados por el zoom
    this._ensureUIElementsFixed();
    
    // Actualizar la interfaz de hermandad
    if (this.brotherhoodInterface) {
      // Reposicionar panel principal
      this.brotherhoodInterface.panel.setPosition(20, height - 150);
      
      // Actualizar posiciones de todos los elementos
      this.brotherhoodInterface.title.setPosition(30, height - 145);
      this.brotherhoodInterface.foundingYear.setPosition(30, height - 120);
      this.brotherhoodInterface.habitColorText.setPosition(30, height - 100);
      this.brotherhoodInterface.colorSwatch.setPosition(150, height - 93);
      this.brotherhoodInterface.centerButton.setPosition(30, height - 75);
      this.brotherhoodInterface.processionStatus.setPosition(30, height - 45);
      
      // Actualizar posición del botón de cierre
      if (this.brotherhoodInterface.closeButton) {
        this.brotherhoodInterface.closeButton.setPosition(280, height - 145);
      }
    }
    
    // Actualizar controles de zoom
    if (this.zoomLevelText) {
      // Reposicionar panel de zoom
      const zoomPanel = this.children.getByName('zoomPanel');
      if (zoomPanel) {
        zoomPanel.setPosition(width - 100, 280);
      }
      
      const zoomInButton = this.children.getByName('zoomInButton');
      if (zoomInButton) {
        zoomInButton.setPosition(width - 100, 250);
      }
      
      const zoomOutButton = this.children.getByName('zoomOutButton');
      if (zoomOutButton) {
        zoomOutButton.setPosition(width - 100, 310);
      }
      
      this.zoomLevelText.setPosition(width - 100, 280);
    }
    
    // Actualizar controles de navegación
    const navPanel = this.children.getByName('navPanel');
    if (navPanel) {
      navPanel.setPosition(70, height - 100);
      
      // Actualizar botones de navegación
      const upButton = this.children.getByName('navUp');
      if (upButton) upButton.setPosition(70, height - 140);
      
      const downButton = this.children.getByName('navDown');
      if (downButton) downButton.setPosition(70, height - 60);
      
      const leftButton = this.children.getByName('navLeft');
      if (leftButton) leftButton.setPosition(30, height - 100);
      
      const rightButton = this.children.getByName('navRight');
      if (rightButton) rightButton.setPosition(110, height - 100);
      
      const centerButton = this.children.getByName('navCenter');
      if (centerButton) centerButton.setPosition(70, height - 100);
    }
    
    // Actualizar panel superior
    const topPanel = this.children.getByName('topPanel');
    if (topPanel) {
      topPanel.setSize(width, 50);
      topPanel.setPosition(width/2, 25);
      topPanel.setOrigin(0.5, 0.5);
    }
    
    // Actualizar textos del año y botones superiores
    if (this.yearText) {
      this.yearText.setPosition(20, 15);
    }
    
    // Actualizar botones en panel superior
    const advanceTimeButton = this.children.getByName('advanceTimeButton');
    if (advanceTimeButton) {
      advanceTimeButton.setPosition(width / 2 - 60, 15);
    }
    
    const saveButton = this.children.getByName('saveButton');
    if (saveButton) {
      saveButton.setPosition(width - 100, 15);
    }
    
    // Actualizar botón de procesión
    const processionButton = this.children.getByName('processionButton');
    if (processionButton) {
      processionButton.setPosition(width / 2 + 100, 15);
    }
    
    // Actualizar botón de música
    const audioButton = this.children.getByName('audioButton');
    if (audioButton) {
      audioButton.setPosition(width / 2 - 200, 15);
    }
  }
  
  /**
   * Asegura que todos los elementos de UI permanezcan fijos a la cámara
   * sin ser afectados por el zoom
   * @private
   */
  _ensureUIElementsFixed() {
    // Recorrer todos los elementos de UI y asegurar que están fijos
    this.children.each(child => {
      // Solo procesar elementos que deben permanecer fijos a la cámara
      if (child.data && child.data.has('isUI')) {
        child.setScrollFactor(0);
      }
    });
  }
  
  /**
   * Aumenta el nivel de zoom
   */
  increaseZoom() {
    const zoom = this.cameras.main.zoom;
    if (zoom < 2.0) {
      this.cameras.main.zoom += 0.1;
      this.updateZoomText();
      this.updateUIPositions(); 
    }
  }
  
  /**
   * Disminuye el nivel de zoom
   */
  decreaseZoom() {
    const zoom = this.cameras.main.zoom;
    if (zoom > 0.5) {
      this.cameras.main.zoom -= 0.1;
      this.updateZoomText();
      this.updateUIPositions();
    }
  }
  
  /**
   * Crea la interfaz de usuario básica
   */
  createUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Panel superior - expandido para dar más espacio
    const topPanel = this.add.rectangle(width/2, 25, width, 50, 0x000000, 0.7)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setName('topPanel')
      .setData('isUI', true);
    
    // Texto año actual - ajustado a la izquierda
    this.yearText = this.add.text(20, 15, 'Año: 1550', {
      font: '18px Arial',
      fill: '#ffffff'
    }).setScrollFactor(0)
      .setData('isUI', true);
    
    // Reorganización de botones con mejor distribución
    // Botón para avanzar tiempo - centrado
    const advanceTimeButton = this.add.text(width / 2 - 60, 15, 'Avanzar 10 años', {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#1a237e',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('advanceTimeButton')
      .setData('isUI', true);
    
    advanceTimeButton.on('pointerdown', () => {
      this.timeManager.advance(10);
    });
    
    // Botón de guardado - más a la derecha
    const saveButton = this.add.text(width - 100, 15, 'Guardar', {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#1a237e',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('saveButton')
      .setData('isUI', true);
    
    // Evento de guardado
    saveButton.on('pointerdown', () => {
      this.saveGame();
    });
    
    // Panel lateral izquierdo para información de diagnóstico
    // Se moverá abajo para no interferir con otros elementos
    const diagPanel = this.add.rectangle(
      110, 
      100, 
      200, 
      150, 
      0x000000, 
      0.7
    ).setScrollFactor(0)
      .setOrigin(0.5)
      .setName('diagPanel')
      .setData('isUI', true);
    
    // Título del panel de diagnóstico
    const diagTitle = this.add.text(
      110,
      40,
      'Diagnóstico',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0)
      .setOrigin(0.5, 0)
      .setName('diagTitle')
      .setData('isUI', true);
    
    // Textos de diagnóstico
    const diagText1 = this.add.text(
      20,
      70,
      'Estado: Juego Phaser inicializado correctamente',
      { font: '12px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
      .setName('diagText1')
      .setData('isUI', true);
    
    const diagText2 = this.add.text(
      20,
      90,
      'Phaser: v3.55.2 cargado correctamente',
      { font: '12px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
      .setName('diagText2')
      .setData('isUI', true);
    
    // Guardar referencias para posteriormente ocultarlas si es necesario
    this.diagElements = {
      panel: diagPanel,
      title: diagTitle,
      text1: diagText1,
      text2: diagText2
    };
    
    // Ocultar diagnóstico después de unos segundos
    this.time.delayedCall(5000, () => {
      Object.values(this.diagElements).forEach(el => {
        el.setVisible(false);
      });
    });
  }
  
  /**
   * Muestra el formulario para crear una nueva hermandad
   */
  showBrotherhoodForm() {
    // Asegurarnos de que la escena esté cargada
    if (!this.scene.isActive('GameScene')) {
      console.warn("Intento de mostrar formulario de hermandad en una escena inactiva");
      return;
    }
    
    console.log("Mostrando formulario de creación de hermandad");
    this.isCreatingBrotherhood = true;
    
    // Fondo semi-transparente
    const formBackground = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      500,
      0x222222,
      0.9
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Título del formulario
    const formTitle = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 220,
      'CREAR NUEVA HERMANDAD',
      {
        font: 'bold 20px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Variables para almacenar los datos del formulario
    let hermandadData = {
      name: 'Hermandad Nueva',
      foundingDate: 1550,
      habitColor: 'purple', // Valor por defecto
      headquarters: { x: 400, y: 300 },
      isValid: false // Flag para validación
    };
    
    // Campo de nombre
    const nombreLabel = this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 170,
      'Nombre:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Campo para introducir el nombre
    const nameInput = this.add.text(
      this.cameras.main.width / 2 - 80,
      this.cameras.main.height / 2 - 170,
      hermandadData.name,
      { font: '16px Arial', fill: '#ffff00', backgroundColor: '#333344', padding: { x: 10, y: 5 } }
    ).setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100);
    
    nameInput.on('pointerdown', () => {
      // Simulamos un cuadro de entrada de texto
      const newName = prompt('Introduce el nombre de la hermandad:', hermandadData.name);
      if (newName && newName.trim() !== '') {
        hermandadData.name = newName.trim();
        nameInput.setText(hermandadData.name);
        validateForm();
      }
    });
    
    // Fecha de fundación
    const yearLabel = this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 110,
      'Fecha de fundación:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    const yearValue = this.add.text(
      this.cameras.main.width / 2 + 30,
      this.cameras.main.height / 2 - 110,
      hermandadData.foundingDate.toString(),
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Botones para ajustar el año
    const decreaseYearBtn = this.add.text(
      this.cameras.main.width / 2 - 20,
      this.cameras.main.height / 2 - 110,
      '◀',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    
    const increaseYearBtn = this.add.text(
      this.cameras.main.width / 2 + 90,
      this.cameras.main.height / 2 - 110,
      '▶',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    
    decreaseYearBtn.on('pointerdown', () => {
      if (hermandadData.foundingDate > 1500) {
        hermandadData.foundingDate -= 10;
        yearValue.setText(hermandadData.foundingDate.toString());
        validateForm();
      }
    });
    
    increaseYearBtn.on('pointerdown', () => {
      if (hermandadData.foundingDate < 1900) {
        hermandadData.foundingDate += 10;
        yearValue.setText(hermandadData.foundingDate.toString());
        validateForm();
      }
    });
    
    // Selección de hábito
    const habitLabel = this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 50,
      'Color del hábito:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Opciones de colores para el hábito
    const colors = [
      { name: 'Morado', value: 'purple', hex: 0x800080 },
      { name: 'Negro', value: 'black', hex: 0x000000 },
      { name: 'Blanco', value: 'white', hex: 0xffffff },
      { name: 'Rojo', value: 'red', hex: 0xff0000 },
      { name: 'Verde', value: 'green', hex: 0x008800 },
      { name: 'Azul', value: 'blue', hex: 0x0000ff }
    ];
    
    // Crear grupo de opciones de colores
    const colorOptions = [];
    const colorTexts = [];
    const colorSamples = [];
    
    colors.forEach((color, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const xPos = this.cameras.main.width / 2 - 180 + (col * 120);
      const yPos = this.cameras.main.height / 2 - 20 + (row * 40);
      
      // Muestra del color
      const colorSample = this.add.rectangle(xPos + 12, yPos + 12, 25, 25, color.hex)
        .setScrollFactor(0)
        .setStrokeStyle(1, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);
      
      // Texto del color
      const colorText = this.add.text(xPos + 40, yPos, color.name, 
        { font: '14px Arial', fill: '#cccccc' }
      ).setScrollFactor(0)
       .setDepth(100);
      
      // Marca de selección (inicialmente invisible excepto para el primero)
      const selected = this.add.text(xPos - 15, yPos, '✓', 
        { font: '16px Arial', fill: '#ffffff' }
      ).setScrollFactor(0)
        .setVisible(color.value === hermandadData.habitColor)
        .setDepth(100);
      
      colorSample.on('pointerdown', () => {
        // Actualizar selección
        hermandadData.habitColor = color.value;
        
        // Actualizar marcas de selección
        colorOptions.forEach(opt => opt.setVisible(false));
        selected.setVisible(true);
        validateForm();
      });
      
      colorOptions.push(selected);
      colorTexts.push(colorText);
      colorSamples.push(colorSample);
    });
    
    // Ubicación
    const locationLabel = this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 + 70,
      'Ubicación:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    const locationText = this.add.text(
      this.cameras.main.width / 2 - 90,
      this.cameras.main.height / 2 + 70,
      'Selecciona en el mapa',
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Estado de validación (inicialmente invisible)
    const validationText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 150,
      'Selecciona la ubicación para continuar',
      { font: '14px Arial', fill: '#ff6666', align: 'center' }
    ).setOrigin(0.5, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Instrucciones para seleccionar en el mapa
    const mapInstructions = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 110,
      'Haz clic en el mapa para elegir ubicación',
      { font: '14px Arial', fill: '#aaaaaa', align: 'center' }
    ).setOrigin(0.5, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Marcador de posición en el mapa (inicialmente invisible)
    const locationMarker = this.add.circle(0, 0, 15, 0xff0000)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(false)
      .setDepth(100);
    
    // Efecto de resplandor para ayudar a visualizar el marcador
    const locationGlow = this.add.circle(0, 0, 20, 0xff0000, 0.4)
      .setVisible(false)
      .setDepth(100);
    
    // Habilitar selección de ubicación en el mapa
    this.input.on('pointerdown', (pointer) => {
      if (this.isCreatingBrotherhood) {
        // Convertir coordenadas del mundo
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Actualizar datos y marcador
        hermandadData.headquarters = { x: worldPoint.x, y: worldPoint.y };
        locationMarker.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
        locationGlow.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
        
        // Actualizar texto
        locationText.setText(`X: ${Math.floor(worldPoint.x)}, Y: ${Math.floor(worldPoint.y)}`);
        validateForm();
        
        // Hacer zoom y centrar en la ubicación seleccionada
        this.cameras.main.pan(worldPoint.x, worldPoint.y, 500, 'Power2');
      }
    });
    
    // Botón para crear la hermandad (inicialmente desactivado)
    const createButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 200,
      'CREAR',
      {
        font: 'bold 18px Arial',
        fill: '#aaaaaa', // Color gris cuando está desactivado
        backgroundColor: '#666666',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100);
    
    // Función para validar el formulario
    const validateForm = () => {
      const isNameValid = hermandadData.name && hermandadData.name.length >= 3;
      const isLocationSelected = locationMarker.visible;
      
      hermandadData.isValid = isNameValid && isLocationSelected;
      
      // Actualizar estado del botón
      if (hermandadData.isValid) {
        createButton.setStyle({ 
          fill: '#ffffff',
          backgroundColor: '#1a237e'
        });
        validationText.setVisible(false);
      } else {
        createButton.setStyle({ 
          fill: '#aaaaaa',
          backgroundColor: '#666666'
        });
        
        // Mostrar mensaje de error específico
        if (!isNameValid) {
          validationText.setText('El nombre debe tener al menos 3 caracteres');
        } else if (!isLocationSelected) {
          validationText.setText('Selecciona una ubicación en el mapa');
        }
        validationText.setVisible(true);
      }
      
      return hermandadData.isValid;
    };
    
    // Configurar eventos del botón crear
    createButton.on('pointerover', () => {
      if (hermandadData.isValid) {
        createButton.setStyle({ backgroundColor: '#3949ab' });
      }
    });
    
    createButton.on('pointerout', () => {
      if (hermandadData.isValid) {
        createButton.setStyle({ backgroundColor: '#1a237e' });
      }
    });
    
    createButton.on('pointerdown', () => {
      // Verificar validación antes de crear
      if (!validateForm()) {
        // Mostrar mensaje de error si no es válido
        this.cameras.main.shake(200, 0.01);
        return;
      }
      
      // Crear la hermandad con los datos del formulario
      const brotherhood = new Brotherhood({
        name: hermandadData.name,
        foundingDate: hermandadData.foundingDate,
        habitSpriteKey: hermandadData.habitColor, // Usamos el color como clave del sprite
        headquarters: hermandadData.headquarters
      });
      
      // Guardar hermandad en el juego
      this.brotherhood = brotherhood;
      window.gameData.brotherhood = brotherhood;
      
      // Cerrar el formulario y limpiar elementos
      this.isCreatingBrotherhood = false;
      
      // Crear un array con TODOS los elementos del formulario para asegurarnos de eliminarlos
      const allFormElements = [
        formBackground, formTitle, nombreLabel, nameInput, yearLabel, yearValue, 
        decreaseYearBtn, increaseYearBtn, mapInstructions, validationText,
        locationLabel, locationText, locationMarker, locationGlow,
        habitLabel, createButton, ...colorOptions, ...colorTexts, ...colorSamples
      ];
      
      // Verificar que cada elemento existe antes de destruirlo
      allFormElements.forEach(element => {
        if (element && !element.destroyed) {
          element.destroy();
        }
      });
      
      // Asegurarse de que la escucha de eventos del mapa para selección de ubicación sea cancelada
      this.input.off('pointerdown');
      
      // Crear una interfaz informativa para la hermandad (pero sin mostrarla)
      this.createBrotherhoodInterface(brotherhood);
      
      // Mostrar mensaje de confirmación
      this.showMessage(`¡Hermandad "${brotherhood.name}" fundada en ${brotherhood.foundingDate}!`);
      
      // Ya no creamos automáticamente nazarenos y pasos aquí
      // Ahora solo se crearán durante el evento "Salida Penitencial"
    });
    
    // Validar estado inicial
    validateForm();
  }
  
  /**
   * Crea una interfaz para mostrar la información de la hermandad
   * @param {Brotherhood} brotherhood - La hermandad a mostrar
   */
  createBrotherhoodInterface(brotherhood) {
    // Eliminar interfaz anterior si existe
    if (this.brotherhoodInterface) {
      Object.values(this.brotherhoodInterface).forEach(el => {
        if (el && el.destroy) el.destroy();
      });
    }
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Fondo del panel (semi-transparente)
    const panelBg = this.add.rectangle(20, height - 150, 280, 180, 0x000000, 0.8)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff)
      .setName('brotherhoodPanelBg')
      .setData('isUI', true)
      .setVisible(false); // Inicialmente oculto
    
    // Contenedor para todos los elementos de la interfaz
    const container = this.add.container(0, 0);
    container.setScrollFactor(0);
    container.setData('isUI', true);
    container.setName('brotherhoodInfoContainer');
    container.setVisible(false); // Inicialmente oculto
    
    // Botón para cerrar el panel
    const closeButton = this.add.text(
      280, // Al borde derecho del panel
      height - 145,
      '✖',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff',
        backgroundColor: '#8B0000',
        padding: { x: 6, y: 4 }
      }
    ).setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('closeInfoButton')
      .setData('isUI', true)
      .setVisible(false);
    
    closeButton.on('pointerdown', () => {
      this.toggleBrotherhoodInterface(false);
    });
    
    // Título de la hermandad
    const title = this.add.text(
      30,
      height - 145,
      brotherhood.name,
      {
        font: 'bold 18px Arial',
        fill: '#ffffff'
      }
    ).setName('brotherhoodTitle').setData('isUI', true);
    container.add(title);
    
    // Subtítulo (año de fundación)
    const foundingYear = this.add.text(
      30,
      height - 120,
      `Fundación: ${brotherhood.foundingYear}`,
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setName('brotherhoodYear').setData('isUI', true);
    container.add(foundingYear);
    
    // Indicador de color del hábito
    const habitColorText = this.add.text(
      30,
      height - 100,
      'Color del hábito:',
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setName('habitColorLabel').setData('isUI', true);
    container.add(habitColorText);
    
    // Representación visual del color
    let colorHex;
    switch (brotherhood.habitSpriteKey) {
      case 'purple': colorHex = 0x800080; break;
      case 'black': colorHex = 0x000000; break;
      case 'white': colorHex = 0xffffff; break;
      case 'red': colorHex = 0xff0000; break;
      case 'green': colorHex = 0x008800; break;
      case 'blue': colorHex = 0x0000ff; break;
      default: colorHex = 0x800080;
    }
    
    const colorSwatch = this.add.rectangle(
      150,
      height - 93,
      30,
      15,
      colorHex
    ).setStrokeStyle(1, 0xffffff)
      .setName('habitColorSwatch')
      .setData('isUI', true);
    container.add(colorSwatch);
    
    // Botón para centrar la cámara en la sede
    const centerButton = this.add.text(
      30,
      height - 75,
      'Ir a la sede',
      {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 8, y: 4 }
      }
    ).setInteractive({ useHandCursor: true })
      .setName('centerHQButton')
      .setData('isUI', true);
    container.add(centerButton);
    
    // Evento para centrar la cámara en la sede
    centerButton.on('pointerdown', () => {
      if (brotherhood.headquarters) {
        this.cameras.main.pan(
          brotherhood.headquarters.x,
          brotherhood.headquarters.y,
          1000,
          'Power2'
        );
      }
    });
    
    // Efectos de hover para el botón
    centerButton.on('pointerover', () => {
      centerButton.setStyle({ backgroundColor: '#3949ab' });
    });
    
    centerButton.on('pointerout', () => {
      centerButton.setStyle({ backgroundColor: '#1a237e' });
    });
    
    // Estado de la procesión
    const processionStatus = this.add.text(
      30,
      height - 45,
      'Estado: Sin procesar',
      {
        font: '14px Arial',
        fill: '#ffffff'
      }
    ).setName('processionStatus').setData('isUI', true);
    container.add(processionStatus);
    
    // Guardar referencia a todos los elementos de la interfaz
    this.brotherhoodInterface = {
      panel: panelBg,
      container: container,
      title: title,
      foundingYear: foundingYear,
      habitColorText: habitColorText,
      colorSwatch: colorSwatch,
      centerButton: centerButton,
      processionStatus: processionStatus,
      closeButton: closeButton
    };
    
    // Crear un marcador permanente en el mapa para la sede
    this.createHeadquartersMarker(brotherhood);
    
    return this.brotherhoodInterface;
  }
  
  /**
   * Muestra u oculta la interfaz de información de la hermandad
   * @param {boolean} visible - True para mostrar, false para ocultar
   */
  toggleBrotherhoodInterface(visible) {
    if (!this.brotherhoodInterface) return;
    
    this.brotherhoodInterface.panel.setVisible(visible);
    this.brotherhoodInterface.container.setVisible(visible);
    this.brotherhoodInterface.closeButton.setVisible(visible);
  }
  
  /**
   * Crea un marcador permanente en el mapa para la sede de la hermandad
   * @param {Brotherhood} brotherhood - La hermandad cuya sede se va a marcar
   */
  createHeadquartersMarker(brotherhood) {
    if (!brotherhood || !brotherhood.headquarters) return;
    
    // Grupo para contener todos los elementos del marcador
    const markerGroup = this.add.group();
    
    // Crear efecto de resplandor exterior
    const outerGlow = this.add.circle(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      25,
      0xffffff,
      0.3
    ).setStrokeStyle(2, 0xffffff, 0.5);
    
    // Crear círculo principal (usando el color del hábito)
    let colorHex = 0x800080; // Morado por defecto
    switch(brotherhood.habitSpriteKey) {
      case 'purple': colorHex = 0x800080; break;
      case 'black': colorHex = 0x000000; break;
      case 'white': colorHex = 0xffffff; break;
      case 'red': colorHex = 0xff0000; break;
      case 'green': colorHex = 0x008800; break;
      case 'blue': colorHex = 0x0000ff; break;
    }
    
    const mainMarker = this.add.circle(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      15,
      colorHex,
      1
    ).setStrokeStyle(2, 0xffffff);
    
    // Añadir icono de cruz en el centro
    const cross = this.add.text(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      '✝',
      { font: 'bold 16px Arial', fill: '#ffffff' }
    ).setOrigin(0.5, 0.5);
    
    // Añadir texto con el nombre de la hermandad
    const nameTag = this.add.text(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y + 35,
      brotherhood.name,
      { 
        font: 'bold 14px Arial', 
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }
    ).setOrigin(0.5, 0.5)
      .setAlpha(0.85);
    
    // Agregar todos los elementos al grupo
    markerGroup.add(outerGlow);
    markerGroup.add(mainMarker);
    markerGroup.add(cross);
    markerGroup.add(nameTag);
    
    // Añadir un pulso animado al marcador
    this.tweens.add({
      targets: outerGlow,
      alpha: { start: 0.3, to: 0.6 },
      scaleX: { start: 1, to: 1.2 },
      scaleY: { start: 1, to: 1.2 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
    
    // Guardar referencia al marcador en la escena
    this.headquartersMarker = markerGroup;
    
    // Hacer que el marcador sea interactivo para mostrar información al hacer clic
    mainMarker.setInteractive({ useHandCursor: true });
    cross.setInteractive({ useHandCursor: true });
    
    // Mostrar información al hacer clic en el marcador o en la cruz
    const showInfoOnClick = () => {
      // Centrar en la sede
      this.cameras.main.pan(
        brotherhood.headquarters.x,
        brotherhood.headquarters.y,
        500,
        'Power2'
      );
      
      // Mostrar información de la hermandad
      this.toggleBrotherhoodInterface(true);
      
      // Mostrar mensaje
      this.showMessage(`Sede de ${brotherhood.name}`);
    };
    
    mainMarker.on('pointerdown', showInfoOnClick);
    cross.on('pointerdown', showInfoOnClick);
    
    // Añadir efecto de hover para indicar interactividad
    const pointerOver = () => {
      mainMarker.setStrokeStyle(3, 0xffff00);
      nameTag.setBackgroundColor('#3a3a00');
    };
    
    const pointerOut = () => {
      mainMarker.setStrokeStyle(2, 0xffffff);
      nameTag.setBackgroundColor('#000000');
    };
    
    mainMarker.on('pointerover', pointerOver);
    mainMarker.on('pointerout', pointerOut);
    cross.on('pointerover', pointerOver);
    cross.on('pointerout', pointerOut);
  }
  
  /**
   * Crea los nazarenos para la hermandad actual
   */
  createNazarenos() {
    if (!this.brotherhood) return;
    
    // Verificar si el sprite de nazarenos existe
    if (!this.textures.exists('nazarenos')) {
      console.warn("No se encontró el sprite de nazarenos. Usando marcadores temporales.");
      
      // Crear representación visual temporal - círculos de colores para nazarenos
      this.nazarenos = [];
      
      for (let i = 0; i < 10; i++) {
        const nazarenoX = this.brotherhood.headquarters.x + (i * 20);
        const nazarenoY = this.brotherhood.headquarters.y;
        
        // Usar el color del hábito para representar a los nazarenos
        let color = 0x800080; // Morado por defecto
        switch (this.brotherhood.habitSpriteKey) {
          case 'purple': color = 0x800080; break;
          case 'black': color = 0x000000; break;
          case 'white': color = 0xffffff; break;
          case 'red': color = 0xff0000; break;
          case 'green': color = 0x008800; break;
          case 'blue': color = 0x0000ff; break;
        }
        
        // Crear círculo que representa al nazareno
        const nazarenoCircle = this.add.circle(nazarenoX, nazarenoY, 5, color);
        nazarenoCircle.setStrokeStyle(1, 0xffffff);
        
        // Almacenar una versión simplificada de nazareno que solo contiene el círculo
        this.nazarenos.push({
          id: i,
          position: { x: nazarenoX, y: nazarenoY },
          sprite: nazarenoCircle,
          currentRouteIndex: 0,
          currentRoute: null,
          walkRoute: function(route) {
            this.currentRoute = route;
            this.currentRouteIndex = 0;
          },
          update: function(delta) {
            // Implementación simplificada del movimiento
            if (this.currentRoute && this.currentRoute.length > 0 && this.currentRouteIndex < this.currentRoute.length) {
              // Obtener siguiente punto de destino
              const targetPoint = this.currentRoute[this.currentRouteIndex];
              
              // Calcular dirección hacia el punto
              const dx = targetPoint.x - this.sprite.x;
              const dy = targetPoint.y - this.sprite.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 5) {
                // Llegamos al punto, avanzar al siguiente
                this.currentRouteIndex++;
                return;
              }
              
              // Mover hacia el punto
              const speed = 50;
              const speedX = (dx / distance) * speed * (delta / 1000);
              const speedY = (dy / distance) * speed * (delta / 1000);
              
              this.sprite.x += speedX;
              this.sprite.y += speedY;
              this.position.x = this.sprite.x;
              this.position.y = this.sprite.y;
            }
          },
          stop: function() {
            this.currentRoute = null;
          },
          destroy: function() {
            if (this.sprite) {
              this.sprite.destroy();
            }
          },
          serialize: () => ({ id: i, position: { x: nazarenoX, y: nazarenoY } })
        });
      }
    } else {
      // Código original para crear nazarenos con sprites
      for (let i = 0; i < 10; i++) {
        const nazareno = new Nazareno({
          scene: this,
          id: i,
          spriteKey: 'nazarenos',
          position: {
            x: this.brotherhood.headquarters.x + (i * 20),
            y: this.brotherhood.headquarters.y
          }
        });
        
        this.nazarenos.push(nazareno);
      }
    }
  }
  
  /**
   * Crea los pasos para la hermandad actual
   */
  createPasos() {
    if (!this.brotherhood) return;
    
    // Verificar si el sprite de pasos existe
    if (!this.textures.exists('pasos')) {
      console.warn("No se encontró el sprite de pasos. Usando marcadores temporales.");
      
      // Crear representación visual temporal - un rectángulo para el paso
      const pasoX = this.brotherhood.headquarters.x;
      const pasoY = this.brotherhood.headquarters.y + 100;
      
      // Crear rectángulo que representa al paso
      const pasoRect = this.add.rectangle(pasoX, pasoY, 40, 20, 0x964B00); // Color marrón para el paso
      pasoRect.setStrokeStyle(2, 0xFFD700); // Borde dorado
      
      // Almacenar una versión simplificada del paso
      this.pasos = [{
        id: 1,
        currentPosition: { x: pasoX, y: pasoY },
        sprite: pasoRect,
        currentRouteIndex: 0,
        currentRoute: null,
        isMoving: false,
        followRoute: function(route) {
          this.currentRoute = route;
          this.currentRouteIndex = 0;
          this.isMoving = true;
        },
        update: function(delta) {
          // Implementación simplificada del movimiento
          if (this.currentRoute && this.currentRoute.length > 0 && this.isMoving) {
            // Obtener siguiente punto de destino
            const targetPoint = this.currentRoute[this.currentRouteIndex];
            
            // Calcular dirección hacia el punto
            const dx = targetPoint.x - this.sprite.x;
            const dy = targetPoint.y - this.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
              // Llegamos al punto, avanzar al siguiente
              this.currentRouteIndex++;
              
              // Si llegamos al final de la ruta
              if (this.currentRouteIndex >= this.currentRoute.length) {
                this.isMoving = false;
                return;
              }
              
              return;
            }
            
            // Mover hacia el punto (más lento que nazarenos)
            const speed = 30;
            const speedX = (dx / distance) * speed * (delta / 1000);
            const speedY = (dy / distance) * speed * (delta / 1000);
            
            this.sprite.x += speedX;
            this.sprite.y += speedY;
            this.currentPosition.x = this.sprite.x;
            this.currentPosition.y = this.sprite.y;
          }
        },
        stop: function() {
          this.isMoving = false;
        },
        destroy: function() {
          if (this.sprite) {
            this.sprite.destroy();
          }
        },
        serialize: () => ({ id: 1, currentPosition: { x: pasoX, y: pasoY } })
      }];
    } else {
      // Código original para crear pasos con sprites
      const paso = new Paso({
        scene: this,
        id: 1,
        spritesheetKey: 'pasos',
        currentPosition: {
          x: this.brotherhood.headquarters.x,
          y: this.brotherhood.headquarters.y + 100
        }
      });
      
      this.pasos.push(paso);
    }
  }
  
  /**
   * Configura el sistema de audio para las marchas procesionales
   */
  setupAudio() {
    // Botón de control de audio - reposicionado para evitar solapamientos
    const audioButton = this.add.text(
      this.cameras.main.width / 2 - 200,
      15,
      '🔊 Música',
      {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('audioButton')
      .setData('isUI', true);
    
    // Estado de reproducción
    let isPlaying = false;
    
    // Evento de clic en botón de audio
    audioButton.on('pointerdown', () => {
      if (isPlaying) {
        // Detener la música
        if (this.sound.get('marcha1')) {
          this.sound.get('marcha1').stop();
        }
        audioButton.setText('🔊 Música');
        isPlaying = false;
      } else {
        // Reproducir la música
        this.sound.play('marcha1', {
          loop: true,
          volume: 0.5
        });
        audioButton.setText('🔇 Parar');
        isPlaying = true;
      }
    });
  }
  
  /**
   * Guarda el estado actual del juego
   */
  saveGame() {
    if (!this.brotherhood) {
      // Mostrar mensaje de error
      this.showMessage('No hay hermandad para guardar');
      return;
    }
    
    const gameData = {
      brotherhood: this.brotherhood.serialize(),
      currentYear: window.gameData.currentYear,
      nazarenos: this.nazarenos.map(n => n.serialize()),
      pasos: this.pasos.map(p => p.serialize())
    };
    
    try {
      localStorage.setItem('hermandadSave', JSON.stringify(gameData));
      this.showMessage('Partida guardada correctamente');
    } catch (e) {
      console.error('Error al guardar:', e);
      this.showMessage('Error al guardar la partida');
    }
  }
  
  /**
   * Carga una partida guardada
   * @param {Object} data - Datos de la partida guardada
   */
  loadSavedGame(data) {
    try {
      // Restaurar hermandad
      this.brotherhood = new Brotherhood(data.brotherhood);
      window.gameData.brotherhood = this.brotherhood;
      window.gameData.currentYear = data.currentYear;
      
      this.logManager.info('Cargando partida guardada', {
        brotherhood: this.brotherhood.name,
        year: data.currentYear
      });
      
      // Crear la interfaz y el marcador de la sede (sin mostrar automáticamente la interfaz)
      this.createBrotherhoodInterface(this.brotherhood);
      
      // Restaurar nazarenos
      this.nazarenos = data.nazarenos.map(nazarenoData => {
        return new Nazareno({
          scene: this,
          ...nazarenoData
        });
      });
      
      // Restaurar pasos
      this.pasos = data.pasos.map(pasoData => {
        return new Paso({
          scene: this,
          ...pasoData
        });
      });
      
      // Actualizar visualización de tiempo
      this.yearText.setText(`Año: ${window.gameData.currentYear}`);
      
      // Centrar el mapa en la sede de la hermandad
      if (this.brotherhood && this.brotherhood.headquarters) {
        this.cameras.main.pan(
          this.brotherhood.headquarters.x,
          this.brotherhood.headquarters.y,
          500,
          'Power2'
        );
      }
      
      this.logManager.info('Partida cargada correctamente');
      
      // Mostrar mensaje de confirmación
      this.showMessage('Partida cargada correctamente');
      
    } catch (e) {
      this.logManager.error('Error al cargar partida', e);
      this.showMessage('Error al cargar la partida');
    }
  }
  
  /**
   * Muestra un mensaje temporal en pantalla
   * @param {string} text - Texto a mostrar
   */
  showMessage(text) {
    // Registrar el mensaje en los logs como información
    if (this.logManager) {
      this.logManager.info('Mensaje mostrado', { text });
    }
    
    const message = this.add.text(
      this.cameras.main.width / 2,
      100,
      text,
      {
        font: '18px Arial',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5).setScrollFactor(0);
    
    this.time.delayedCall(3000, () => {
      message.destroy();
    });
  }

  /**
   * Añade un menú desplegable para las opciones de Salida Penitencial
   */
  createProcessionButton() {
    const width = this.cameras.main.width;
    
    // Botón principal que mostrará el menú
    const processionButton = this.add.text(
      width / 2 + 100,
      15,
      'Salida Penitencial ▼',
      {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#8B0000', // Rojo oscuro
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setName('processionButton')
      .setData('isUI', true);
    
    // Contenedor para el menú desplegable (inicialmente invisible)
    const menuContainer = this.add.container(width / 2 + 100, 40);
    menuContainer.setVisible(false);
    menuContainer.setScrollFactor(0);
    menuContainer.setData('isUI', true);
    menuContainer.setName('processionMenuContainer');
    
    // Fondo del menú
    const menuBg = this.add.rectangle(0, 30, 200, 110, 0x000000, 0.9)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0xffffff);
    menuContainer.add(menuBg);
    
    // Opción 1: Crear itinerario
    const createRouteOption = this.add.text(
      0,
      40,
      '1. Crear itinerario',
      {
        font: '15px Arial',
        fill: '#ffffff',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .setData('disabled', false);
    menuContainer.add(createRouteOption);
    
    // Opción 2: Iniciar procesión
    const startProcessionOption = this.add.text(
      0,
      75,
      '2. Iniciar Salida Penitencial',
      {
        font: '15px Arial',
        fill: '#ffffff',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .setData('disabled', false);
    menuContainer.add(startProcessionOption);
    
    // Opción 3: Detener procesión
    const stopProcessionOption = this.add.text(
      0,
      110,
      '3. Detener procesión',
      {
        font: '15px Arial',
        fill: '#ffffff',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .setData('disabled', true);
    menuContainer.add(stopProcessionOption);
    
    // Evento para mostrar/ocultar el menú
    processionButton.on('pointerdown', () => {
      menuContainer.setVisible(!menuContainer.visible);
      
      // Actualizar estado de las opciones según la situación actual
      this.updateProcessionMenuOptions();
    });
    
    // Ocultar el menú al hacer clic en cualquier lugar fuera de él
    this.input.on('pointerdown', (pointer) => {
      if (menuContainer.visible) {
        // Verificar si el clic fue fuera del menú y del botón
        const menuBounds = menuBg.getBounds();
        const buttonBounds = processionButton.getBounds();
        
        if (!Phaser.Geom.Rectangle.Contains(menuBounds, pointer.x, pointer.y) &&
            !Phaser.Geom.Rectangle.Contains(buttonBounds, pointer.x, pointer.y)) {
          menuContainer.setVisible(false);
        }
      }
    });
    
    // Evento de crear itinerario
    createRouteOption.on('pointerdown', () => {
      menuContainer.setVisible(false);
      
      if (createRouteOption.getData('disabled')) {
        this.showMessage('No puedes crear un itinerario mientras hay una procesión en curso');
        this.logManager.warning('Intento de crear itinerario mientras hay procesión activa');
        return;
      }
      
      // Verificar si existe una hermandad
      if (!this.brotherhood) {
        this.showMessage('Primero debes crear una hermandad');
        this.logManager.warning('Intento de crear itinerario sin hermandad');
        return;
      }
      
      // Asegurarse de que la hermandad tiene una sede definida
      if (!this.brotherhood.headquarters) {
        this.showMessage('La hermandad no tiene una sede definida');
        this.logManager.warning('Intento de crear itinerario para hermandad sin sede', {
          brotherhood: this.brotherhood.name
        });
        return;
      }
      
      // Iniciar creación de ruta
      this.logManager.info('Iniciando creación de itinerario', { 
        brotherhood: this.brotherhood.name,
        creatingRoute: this.routeManager.isCreatingRouteActive(),
        existingRoute: !!this.processionRoute
      });
      
      // Si ya existe una ruta, preguntar si desea reemplazarla
      if (this.processionRoute) {
        if (!confirm('Ya existe un itinerario. ¿Deseas crear uno nuevo?')) {
          this.logManager.info('Creación de itinerario cancelada por el usuario - ya existía uno');
          return;
        }
        this.logManager.info('Usuario confirmó reemplazar itinerario existente');
      }
      
      try {
        this.routeManager.startRouteCreation(this.brotherhood);
        
        // Suscribirse al evento de ruta creada si aún no lo está
        if (!this._routeCreatedHandler) {
          this._routeCreatedHandler = (data) => {
            this.logManager.info('Itinerario creado correctamente', {
              routeId: data.route.id,
              pointCount: data.route.points.length,
              brotherhood: this.brotherhood.name
            });
            
            // Guardar la ruta en GameScene
            this.processionRoute = data.route;
            
            // Para debugging, guardar una copia del objeto raw
            this._rawRouteObject = JSON.parse(JSON.stringify(data.route));
            
            // Actualizar menú
            this.updateProcessionMenuOptions();
          };
          
          this.eventManager.on('ROUTE_CREATED', this._routeCreatedHandler, this);
          this.logManager.debug('Suscrito a evento ROUTE_CREATED');
        }
        
        // Suscribirse al evento de cancelación si aún no lo está
        if (!this._routeCancelledHandler) {
          this._routeCancelledHandler = () => {
            this.logManager.info('Creación de itinerario cancelada');
          };
          
          this.eventManager.on('ROUTE_CREATION_CANCELLED', this._routeCancelledHandler, this);
          this.logManager.debug('Suscrito a evento ROUTE_CREATION_CANCELLED');
        }
        
        // Suscribirse al evento de punto añadido si aún no lo está
        if (!this._routePointAddedHandler) {
          this._routePointAddedHandler = (data) => {
            this.logManager.debug(`Punto ${data.pointIndex + 1} añadido al itinerario`, {
              x: data.point.x,
              y: data.point.y,
              totalPoints: data.totalPoints
            });
          };
          
          this.eventManager.on('ROUTE_POINT_ADDED', this._routePointAddedHandler, this);
          this.logManager.debug('Suscrito a evento ROUTE_POINT_ADDED');
        }
        
      } catch (error) {
        this.logManager.error('Error al iniciar creación de itinerario', {
          error: error.message,
          stack: error.stack
        });
        this.showMessage('Error al iniciar la creación del itinerario');
      }
    });
    
    // Evento de iniciar procesión
    startProcessionOption.on('pointerdown', () => {
      menuContainer.setVisible(false);
      
      if (startProcessionOption.getData('disabled')) {
        // Mostrar un mensaje específico según la condición faltante
        if (!this.brotherhood) {
          this.showMessage('Primero debes crear una hermandad');
        } else if (!this.processionRoute || !this.processionRoute.points || this.processionRoute.points.length < 3) {
          this.showMessage('Primero debes crear un itinerario válido');
        } else if (this.isProcessionActive) {
          this.showMessage('Ya hay una procesión en curso');
        } else {
          this.showMessage('No se puede iniciar la procesión en este momento');
        }
        return;
      }
      
      this.startProcession();
    });
    
    // Evento de detener procesión
    stopProcessionOption.on('pointerdown', () => {
      menuContainer.setVisible(false);
      
      if (stopProcessionOption.getData('disabled')) {
        this.showMessage('No hay procesión que detener');
        return;
      }
      
      this.processionManager.cancelProcession();
      this.isProcessionActive = false;
      this.updateProcessionMenuOptions();
      this.showMessage('Procesión detenida');
    });
    
    // Efectos de hover
    [createRouteOption, startProcessionOption, stopProcessionOption].forEach(option => {
      option.on('pointerover', () => {
        if (!option.getData('disabled')) {
          option.setStyle({ backgroundColor: '#4a0000' });
        }
      });
      
      option.on('pointerout', () => {
        if (!option.getData('disabled')) {
          option.setStyle({ backgroundColor: null });
        } else {
          option.setStyle({ backgroundColor: null, fill: '#777777' });
        }
      });
    });
    
    // Guardar referencias
    this.processionMenu = {
      button: processionButton,
      container: menuContainer,
      createOption: createRouteOption,
      startOption: startProcessionOption,
      stopOption: stopProcessionOption
    };
    
    // Establecer estados iniciales
    this.updateProcessionMenuOptions();
    
    // Suscribirse a eventos del EventManager relacionados con procesiones
    this.eventManager.on('ROUTE_CREATED', (data) => {
      this.processionRoute = data.route;
      this.updateProcessionMenuOptions();
      this.showMessage('Itinerario creado correctamente');
    }, this);
    
    this.eventManager.on('PROCESSION_STARTED', () => {
      this.isProcessionActive = true;
      this.updateProcessionMenuOptions();
    }, this);
    
    this.eventManager.on('PROCESSION_COMPLETED', () => {
      this.isProcessionActive = false;
      this.updateProcessionMenuOptions();
      this.showMessage('Procesión finalizada');
    }, this);
    
    this.eventManager.on('PROCESSION_CANCELLED', () => {
      this.isProcessionActive = false;
      this.updateProcessionMenuOptions();
      this.showMessage('Procesión cancelada');
    }, this);
  }
  
  /**
   * Actualiza el estado de las opciones del menú de procesión según la situación actual
   */
  updateProcessionMenuOptions() {
    if (!this.processionMenu) return;
    
    const { createOption, startOption, stopOption } = this.processionMenu;
    
    // Determinar si hay una hermandad y si hay un itinerario válido
    const hasBrotherhood = !!this.brotherhood;
    
    // Corregir verificación: verificar si points existe y tiene suficientes puntos
    const hasValidRoute = !!(this.processionRoute && 
                           this.processionRoute.points && 
                           this.processionRoute.points.length >= 3);
    
    // Opciones para "Crear itinerario"
    createOption.setData('disabled', this.isProcessionActive || !hasBrotherhood);
    createOption.setTint((this.isProcessionActive || !hasBrotherhood) ? 0x777777 : 0xffffff);
    
    // Opciones para "Iniciar procesión"
    startOption.setData('disabled', this.isProcessionActive || !hasValidRoute || !this.brotherhood);
    startOption.setTint((this.isProcessionActive || !hasValidRoute || !this.brotherhood) ? 0x777777 : 0xffffff);
    
    // Opciones para "Detener procesión"
    stopOption.setData('disabled', !this.isProcessionActive);
    stopOption.setTint(!this.isProcessionActive ? 0x777777 : 0xffffff);
  }

  /**
   * Comprobar si toca evento de Semana Santa en el año actual
   * @param {number} year - Año actual
   */
  checkHolyWeekEvent(year) {
    // Ejemplo simple - cada 5 años es una Semana Santa importante
    const isSpecialYear = (year % 5 === 0);
    
    // Mostrar mensaje especial
    if (isSpecialYear) {
      this.showMessage(`¡Semana Santa del Año ${year}!`);
    }
  }

  /**
   * Maneja el evento cuando se selecciona "Iniciar Salida Penitencial" en el menú
   */
  startProcession() {
    try {
      // Log de inicio con información detallada
      this.logManager.info('Intentando iniciar procesión - INICIO DEL PROCESO', {
        isProcessionActive: this.isProcessionActive,
        hasBrotherhood: !!this.brotherhood,
        hasRoute: !!this.processionRoute,
        routeType: typeof this.processionRoute,
        routePointsType: this.processionRoute?.points ? typeof this.processionRoute.points : 'undefined',
        routePointsIsArray: Array.isArray(this.processionRoute?.points)
      });
      
      // Comprobamos si ya hay una procesión activa
      if (this.isProcessionActive) {
        this.logManager.warning('Intento de iniciar procesión con otra ya activa');
        this.showMessage('Ya hay una procesión en curso');
        return;
      }
      
      // Verificar si tenemos una hermandad y una ruta
      if (!this.brotherhood) {
        this.logManager.warning('Intento de iniciar procesión sin hermandad');
        this.showMessage('Primero debes crear una hermandad');
        return;
      }
      
      if (!this.processionRoute || !this.processionRoute.points || this.processionRoute.points.length < 3) {
        this.logManager.warning('Intento de iniciar procesión sin ruta válida', {
          hasRoute: !!this.processionRoute,
          pointsLength: this.processionRoute?.points?.length || 0
        });
        this.showMessage('Primero debes crear un itinerario válido');
        return;
      }
      
      // Verificar que tenemos las texturas necesarias
      const requiredTextures = ['cruz_guia', 'nazareno', 'paso_misterio', 'paso_gloria'];
      const missingTextures = requiredTextures.filter(texture => !this.textures.exists(texture));
      
      if (missingTextures.length > 0) {
        this.logManager.error('Faltan texturas necesarias para la procesión', {
          missingTextures: missingTextures
        });
        
        // Intentar crear texturas de respaldo si falta alguna
        missingTextures.forEach(texture => {
          this.createFallbackTexture(texture);
        });
        
        // Verificar nuevamente después de crear respaldos
        const stillMissing = requiredTextures.filter(texture => !this.textures.exists(texture));
        if (stillMissing.length > 0) {
          this.showMessage(`Error: No se pudieron cargar algunas texturas necesarias`);
          return;
        }
      }
      
      // Iniciar la procesión usando el ProcessionManager
      this.logManager.info('Iniciando procesión con el ProcessionManager', {
        brotherhood: this.brotherhood.name,
        routePoints: this.processionRoute.points.length
      });
      
      // Asegurar que processionRoute es un objeto completo con points
      // El ProcessionManager ahora puede manejar ambos formatos
      let success = false;
      
      try {
        success = this.processionManager.startProcession(this.brotherhood, this.processionRoute);
        
        this.logManager.debug('Resultado del intento de iniciar procesión', {
          success: success
        });
      } catch (error) {
        this.logManager.error('Excepción al llamar a processionManager.startProcession', {
          error: error.message,
          stack: error.stack
        });
        
        // Intento alternativo pasando los puntos directamente
        this.logManager.info('Intentando método alternativo pasando solo los puntos');
        try {
          success = this.processionManager.startProcession(this.brotherhood, this.processionRoute.points);
          
          this.logManager.debug('Resultado del intento alternativo', {
            success: success
          });
        } catch (secondError) {
          this.logManager.error('Excepción en el segundo intento', {
            error: secondError.message,
            stack: secondError.stack
          });
        }
      }
      
      if (success) {
        this.isProcessionActive = true;
        
        // Actualizar estado en el UI
        this.updateProcessionButtonState();
        
        // Mostrar mensaje de inicio
        this.showMessage(`¡La procesión de ${this.brotherhood.name} ha comenzado!`);
        
        this.logManager.info('Procesión iniciada correctamente');
      } else {
        this.logManager.error('Error al iniciar la procesión');
        this.showMessage('Error al iniciar la procesión. Revisa los logs para más información.');
        
        // Mostrar diagnóstico automático
        this.debugProcessionSystem();
      }
    } catch (error) {
      this.logManager.error('Error en startProcession', {
        error: error.message,
        stack: error.stack
      });
      this.showMessage('Error al iniciar la procesión. Revisa los logs para más información.');
    }
  }
  
  /**
   * Crea una textura de respaldo para elementos de procesión
   * @param {string} textureKey - Clave de la textura a crear
   * @private
   */
  createFallbackTexture(textureKey) {
    this.logManager.warning(`Creando textura de respaldo para ${textureKey}`);
    
    const graphics = this.add.graphics();
    
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
      
      this.logManager.info(`Textura de respaldo creada para ${textureKey}`);
    } catch (error) {
      this.logManager.error(`Error al crear textura de respaldo para ${textureKey}`, {
        error: error.message,
        stack: error.stack
      });
    } finally {
      graphics.destroy();
    }
  }

  /**
   * Actualiza el estado del botón de procesión en función del estado actual
   */
  updateProcessionButtonState() {
    const menuContainer = this.children.getByName('processionMenuContainer');
    if (!menuContainer) return;
    
    // Obtener opciones
    const createRouteOption = menuContainer.list.find(item => item.text && item.text.includes('Crear itinerario'));
    const startProcessionOption = menuContainer.list.find(item => item.text && item.text.includes('Iniciar Salida'));
    
    if (createRouteOption) {
      createRouteOption.setData('disabled', this.isProcessionActive);
      createRouteOption.setTint(this.isProcessionActive ? 0x888888 : 0xffffff);
    }
    
    if (startProcessionOption) {
      const hasValidRoute = this.processionRoute && this.processionRoute.length >= 3;
      startProcessionOption.setData('disabled', this.isProcessionActive || !hasValidRoute);
      startProcessionOption.setTint((this.isProcessionActive || !hasValidRoute) ? 0x888888 : 0xffffff);
    }
  }

  /**
   * Se ejecuta cuando la escena se detiene
   */
  shutdown() {
    try {
      // Guardar logs antes de cerrar
      if (this.logManager) {
        this.logManager.info('GameScene cerrándose');
        this.logManager.forceSave();
      }
      
      // Limpiar gestores y recursos
      if (this.eventManager) this.eventManager.destroy();
      if (this.routeManager) this.routeManager.destroy();
      if (this.processionManager) this.processionManager.destroy();
      if (this.logManager) this.logManager.destroy();
    } catch (error) {
      console.error('Error al cerrar GameScene:', error);
    }
  }

  /**
   * Crea un botón para probar el sistema de logs
   * @private
   */
  addLogTestButton() {
    // Crear botón en la esquina inferior derecha
    const logTestButton = this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      'Test Logs',
      {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(1, 1)
     .setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100);
    
    // Añadir eventos
    logTestButton.on('pointerdown', () => {
      this.testLogLevels();
    });
    
    logTestButton.on('pointerover', () => {
      logTestButton.setStyle({ backgroundColor: '#555555' });
    });
    
    logTestButton.on('pointerout', () => {
      logTestButton.setStyle({ backgroundColor: '#333333' });
    });
    
    // Añadir botón de diagnóstico de procesiones
    this.addProcessionDebugButton();
    
    return logTestButton;
  }
  
  /**
   * Añade un botón para diagnóstico específico de procesiones
   * @private
   */
  addProcessionDebugButton() {
    // Crear botón junto al de logs
    const debugButton = this.add.text(
      this.cameras.main.width - 150,
      this.cameras.main.height - 20,
      'Debug Procesión',
      {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#8B0000',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(1, 1)
     .setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100)
     .setName('processionDebugButton')
     .setData('isUI', true);
    
    // Añadir eventos
    debugButton.on('pointerdown', () => {
      this.debugProcessionSystem();
    });
    
    debugButton.on('pointerover', () => {
      debugButton.setStyle({ backgroundColor: '#aa0000' });
    });
    
    debugButton.on('pointerout', () => {
      debugButton.setStyle({ backgroundColor: '#8B0000' });
    });
    
    return debugButton;
  }
  
  /**
   * Realiza diagnóstico del sistema de procesiones y activa un modo de depuración temporal
   * @private
   */
  debugProcessionSystem() {
    this.logManager.info('===== INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA DE PROCESIONES =====');
    
    // Comprobar si hay una hermandad
    if (!this.brotherhood) {
      this.showMessage('ERROR: No hay hermandad creada.');
      this.logManager.error('Diagnóstico de procesión: no hay hermandad creada');
      return;
    }
    
    // Comprobar estado del RouteManager
    this.logManager.info('Estado actual del RouteManager', {
      isCreatingRoute: this.routeManager.isCreatingRouteActive(),
      routePointsInManager: this.routeManager.routePoints?.length || 0,
      brotherhoodInManager: this.routeManager.currentBrotherhood?.name || 'No definida'
    });
    
    // Comprobar si hay una ruta en GameScene
    this.logManager.info('Estado de la ruta en GameScene', {
      processionRouteExists: !!this.processionRoute,
      isObject: typeof this.processionRoute === 'object',
      hasPointsProperty: this.processionRoute ? 'points' in this.processionRoute : false,
      pointsIsArray: this.processionRoute?.points instanceof Array,
      pointsLength: this.processionRoute?.points?.length || 0,
      routeRawValue: JSON.stringify(this.processionRoute).substring(0, 200) // Limitar longitud
    });
    
    // Si no hay ruta, mostrar mensaje y terminar
    if (!this.processionRoute) {
      this.showMessage('ERROR: No hay itinerario creado.');
      this.logManager.error('Diagnóstico de procesión: no hay itinerario creado', {
        hasBrotherhood: true,
        brotherhoodName: this.brotherhood.name,
        creatingRoute: this.routeManager.isCreatingRouteActive()
      });
      
      // Mostrar información de depuración sobre el proceso de creación de rutas
      const createOption = this.findCreateRouteOptionInMenu();
      if (createOption) {
        this.logManager.info('Estado del botón "Crear itinerario"', {
          disabled: createOption.getData('disabled'),
          visible: createOption.visible,
          text: createOption.text
        });
      } else {
        this.logManager.warning('No se encontró el botón "Crear itinerario" en el menú');
      }
      
      // Verificar eventos relacionados con rutas
      this.logManager.info('Verificando suscripciones a eventos de ruta');
      
      // Verificar suscripciones indirectamente a través de los handlers que hemos definido
      const hasCreatedHandler = !!this._routeCreatedHandler;
      const hasCancelledHandler = !!this._routeCancelledHandler;
      const hasPointAddedHandler = !!this._routePointAddedHandler;
      
      this.logManager.debug(`Evento ROUTE_CREATED: ${hasCreatedHandler ? 'tiene suscriptor' : 'sin suscriptor'}`);
      this.logManager.debug(`Evento ROUTE_CREATION_CANCELLED: ${hasCancelledHandler ? 'tiene suscriptor' : 'sin suscriptor'}`);
      this.logManager.debug(`Evento ROUTE_POINT_ADDED: ${hasPointAddedHandler ? 'tiene suscriptor' : 'sin suscriptor'}`);
      
      // Sugerir solución
      this.logManager.info('SUGERENCIA: Intenta crear un nuevo itinerario seleccionando "Crear itinerario" en el menú de Salida Penitencial');
      return;
    }
    
    // Loguear información sobre la hermandad y la ruta
    this.logManager.info('Estado actual del sistema de procesiones', {
      hermandad: {
        nombre: this.brotherhood.name,
        id: this.brotherhood.id,
        fundacion: this.brotherhood.foundingYear,
        sede: this.brotherhood.headquarters ? `(${this.brotherhood.headquarters.x}, ${this.brotherhood.headquarters.y})` : 'No definida'
      },
      ruta: {
        id: this.processionRoute.id,
        puntos: this.processionRoute.points.length,
        creada: this.processionRoute.created,
        brotherhood: this.processionRoute.brotherhood
      },
      estado: {
        isCreatingRoute: this.routeManager.isCreatingRouteActive(),
        isProcessionActive: this.isProcessionActive,
        currentTime: this.timeManager ? this.timeManager.getCurrentDate() : 'N/A'
      }
    });
    
    // Comprobación de assets necesarios para la procesión
    const requiredAssets = ['cruz_guia', 'nazareno', 'paso_misterio', 'paso_gloria'];
    const missingAssets = requiredAssets.filter(asset => !this.textures.exists(asset));
    
    if (missingAssets.length > 0) {
      this.logManager.error('Faltan texturas requeridas para la procesión', {
        missingAssets: missingAssets
      });
      this.showMessage(`ERROR: Faltan texturas: ${missingAssets.join(', ')}`);
    }
    
    // Verificar compatibilidad de la ruta con ProcessionManager
    this.checkRouteCompatibility();
    
    // Activar modo debug para visualizar los puntos de la ruta
    this.drawDebugRoutePoints();
    
    // Mostrar panel informativo
    this.createDebugInfoPanel();
    
    this.logManager.info('===== DIAGNÓSTICO DE PROCESIÓN COMPLETADO =====');
    this.showMessage('Diagnóstico completado. Los resultados están en los logs.');
  }
  
  /**
   * Verifica la compatibilidad de la ruta con el ProcessionManager
   * @private
   */
  checkRouteCompatibility() {
    // Verificar si la ruta tiene el formato esperado por ProcessionManager
    const processManagerExpectsArray = true; // Si ProcessionManager espera un array directo o un objeto con points
    
    if (processManagerExpectsArray && this.processionRoute.points) {
      this.logManager.warning('Posible incompatibilidad de formato: ProcessionManager espera array, pero processionRoute tiene estructura {id, points, ...}', {
        suggestion: 'Asegúrate de pasar processionRoute.points a ProcessionManager o ajustar ProcessionManager para aceptar el objeto completo'
      });
    }
    
    // Verificar si la ruta comienza y termina en la sede
    if (this.processionRoute.points && this.processionRoute.points.length >= 2 && this.brotherhood.headquarters) {
      const firstPoint = this.processionRoute.points[0];
      const lastPoint = this.processionRoute.points[this.processionRoute.points.length - 1];
      const hq = this.brotherhood.headquarters;
      
      const firstDistance = Phaser.Math.Distance.Between(firstPoint.x, firstPoint.y, hq.x, hq.y);
      const lastDistance = Phaser.Math.Distance.Between(lastPoint.x, lastPoint.y, hq.x, hq.y);
      
      if (firstDistance > 50 || lastDistance > 50) {
        this.logManager.warning('La ruta no comienza o no termina en la sede de la hermandad', {
          firstPointDistance: firstDistance,
          lastPointDistance: lastDistance,
          maxAllowedDistance: 50
        });
      }
    }
  }
  
  /**
   * Encuentra la opción de crear itinerario en el menú
   * @returns {Phaser.GameObjects.Text|null} La opción de menú o null si no se encuentra
   * @private
   */
  findCreateRouteOptionInMenu() {
    if (!this.processionMenu || !this.processionMenu.container) return null;
    
    return this.processionMenu.container.list.find(item => 
      item.text && item.text.includes('Crear itinerario')
    );
  }
  
  /**
   * Dibuja marcadores de depuración para los puntos de la ruta actual
   * @private
   */
  drawDebugRoutePoints() {
    // Limpiar marcadores previos
    const previousMarkers = this.children.getAll().filter(obj => obj.name && obj.name.startsWith('debug_route_point_'));
    previousMarkers.forEach(marker => marker.destroy());
    
    if (!this.processionRoute || !this.processionRoute.points) {
      this.logManager.warning('No hay puntos de ruta para dibujar marcadores de depuración');
      return;
    }
    
    // Crear un grupo para los marcadores
    const debugPointsGraphics = this.add.graphics();
    debugPointsGraphics.setName('debug_route_graphics');
    
    // Dibujar la línea principal de la ruta
    debugPointsGraphics.lineStyle(5, 0xff00ff, 0.7);
    debugPointsGraphics.moveTo(this.processionRoute.points[0].x, this.processionRoute.points[0].y);
    
    // Dibujar marcadores para cada punto
    this.processionRoute.points.forEach((point, index) => {
      // Dibujar línea
      if (index > 0) {
        debugPointsGraphics.lineTo(point.x, point.y);
      }
      
      // Círculo para el punto
      debugPointsGraphics.fillStyle(0xff00ff, 0.8);
      debugPointsGraphics.fillCircle(point.x, point.y, 8);
      
      // Añadir texto con el número del punto
      const pointText = this.add.text(point.x, point.y, `${index + 1}`, {
        font: 'bold 14px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5)
        .setDepth(100)
        .setName(`debug_route_point_${index}`);
    });
    
    // Programar eliminación automática después de 30 segundos
    this.time.delayedCall(30000, () => {
      if (debugPointsGraphics) debugPointsGraphics.destroy();
      const markers = this.children.getAll().filter(obj => obj.name && obj.name.startsWith('debug_route_point_'));
      markers.forEach(marker => marker.destroy());
      if (this.debugInfoPanel) this.debugInfoPanel.destroy();
    });
    
    this.logManager.info(`Dibujados ${this.processionRoute.points.length} puntos de depuración para la ruta`);
  }
  
  /**
   * Crea un panel informativo con datos de depuración
   * @private
   */
  createDebugInfoPanel() {
    // Eliminar panel previo si existe
    if (this.debugInfoPanel) this.debugInfoPanel.destroy();
    
    // Crear contenedor para el panel
    this.debugInfoPanel = this.add.container(20, 100);
    this.debugInfoPanel.setScrollFactor(0);
    this.debugInfoPanel.setDepth(100);
    
    // Fondo del panel
    const bg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0xff00ff);
    this.debugInfoPanel.add(bg);
    
    // Título del panel
    const title = this.add.text(10, 10, 'DIAGNÓSTICO DE PROCESIÓN', {
      font: 'bold 16px Arial',
      fill: '#ffffff'
    });
    this.debugInfoPanel.add(title);
    
    // Información sobre la hermandad
    const brotherhoodInfo = this.add.text(10, 40, `Hermandad: ${this.brotherhood?.name || 'N/A'}`, {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.debugInfoPanel.add(brotherhoodInfo);
    
    // Información sobre la ruta
    const routeInfo = this.add.text(10, 70, 
      `Ruta: ${this.processionRoute?.points?.length || 0} puntos\n` +
      `Inicio: (${this.processionRoute?.points[0]?.x.toFixed(0) || '?'}, ${this.processionRoute?.points[0]?.y.toFixed(0) || '?'})\n` +
      `Fin: (${this.processionRoute?.points[this.processionRoute?.points.length-1]?.x.toFixed(0) || '?'}, ${this.processionRoute?.points[this.processionRoute?.points.length-1]?.y.toFixed(0) || '?'})`, 
      {
        font: '14px Arial',
        fill: '#ffffff'
      }
    );
    this.debugInfoPanel.add(routeInfo);
    
    // Estado de procesión
    const processionState = this.add.text(10, 130, 
      `Estado procesión: ${this.isProcessionActive ? 'ACTIVA' : 'INACTIVA'}\n` +
      `Depuración activada: TEMPORAL (30s)`, 
      {
        font: '14px Arial',
        fill: this.isProcessionActive ? '#00ff00' : '#ffffff'
      }
    );
    this.debugInfoPanel.add(processionState);
    
    // Actualizar la información cada segundo
    this.debugUpdateEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateDebugInfo,
      callbackScope: this,
      loop: true
    });
    
    // Eliminar después de 30 segundos
    this.time.delayedCall(30000, () => {
      if (this.debugUpdateEvent) this.debugUpdateEvent.remove();
      if (this.debugInfoPanel) this.debugInfoPanel.destroy();
      this.debugInfoPanel = null;
    });
  }
  
  /**
   * Actualiza la información del panel de depuración
   * @private
   */
  updateDebugInfo() {
    if (!this.debugInfoPanel) return;
    
    // Buscar y actualizar el texto de estado de procesión
    const stateText = this.debugInfoPanel.list.find(item => 
      item.text && item.text.includes('Estado procesión')
    );
    
    if (stateText) {
      stateText.setText(
        `Estado procesión: ${this.isProcessionActive ? 'ACTIVA' : 'INACTIVA'}\n` +
        `Tiempo restante debug: ${Math.ceil((30000 - this.debugUpdateEvent.getElapsed()) / 1000)}s`
      );
      stateText.setFill(this.isProcessionActive ? '#00ff00' : '#ffffff');
    }
  }

  /**
   * Prueba los diferentes niveles de log
   * @private
   */
  testLogLevels() {
    if (!this.logManager) return;
    
    this.logManager.debug('Mensaje de prueba DEBUG', { timeStamp: Date.now() });
    this.logManager.info('Mensaje de prueba INFO', { timeStamp: Date.now() });
    this.logManager.warning('Mensaje de prueba WARNING', { timeStamp: Date.now() });
    this.logManager.error('Mensaje de prueba ERROR', { timeStamp: Date.now(), extraInfo: 'Información adicional' });
    
    // Preguntar si se desea simular un error fatal
    if (confirm('¿Deseas simular un error fatal para probar la generación de logs?')) {
      this.logManager.simulateError('Error fatal simulado desde testLogLevels');
    } else {
      try {
        // Provocar un error para probar la captura de excepciones
        const obj = null;
        obj.nonExistingMethod();
      } catch (error) {
        this.logManager.error('Error controlado en testLogLevels', error);
      }
    }
    
    // Mostrar mensaje informativo
    this.showMessage('Logs de prueba generados. Revisar consola.');
    
    // Forzar guardado de logs a archivo
    this.logManager.forceSave();
  }

  /**
   * Comprueba si un clic fue realizado sobre un elemento de UI
   * @param {Phaser.Input.Pointer} pointer - El puntero que generó el evento
   * @returns {boolean} - True si el clic fue sobre un elemento de UI
   * @private
   */
  isClickOnUI(pointer) {
    try {
      // Verificar si hay algún objeto interactivo en esta posición
      const objects = this.input.hitTestPointer(pointer);
      
      // Log detallado para depurar problemas de detección de UI
      this.logManager.debug('isClickOnUI - detección iniciada', {
        pointerX: pointer.x,
        pointerY: pointer.y,
        objectsCount: objects.length,
        isCreatingRoute: this.routeManager?.isCreatingRouteActive() || false
      });
      
      if (objects.length > 0) {
        // Log de todos los objetos encontrados para depuración
        objects.forEach((obj, index) => {
          if (index < 5) { // Limitar a 5 objetos para no sobrecargar los logs
            this.logManager.debug(`Objeto ${index + 1} en posición de clic`, {
              name: obj.name || 'sin nombre',
              type: obj.type || (obj.constructor ? obj.constructor.name : 'desconocido'),
              isUI: obj.getData ? obj.getData('isUI') : undefined,
              interactive: obj.input ? obj.input.enabled : false
            });
          }
        });
      }
      
      // Comprobar si alguno de los objetos tiene la propiedad isUI
      const isUI = objects.some(obj => obj.getData && obj.getData('isUI') === true);
      
      // Verificar si el clic está en la región de la interfaz de procesión (panel lateral)
      const isInProcessionPanel = this.debugInfoPanel && 
                                 pointer.x < 320 && 
                                 pointer.y > 100 && 
                                 pointer.y < 300;
      
      // Verificar si está en el área del panel de creación de itinerario
      // Solo considerar esta área si NO estamos creando una ruta activamente
      const isCreatingRoute = this.routeManager?.isCreatingRouteActive() || false;
      const isInRoutePanel = !isCreatingRoute && 
                            pointer.x > (this.cameras.main.width - 300) && 
                            pointer.y > (this.cameras.main.height - 200);
      
      // Verificar si está en el área de los controles de navegación
      const isInNavigationControls = pointer.x < 150 && pointer.y < 100;
      
      // Resultado combinado
      const result = isUI || isInProcessionPanel || isInRoutePanel || isInNavigationControls;
      
      if (result) {
        this.logManager.debug('Clic considerado en UI', {
          isUI: isUI,
          isInProcessionPanel: isInProcessionPanel,
          isInRoutePanel: isInRoutePanel,
          isInNavigationControls: isInNavigationControls,
          isCreatingRoute: isCreatingRoute
        });
      } else {
        this.logManager.debug('Clic considerado en mapa (no UI)');
      }
      
      return result;
    } catch (error) {
      this.logManager.error('Error en isClickOnUI', {
        error: error.message,
        stack: error.stack
      });
      return false; // En caso de error, asumimos que no es UI para permitir la interacción
    }
  }
} 
import Brotherhood from '../entities/Brotherhood.js';
import Nazareno from '../entities/Nazareno.js';
import Paso from '../entities/Paso.js';
import TimeManager from '../managers/TimeManager.js';

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
    this.isCreatingBrotherhood = false;
    this.nazarenos = [];
    this.pasos = [];
    this.formUI = null;
  }

  /**
   * Inicializa la escena con datos recibidos
   * @param {Object} data - Datos de inicialización
   */
  init(data) {
    // Corregimos la inicialización por defecto de isNewGame
    this.isNewGame = data.newGame !== undefined ? data.newGame : true;
    this.savedData = data.savedData || null;
    
    console.log("GameScene iniciada con:", { isNewGame: this.isNewGame, hasSavedData: !!this.savedData });
  }

  /**
   * Crea todos los elementos de la escena
   */
  create() {
    // Crear el mapa de Sevilla
    this.createMap();
    
    // Configurar cámara y controles
    this.setupCamera();
    
    // Crear UI básica
    this.createUI();
    
    // Inicializar gestor de tiempo
    this.timeManager = new TimeManager(this);
    
    // Registrar callback para eventos de Semana Santa
    this.timeManager.onTimeChange(this.checkHolyWeekEvent.bind(this));
    
    // Si es partida nueva, mostrar formulario para crear hermandad
    if (this.isNewGame) {
      this.showBrotherhoodForm();
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
  }

  /**
   * Actualiza la escena en cada frame
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo desde el último frame
   */
  update(time, delta) {
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
  }
  
  /**
   * Habilita la funcionalidad de arrastrar el mapa con el ratón
   */
  enableMapDrag() {
    this.isDragging = false;
    
    // Inicio del arrastre
    this.input.on('pointerdown', (pointer) => {
      // Solo iniciar el arrastre si no estamos en modo de creación de hermandad
      if (!this.isCreatingBrotherhood) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    // Movimiento durante el arrastre
    this.input.on('pointermove', (pointer) => {
      if (this.isDragging) {
        // Calcular la distancia movida
        const deltaX = this.dragStartX - pointer.x;
        const deltaY = this.dragStartY - pointer.y;
        
        // Mover la cámara
        this.cameras.main.scrollX += deltaX / this.cameras.main.zoom;
        this.cameras.main.scrollY += deltaY / this.cameras.main.zoom;
        
        // Actualizar la posición inicial para el siguiente movimiento
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
    
    // Fin del arrastre
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
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
    ).setScrollFactor(0);
    
    // Botones de dirección
    const upButton = this.createNavButton(70, height - 140, '⬆️');
    const downButton = this.createNavButton(70, height - 60, '⬇️');
    const leftButton = this.createNavButton(30, height - 100, '⬅️');
    const rightButton = this.createNavButton(110, height - 100, '➡️');
    
    // Botón central (restablecer posición)
    const centerButton = this.createNavButton(70, height - 100, '⦿', '#800000');
    
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
   * @returns {Phaser.GameObjects.Text} - El botón creado
   */
  createNavButton(x, y, text, color = '#1a237e') {
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
      .setInteractive({ useHandCursor: true });
    
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
    ).setScrollFactor(0);
    
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
      .setInteractive({ useHandCursor: true });
    
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
      .setInteractive({ useHandCursor: true });
    
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
      .setScrollFactor(0);
    
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
   * Aumenta el nivel de zoom
   */
  increaseZoom() {
    const zoom = this.cameras.main.zoom;
    if (zoom < 2.0) {
      this.cameras.main.zoom += 0.1;
      this.updateZoomText();
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
    }
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
   * Crea la interfaz de usuario básica
   */
  createUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Panel superior - expandido para dar más espacio
    const topPanel = this.add.rectangle(0, 0, width, 50, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    
    // Texto año actual - ajustado a la izquierda
    this.yearText = this.add.text(20, 15, 'Año: 1550', {
      font: '18px Arial',
      fill: '#ffffff'
    }).setScrollFactor(0);
    
    // Reorganización de botones con mejor distribución
    // Botón para avanzar tiempo - centrado
    const advanceTimeButton = this.add.text(width / 2 - 60, 15, 'Avanzar 10 años', {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#1a237e',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
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
      .setInteractive({ useHandCursor: true });
    
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
    ).setScrollFactor(0).setOrigin(0.5);
    
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
    ).setScrollFactor(0).setOrigin(0.5, 0);
    
    // Textos de diagnóstico
    const diagText1 = this.add.text(
      20,
      70,
      'Estado: Juego Phaser inicializado correctamente',
      { font: '12px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    const diagText2 = this.add.text(
      20,
      90,
      'Phaser: v3.55.2 cargado correctamente',
      { font: '12px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
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
    this.isCreatingBrotherhood = true;
    
    // Fondo semi-transparente
    const formBackground = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      500,
      0x222222,
      0.9
    ).setScrollFactor(0);
    
    // Título del formulario
    const formTitle = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 220,
      'CREAR NUEVA HERMANDAD',
      {
        font: 'bold 20px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5).setScrollFactor(0);
    
    // Variables para almacenar los datos del formulario
    let hermandadData = {
      name: 'Hermandad Nueva',
      foundingDate: 1550,
      habitColor: 'purple', // Valor por defecto
      headquarters: { x: 400, y: 300 },
      isValid: false // Flag para validación
    };
    
    // Campo de nombre
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 170,
      'Nombre:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    // Campo para introducir el nombre
    const nameInput = this.add.text(
      this.cameras.main.width / 2 - 80,
      this.cameras.main.height / 2 - 170,
      hermandadData.name,
      { font: '16px Arial', fill: '#ffff00', backgroundColor: '#333344', padding: { x: 10, y: 5 } }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
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
    ).setScrollFactor(0);
    
    const yearValue = this.add.text(
      this.cameras.main.width / 2 + 30,
      this.cameras.main.height / 2 - 110,
      hermandadData.foundingDate.toString(),
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0);
    
    // Botones para ajustar el año
    const decreaseYearBtn = this.add.text(
      this.cameras.main.width / 2 - 20,
      this.cameras.main.height / 2 - 110,
      '◀',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    const increaseYearBtn = this.add.text(
      this.cameras.main.width / 2 + 90,
      this.cameras.main.height / 2 - 110,
      '▶',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
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
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 50,
      'Color del hábito:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
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
        .setInteractive({ useHandCursor: true });
      
      // Texto del color
      const colorText = this.add.text(xPos + 40, yPos, color.name, 
        { font: '14px Arial', fill: '#cccccc' }
      ).setScrollFactor(0);
      
      // Marca de selección (inicialmente invisible excepto para el primero)
      const selected = this.add.text(xPos - 15, yPos, '✓', 
        { font: '16px Arial', fill: '#ffffff' }
      ).setScrollFactor(0)
        .setVisible(color.value === hermandadData.habitColor);
      
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
    ).setScrollFactor(0);
    
    const locationText = this.add.text(
      this.cameras.main.width / 2 - 90,
      this.cameras.main.height / 2 + 70,
      'Selecciona en el mapa',
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0);
    
    // Estado de validación (inicialmente invisible)
    const validationText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 150,
      'Selecciona la ubicación para continuar',
      { font: '14px Arial', fill: '#ff6666', align: 'center' }
    ).setOrigin(0.5, 0).setScrollFactor(0);
    
    // Instrucciones para seleccionar en el mapa
    const mapInstructions = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 110,
      'Haz clic en el mapa para elegir ubicación',
      { font: '14px Arial', fill: '#aaaaaa', align: 'center' }
    ).setOrigin(0.5, 0).setScrollFactor(0);
    
    // Marcador de posición en el mapa (inicialmente invisible)
    const locationMarker = this.add.circle(0, 0, 15, 0xff0000)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(false);
    
    // Efecto de resplandor para ayudar a visualizar el marcador
    const locationGlow = this.add.circle(0, 0, 20, 0xff0000, 0.4)
      .setVisible(false);
    
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
    ).setOrigin(0.5).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
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
        formBackground, formTitle, nameInput, yearLabel, yearValue, 
        decreaseYearBtn, increaseYearBtn, mapInstructions, validationText,
        locationLabel, locationText, locationMarker, locationGlow,
        ...colorOptions, ...colorTexts, ...colorSamples, createButton
      ];
      
      // Verificar que cada elemento existe antes de destruirlo
      allFormElements.forEach(element => {
        if (element && !element.destroyed) {
          element.destroy();
        }
      });
      
      // Asegurarse de que la escucha de eventos del mapa para selección de ubicación sea cancelada
      this.input.off('pointerdown');
      
      // Crear una interfaz informativa para la hermandad
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
    const width = this.cameras.main.width;
    
    // Panel de información de la hermandad (esquina superior derecha)
    // Reposicionado para evitar solapar con otros elementos
    const infoPanelBg = this.add.rectangle(
      width - 150,
      140,
      260,
      160,
      0x000000,
      0.7
    ).setScrollFactor(0).setOrigin(0.5, 0.5);
    
    // Título "Información de la Hermandad"
    const titleText = this.add.text(
      width - 150,
      70,
      'HERMANDAD',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 10, y: 5 }
      }
    ).setScrollFactor(0).setOrigin(0.5, 0);
    
    // Información de la hermandad - ajustada para nueva posición
    const nameText = this.add.text(
      width - 260,
      100,
      `Nombre: ${brotherhood.name}`,
      { font: '14px Arial', fill: '#ffffff' }
    ).setScrollFactor(0).setOrigin(0, 0);
    
    const fundingText = this.add.text(
      width - 260,
      125,
      `Fundación: ${brotherhood.foundingDate}`,
      { font: '14px Arial', fill: '#ffffff' }
    ).setScrollFactor(0).setOrigin(0, 0);
    
    // Mostrar muestra del color del hábito
    const habitText = this.add.text(
      width - 260,
      150,
      'Hábito:',
      { font: '14px Arial', fill: '#ffffff' }
    ).setScrollFactor(0).setOrigin(0, 0);
    
    // Determinar el color hexadecimal basado en habitSpriteKey
    let colorHex = 0x800080; // Morado por defecto
    switch(brotherhood.habitSpriteKey) {
      case 'purple': colorHex = 0x800080; break;
      case 'black': colorHex = 0x000000; break;
      case 'white': colorHex = 0xffffff; break;
      case 'red': colorHex = 0xff0000; break;
      case 'green': colorHex = 0x008800; break;
      case 'blue': colorHex = 0x0000ff; break;
    }
    
    // Muestra del color
    const colorSample = this.add.rectangle(
      width - 180,
      157,
      40,
      20,
      colorHex
    ).setScrollFactor(0).setStrokeStyle(1, 0xffffff);
    
    // Botón para centrar en la sede
    const centerButton = this.add.text(
      width - 150,
      185,
      'Ir a sede',
      {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#800000',
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0).setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
      
    centerButton.on('pointerdown', () => {
      if (brotherhood.headquarters) {
        this.cameras.main.pan(
          brotherhood.headquarters.x,
          brotherhood.headquarters.y,
          500,
          'Power2'
        );
      }
    });
    
    // Efecto hover para el botón
    centerButton.on('pointerover', () => {
      centerButton.setStyle({ backgroundColor: '#b71c1c' });
    });
    
    centerButton.on('pointerout', () => {
      centerButton.setStyle({ backgroundColor: '#800000' });
    });
    
    // Guardar referencia a estos elementos para poder actualizarlos
    this.brotherhoodInterface = {
      panel: infoPanelBg,
      title: titleText,
      name: nameText,
      funding: fundingText,
      habitLabel: habitText,
      habitColor: colorSample,
      centerButton: centerButton
    };
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
          update: () => {}, // Función vacía para mantener la compatibilidad
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
        update: () => {}, // Función vacía para mantener la compatibilidad
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
      .setInteractive({ useHandCursor: true });
    
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
      
    } catch (e) {
      console.error('Error al cargar partida:', e);
      this.showMessage('Error al cargar la partida');
    }
  }
  
  /**
   * Muestra un mensaje temporal en pantalla
   * @param {string} text - Texto a mostrar
   */
  showMessage(text) {
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
   * Añade un botón para activar la Salida Penitencial (solo para pruebas)
   */
  createProcessionButton() {
    const processionButton = this.add.text(
      this.cameras.main.width / 2 + 100,
      15,
      'Salida Penitencial',
      {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#8B0000', // Rojo oscuro
        padding: { x: 8, y: 4 }
      }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    processionButton.on('pointerdown', () => {
      this.startHolyWeekProcession();
    });
  }
  
  /**
   * Verifica si es Semana Santa y debe iniciarse una procesión
   * @param {number} year - Año actual
   * @param {Array} events - Eventos generados
   */
  checkHolyWeekEvent(year, events) {
    // En una versión más avanzada, aquí se calcularía si es Semana Santa
    // basado en el año (fecha móvil)
    
    // Por ahora, solo mostramos información del año
    console.log(`Año cambiado a: ${year}`);
    
    // Una posibilidad es tener una probabilidad baja de que ocurra
    // automáticamente el evento de Salida Penitencial
    if (Math.random() < 0.02) { // 2% de probabilidad al cambiar de año
      this.startHolyWeekProcession();
    }
  }
  
  /**
   * Inicia la Salida Penitencial de la hermandad
   */
  startHolyWeekProcession() {
    if (!this.brotherhood) {
      this.showMessage('No hay hermandad para procesionar');
      return;
    }
    
    // Verificar si ya hay una procesión en curso
    if (this.nazarenos.length > 0 || this.pasos.length > 0) {
      this.showMessage('La procesión ya está en curso');
      return;
    }
    
    // Mostrar mensaje de inicio
    this.showMessage(`¡Salida Penitencial de ${this.brotherhood.name}!`);
    
    // Crear nazarenos y pasos para la procesión
    this.createNazarenos();
    this.createPasos();
    
    // Aquí se podría añadir lógica para iniciar la ruta de la procesión
    // Por ejemplo: this.startProcessionRoute();
  }
  
  /**
   * Genera un evento de Salida Penitencial para la hermandad
   * @returns {Object} Evento generado
   */
  generateProcessionEvent() {
    const currentYear = window.gameData.currentYear || this.timeManager.currentYear;
    
    return {
      id: 'procession_' + currentYear,
      type: 'Salida Penitencial',
      description: `Estación de penitencia de ${this.brotherhood.name}`,
      year: currentYear,
      brotherhood: this.brotherhood.name
    };
  }
} 
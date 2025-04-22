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
    this.isNewGame = data.newGame || true;
    this.savedData = data.savedData || null;
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
    
    // Si es partida nueva, mostrar formulario para crear hermandad
    if (this.isNewGame) {
      this.showBrotherhoodForm();
    } else if (this.savedData) {
      // Cargar datos guardados
      this.loadSavedGame(this.savedData);
    }
    
    // Crear controlador de audio
    this.setupAudio();
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
    // Crear mapa desde el tilemap
    this.map = this.make.tilemap({ key: 'sevilla' });
    const tileset = this.map.addTilesetImage('sevilla_tileset', 'tiles');
    
    // Crear capas
    const backgroundLayer = this.map.createLayer('fondo', tileset, 0, 0);
    const buildingsLayer = this.map.createLayer('edificios', tileset, 0, 0);
    const streetsLayer = this.map.createLayer('calles', tileset, 0, 0);
    const routesLayer = this.map.createLayer('rutas', tileset, 0, 0);
    
    // Configurar colisiones si es necesario
    buildingsLayer.setCollisionByProperty({ collides: true });
  }
  
  /**
   * Configura la cámara y los controles de zoom/pan
   */
  setupCamera() {
    // Configurar límites de la cámara
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    
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
        const zoom = this.cameras.main.zoom;
        if (zoom > 0.5) {
          this.cameras.main.zoom -= 0.1;
        }
      } else {
        const zoom = this.cameras.main.zoom;
        if (zoom < 2.0) {
          this.cameras.main.zoom += 0.1;
        }
      }
    });
  }
  
  /**
   * Crea la interfaz de usuario básica
   */
  createUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Panel superior
    const topPanel = this.add.rectangle(0, 0, width, 50, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    
    // Texto año actual
    this.yearText = this.add.text(10, 10, 'Año: 1550', {
      font: '18px Arial',
      fill: '#ffffff'
    }).setScrollFactor(0);
    
    // Botones de control
    const saveButton = this.add.text(width - 100, 10, 'Guardar', {
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
    
    // Botón para avanzar tiempo
    const advanceTimeButton = this.add.text(width - 250, 10, 'Avanzar 10 años', {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#1a237e',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    advanceTimeButton.on('pointerdown', () => {
      this.timeManager.advance(10);
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
    
    // Aquí iría el código para los campos del formulario
    // Campo de nombre
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 170,
      'Nombre:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    // Fecha de fundación (slider)
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 110,
      'Fecha de fundación: 1550',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    // Selección de hábito
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 - 50,
      'Hábito:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    // Ubicación
    this.add.text(
      this.cameras.main.width / 2 - 180,
      this.cameras.main.height / 2 + 70,
      'Ubicación: Haga clic en el mapa',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0);
    
    // Botón para crear la hermandad
    const createButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 200,
      'CREAR',
      {
        font: 'bold 18px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    
    createButton.on('pointerdown', () => {
      // Aquí se recogerían los datos del formulario
      // y se crearía la hermandad
      
      // Ejemplo:
      const brotherhood = new Brotherhood({
        name: 'Hermandad de Ejemplo',
        foundingDate: 1550,
        habitSpriteKey: 'nazarenos',
        headquarters: { x: 400, y: 300 }
      });
      
      // Guardar hermandad en el juego
      this.brotherhood = brotherhood;
      window.gameData.brotherhood = brotherhood;
      
      // Cerrar el formulario
      this.isCreatingBrotherhood = false;
      formBackground.destroy();
      formTitle.destroy();
      createButton.destroy();
      
      // Crear nazarenos y pasos
      this.createNazarenos();
      this.createPasos();
    });
  }
  
  /**
   * Crea los nazarenos para la hermandad actual
   */
  createNazarenos() {
    if (!this.brotherhood) return;
    
    // Crear varios nazarenos a modo de ejemplo
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
  
  /**
   * Crea los pasos para la hermandad actual
   */
  createPasos() {
    if (!this.brotherhood) return;
    
    // Crear paso de ejemplo
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
  
  /**
   * Configura el sistema de audio para las marchas procesionales
   */
  setupAudio() {
    // Botón de control de audio
    const audioButton = this.add.text(
      this.cameras.main.width - 350,
      10,
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
} 
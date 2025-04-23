/**
 * Escena de carga inicial que precarga todos los assets
 * @class BootScene
 * @extends Phaser.Scene
 */
export default class BootScene extends Phaser.Scene {
  /**
   * Constructor de la escena
   */
  constructor() {
    super({ key: 'BootScene' });
  }

  /**
   * Precarga de recursos del juego
   */
  preload() {
    // Cargar la imagen de fondo
    this.load.image('pantalla_fondo', 'assets/images/Pantalla_fondo.png');
    
    // Intentar cargar el plano de Sevilla como imagen
    // Nota: Los PDF no se pueden cargar directamente, se necesita convertir a PNG
    try {
      this.load.image('plano-sevilla-img', 'assets/images/sevilla_map.png');
    } catch (e) {
      console.warn("No se pudo cargar el plano de Sevilla como imagen.");
    }
    
    // Añadir la imagen de fondo
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Añadir la imagen de fondo (se mostrará en create())
    
    // Crear barra de progreso para la carga
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 520, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Cargando...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Eventos de progreso de carga
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 500 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Carga de assets
    
    // Imagen de fondo para las cargas
    this.load.image('placeholder', 'assets/images/placeholder.png');
    
    // Intentar cargar el mapa si existe el JSON
    this.load.tilemapTiledJSON('sevilla', 'assets/tilemaps/sevilla.json');
    
    // Intentar cargar el tileset si existe
    try {
      this.load.image('tiles', 'assets/images/tileset.png');
    } catch (e) {
      console.warn("No se pudo cargar el tileset. Se usará un mapa alternativo.");
    }
    
    // Sprites para procesiones
    this.load.image('cruz_guia', 'assets/images/cruz_guia.png', { 
      timeout: 5000 // Aumentar tiempo de espera para carga
    });
    
    this.load.image('nazareno', 'assets/images/nazareno.png', { 
      timeout: 5000 
    });
    
    this.load.image('paso_misterio', 'assets/images/paso_misterio.png', { 
      timeout: 5000 
    });
    
    this.load.image('paso_gloria', 'assets/images/paso_gloria.png', { 
      timeout: 5000 
    });
    
    // Sprites de respaldo en caso de que no se encuentren los originales
    // Si no existen los archivos, estos crearán texturas básicas
    this.load.on('fileerror', (key, file) => {
      console.warn(`Error cargando asset: ${key}. Creando respaldo.`);
      
      // Crear gráficos de respaldo al fallar la carga
      if (key === 'cruz_guia') this.createFallbackCruz();
      if (key === 'nazareno') this.createFallbackNazareno();
      if (key === 'paso_misterio' || key === 'paso_gloria') this.createFallbackPaso(key);
    });
    
    // Audio
    // this.load.audio('marchas', 'assets/audio/marchas.mp3');
  }
  
  /**
   * Crea una textura de respaldo para cruz guía
   * @private
   */
  createFallbackCruz() {
    const graphics = this.make.graphics();
    
    // Dibujar una cruz simple
    graphics.lineStyle(4, 0xFFD700);
    graphics.beginPath();
    graphics.moveTo(32, 8);
    graphics.lineTo(32, 56);
    graphics.moveTo(16, 20);
    graphics.lineTo(48, 20);
    graphics.strokePath();
    
    graphics.generateTexture('cruz_guia', 64, 64);
    graphics.destroy();
    
    console.log('Creada textura de respaldo para cruz_guia');
  }
  
  /**
   * Crea una textura de respaldo para nazareno
   * @private
   */
  createFallbackNazareno() {
    const graphics = this.make.graphics();
    
    // Dibujar un nazareno simple
    graphics.fillStyle(0x7E1E9C);
    // Capirote
    graphics.fillTriangle(16, 0, 32, 32, 48, 0);
    // Cuerpo
    graphics.fillRect(16, 32, 32, 32);
    
    graphics.generateTexture('nazareno', 64, 64);
    graphics.destroy();
    
    console.log('Creada textura de respaldo para nazareno');
  }
  
  /**
   * Crea una textura de respaldo para paso
   * @param {string} key - Nombre de la clave de textura
   * @private
   */
  createFallbackPaso(key) {
    const graphics = this.make.graphics();
    
    // Color base según tipo de paso
    const color = key === 'paso_misterio' ? 0x8B0000 : 0x4682B4;
    
    // Dibujar un paso simple
    graphics.fillStyle(color);
    graphics.fillRect(8, 16, 112, 64);
    
    // Detalles
    graphics.fillStyle(0xFFD700);
    graphics.fillRect(8, 8, 112, 8);
    graphics.fillRect(8, 80, 112, 8);
    
    graphics.lineStyle(2, 0xFFD700);
    graphics.strokeRect(8, 16, 112, 64);
    
    graphics.generateTexture(key, 128, 96);
    graphics.destroy();
    
    console.log(`Creada textura de respaldo para ${key}`);
  }
  
  /**
   * Creación de elementos y transición a la siguiente escena
   */
  create() {
    // Agregar la imagen de fondo
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pantalla_fondo')
      .setOrigin(0.5)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    // Comentamos la creación de animaciones para los sprites inexistentes
    /*
    this.anims.create({
      key: 'nazareno-walk',
      frames: this.anims.generateFrameNumbers('nazareno', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'paso-move',
      frames: this.anims.generateFrameNumbers('paso', { start: 0, end: 2 }),
      frameRate: 5,
      repeat: -1
    });
    */
    
    // Avanzar a la escena de menú
    this.scene.start('MenuScene');
  }
} 
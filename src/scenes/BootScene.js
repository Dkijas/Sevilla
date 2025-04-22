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
    
    // Comentamos estas líneas mientras no tengamos assets
    // this.load.tilemapTiledJSON('sevilla', 'assets/tilemaps/sevilla.json');
    // this.load.image('tiles', 'assets/images/tileset.png');
    
    // Sprites
    // this.load.spritesheet('nazareno', 'assets/images/nazareno.png', { 
    //   frameWidth: 32, 
    //   frameHeight: 64 
    // });
    // this.load.spritesheet('paso', 'assets/images/paso.png', { 
    //   frameWidth: 128, 
    //   frameHeight: 128 
    // });
    // this.load.image('ui-buttons', 'assets/images/ui-buttons.png');
    
    // Audio
    // this.load.audio('marchas', 'assets/audio/marchas.mp3');
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
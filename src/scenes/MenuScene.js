/**
 * Escena del menú principal
 * @class MenuScene
 * @extends Phaser.Scene
 */
export default class MenuScene extends Phaser.Scene {
  /**
   * Constructor de la escena
   */
  constructor() {
    super({ key: 'MenuScene' });
  }

  /**
   * Crea la interfaz del menú principal
   */
  create() {
    // Agregar imagen de fondo
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'pantalla_fondo')
      .setOrigin(0.5)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Título del juego
    const titleText = this.add.text(width / 2, height / 4, 'SEMANA SANTA SIMULATOR', {
      font: 'bold 42px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Subtítulo
    const subtitleText = this.add.text(width / 2, height / 4 + 50, 'Sevilla 1550-2050', {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Botón "Crear Hermandad"
    const createButton = this.add.text(width / 2, height / 2, 'Crear Hermandad', {
      font: 'bold 26px Arial',
      fill: '#ffffff',
      padding: { x: 20, y: 10 },
      backgroundColor: '#4527a0'
    }).setOrigin(0.5);
    
    // Botón "Cargar Partida"
    const loadButton = this.add.text(width / 2, height / 2 + 80, 'Cargar Partida', {
      font: 'bold 26px Arial',
      fill: '#ffffff',
      padding: { x: 20, y: 10 },
      backgroundColor: '#4527a0'
    }).setOrigin(0.5);
    
    // Configuración de interactividad para los botones
    [createButton, loadButton].forEach(button => {
      button.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          button.setStyle({ backgroundColor: '#7e57c2' });
          button.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2);
        })
        .on('pointerout', () => {
          button.setStyle({ backgroundColor: '#4527a0' });
          button.setShadow(0, 0, 'rgba(0,0,0,0)', 0);
        });
    });
    
    // Evento para el botón "Crear Hermandad"
    createButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
    
    // Evento para el botón "Cargar Partida"
    loadButton.on('pointerdown', () => {
      console.log('Cargar Partida');
    });
  }
} 
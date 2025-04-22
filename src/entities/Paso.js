/**
 * Clase que representa un Paso procesional en el juego
 * @class Paso
 */
export default class Paso {
  /**
   * Constructor del paso
   * @param {Object} config - Configuración inicial
   * @param {Phaser.Scene} config.scene - Escena del juego
   * @param {number} config.id - Identificador único del paso
   * @param {string} config.spritesheetKey - Clave del spritesheet a utilizar
   * @param {Object} config.currentPosition - Posición inicial
   * @param {number} config.currentPosition.x - Coordenada X inicial
   * @param {number} config.currentPosition.y - Coordenada Y inicial
   * @param {number} [config.frame=0] - Frame inicial del sprite
   * @param {string} [config.musicKey] - Clave de la música asociada al paso
   */
  constructor(config) {
    this.scene = config.scene;
    this.id = config.id;
    this.spritesheetKey = config.spritesheetKey;
    this.currentPosition = {
      x: config.currentPosition.x,
      y: config.currentPosition.y
    };
    this.frame = config.frame || 0;
    this.musicKey = config.musicKey || 'marcha1';
    
    // Propiedades adicionales
    this.speed = config.speed || 30; // Más lento que los nazarenos
    this.currentRoute = null;
    this.currentRouteIndex = 0;
    this.isMoving = false;
    this.isMusicPlaying = false;
    this.music = null;
    
    // Crear sprite
    this.sprite = this.scene.add.sprite(
      this.currentPosition.x,
      this.currentPosition.y,
      this.spritesheetKey,
      this.frame
    ).setScale(1.5); // Los pasos son más grandes
    
    // Configurar física si es necesario
    if (this.scene.physics && this.scene.physics.add) {
      this.scene.physics.add.existing(this.sprite);
      this.sprite.body.setSize(50, 40);
      this.sprite.body.setOffset(7, 24);
    }
  }
  
  /**
   * Actualiza el paso en cada frame
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // Si hay una ruta, mover el paso a lo largo de ella
    if (this.currentRoute && this.currentRoute.length > 0 && this.isMoving) {
      this.moveAlongRoute(delta);
    }
  }
  
  /**
   * Asigna una ruta para que el paso la siga
   * @param {Array<Object>} route - Array de puntos {x, y} que forman la ruta
   */
  followRoute(route) {
    this.currentRoute = route;
    this.currentRouteIndex = 0;
    this.isMoving = true;
    
    if (route.length > 0) {
      // Iniciar animación de movimiento
      this.sprite.anims.play('paso-move', true);
      
      // Si hay música y no está sonando, reproducirla
      if (!this.isMusicPlaying) {
        this.playMusic();
      }
    }
  }
  
  /**
   * Mueve el paso a lo largo de la ruta actual
   * @param {number} delta - Tiempo transcurrido
   */
  moveAlongRoute(delta) {
    if (!this.currentRoute || this.currentRouteIndex >= this.currentRoute.length) {
      return;
    }
    
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
        this.stop();
        return;
      }
      
      return;
    }
    
    // Mover hacia el punto (más lento que nazarenos)
    const speedX = (dx / distance) * this.speed * (delta / 1000);
    const speedY = (dy / distance) * this.speed * (delta / 1000);
    
    this.sprite.x += speedX;
    this.sprite.y += speedY;
    this.currentPosition.x = this.sprite.x;
    this.currentPosition.y = this.sprite.y;
  }
  
  /**
   * Reproduce la música asociada al paso
   */
  playMusic() {
    // Detener música si hay una reproduciéndose
    if (this.music) {
      this.music.stop();
    }
    
    // Crear nueva instancia de música
    this.music = this.scene.sound.add(this.musicKey, {
      loop: true,
      volume: 0.5
    });
    
    // Reproducir
    this.music.play();
    this.isMusicPlaying = true;
  }
  
  /**
   * Detiene la música asociada al paso
   */
  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.isMusicPlaying = false;
    }
  }
  
  /**
   * Detiene el movimiento, animación y música del paso
   */
  stop() {
    this.isMoving = false;
    this.sprite.anims.stop();
    this.stopMusic();
  }
  
  /**
   * Destruye el sprite y libera recursos
   */
  destroy() {
    this.stopMusic();
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
  
  /**
   * Serializa el paso para guardado
   * @returns {Object} - Datos serializados
   */
  serialize() {
    return {
      id: this.id,
      spritesheetKey: this.spritesheetKey,
      currentPosition: {
        x: this.currentPosition.x,
        y: this.currentPosition.y
      },
      frame: this.frame,
      musicKey: this.musicKey,
      speed: this.speed,
      currentRouteIndex: this.currentRouteIndex,
      currentRoute: this.currentRoute,
      isMoving: this.isMoving
    };
  }
} 
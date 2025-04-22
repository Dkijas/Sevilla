/**
 * Clase que representa un Nazareno en el juego
 * @class Nazareno
 */
export default class Nazareno {
  /**
   * Constructor del nazareno
   * @param {Object} config - Configuración inicial
   * @param {Phaser.Scene} config.scene - Escena del juego
   * @param {number} config.id - Identificador único del nazareno
   * @param {string} config.spriteKey - Clave del sprite a utilizar
   * @param {Object} config.position - Posición inicial
   * @param {number} config.position.x - Coordenada X inicial
   * @param {number} config.position.y - Coordenada Y inicial
   * @param {number} [config.frame=0] - Frame inicial del sprite
   */
  constructor(config) {
    this.scene = config.scene;
    this.id = config.id;
    this.spriteKey = config.spriteKey;
    this.position = {
      x: config.position.x,
      y: config.position.y
    };
    this.frame = config.frame || 0;
    
    // Propiedades adicionales
    this.speed = config.speed || 50;
    this.currentRoute = null;
    this.currentRouteIndex = 0;
    
    // Crear sprite
    this.sprite = this.scene.add.sprite(
      this.position.x,
      this.position.y,
      this.spriteKey,
      this.frame
    );
    
    // Configurar física si es necesario
    if (this.scene.physics && this.scene.physics.add) {
      this.scene.physics.add.existing(this.sprite);
      this.sprite.body.setSize(20, 30); // Ajustar hitbox
    }
  }
  
  /**
   * Actualiza el nazareno en cada frame
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // Si hay una ruta, mover al nazareno a lo largo de ella
    if (this.currentRoute && this.currentRoute.length > 0) {
      this.moveAlongRoute(delta);
    }
  }
  
  /**
   * Asigna una ruta para que el nazareno la siga
   * @param {Array<Object>} route - Array de puntos {x, y} que forman la ruta
   */
  walkRoute(route) {
    this.currentRoute = route;
    this.currentRouteIndex = 0;
    
    if (route.length > 0) {
      // Iniciar animación de caminar
      this.sprite.anims.play('nazareno-walk', true);
      
      // Orientar sprite hacia el primer punto
      this.facePoint(route[0]);
    }
  }
  
  /**
   * Mueve al nazareno a lo largo de la ruta actual
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
        this.sprite.anims.stop();
        return;
      }
      
      // Orientar sprite hacia el siguiente punto
      this.facePoint(this.currentRoute[this.currentRouteIndex]);
      return;
    }
    
    // Mover hacia el punto
    const speedX = (dx / distance) * this.speed * (delta / 1000);
    const speedY = (dy / distance) * this.speed * (delta / 1000);
    
    this.sprite.x += speedX;
    this.sprite.y += speedY;
    this.position.x = this.sprite.x;
    this.position.y = this.sprite.y;
  }
  
  /**
   * Orienta el sprite hacia un punto
   * @param {Object} point - Punto {x, y} hacia el que orientar
   */
  facePoint(point) {
    // Calcular ángulo
    const angle = Math.atan2(point.y - this.sprite.y, point.x - this.sprite.x);
    
    // Según el ángulo, elegir el frame adecuado
    const pi = Math.PI;
    if (angle > -pi/4 && angle <= pi/4) {
      // Derecha
      this.sprite.setFlipX(false);
    } else if (angle > pi/4 && angle <= 3*pi/4) {
      // Abajo
      this.sprite.setFlipX(false);
    } else if (angle > 3*pi/4 || angle <= -3*pi/4) {
      // Izquierda
      this.sprite.setFlipX(true);
    } else {
      // Arriba
      this.sprite.setFlipX(false);
    }
  }
  
  /**
   * Detiene el movimiento y animación del nazareno
   */
  stop() {
    this.sprite.anims.stop();
    this.currentRoute = null;
  }
  
  /**
   * Destruye el sprite y libera recursos
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
  
  /**
   * Serializa el nazareno para guardado
   * @returns {Object} - Datos serializados
   */
  serialize() {
    return {
      id: this.id,
      spriteKey: this.spriteKey,
      position: {
        x: this.position.x,
        y: this.position.y
      },
      frame: this.frame,
      speed: this.speed,
      currentRouteIndex: this.currentRouteIndex,
      currentRoute: this.currentRoute
    };
  }
} 
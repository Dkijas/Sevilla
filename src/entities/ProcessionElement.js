/**
 * Clase base para los elementos de una procesión
 * @class ProcessionElement
 */
export default class ProcessionElement {
  /**
   * Crea una instancia de un elemento de procesión
   * @param {Phaser.Scene} scene - La escena del juego
   * @param {Object} config - Configuración del elemento
   * @param {string} config.type - Tipo de elemento (cruz, nazareno, paso)
   * @param {string} config.texture - Textura a utilizar
   * @param {number} config.x - Posición X inicial
   * @param {number} config.y - Posición Y inicial
   * @param {number} config.scale - Escala del sprite
   * @param {number} config.depth - Profundidad de renderizado
   * @param {Array} route - Ruta a seguir
   */
  constructor(scene, config, route) {
    this.scene = scene;
    this.route = route || [];
    
    // Configuración básica
    this.type = config.type || 'nazareno';
    this.texture = config.texture || 'nazareno';
    this.scale = config.scale || 1;
    this.depth = config.depth || 10;
    
    // Estado en la ruta
    this.routeIndex = 0;
    this.progress = 0;
    this.speed = config.speed || 1;
    this.completed = false;
    
    // Crear sprite
    this.sprite = this.scene.add.sprite(
      config.x || 0,
      config.y || 0,
      this.texture
    );
    this.sprite.setScale(this.scale);
    this.sprite.setDepth(this.depth);
    
    // Referencias para animaciones o efectos
    this.animations = {};
    this.effects = {};
    
    // Obtener LogManager si está disponible
    this.logManager = this.scene.logManager;
    
    if (this.logManager) {
      this.logManager.debug(`ProcessionElement ${this.type} creado`, {
        x: this.sprite.x,
        y: this.sprite.y,
        texture: this.texture
      });
    }
  }
  
  /**
   * Actualiza la posición del elemento en la ruta
   * @param {number} delta - Tiempo transcurrido desde la última actualización
   * @returns {Object} - Estado actualizado
   */
  update(delta) {
    if (this.completed || !this.route || this.route.length < 2) return;
    
    // Calcular progreso basado en velocidad
    const stepProgress = (delta * 0.001) * this.speed;
    this.progress += stepProgress;
    
    // Si completamos el segmento actual, pasar al siguiente
    while (this.progress >= 1 && this.routeIndex < this.route.length - 2) {
      this.routeIndex++;
      this.progress -= 1;
    }
    
    // Verificar si ha completado toda la ruta
    if (this.routeIndex >= this.route.length - 2 && this.progress >= 1) {
      // Colocar en el punto final
      this.sprite.setPosition(
        this.route[this.route.length - 1].x,
        this.route[this.route.length - 1].y
      );
      this.completed = true;
      
      if (this.logManager) {
        this.logManager.debug(`${this.type} ha completado la ruta`);
      }
      
      return {
        completed: true,
        position: {
          x: this.sprite.x,
          y: this.sprite.y
        }
      };
    }
    
    // Interpolar posición entre puntos actual y siguiente
    const currentPoint = this.route[this.routeIndex];
    const nextPoint = this.route[this.routeIndex + 1];
    
    // Calcular nueva posición
    const x = currentPoint.x + (nextPoint.x - currentPoint.x) * this.progress;
    const y = currentPoint.y + (nextPoint.y - currentPoint.y) * this.progress;
    
    // Actualizar sprite
    this.sprite.setPosition(x, y);
    
    // Calcular dirección para orientar el sprite
    const angle = Phaser.Math.Angle.Between(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
    this.sprite.setRotation(angle + Math.PI/2); // Ajustar según arte
    
    return {
      completed: false,
      position: { x, y },
      routeIndex: this.routeIndex,
      progress: this.progress
    };
  }
  
  /**
   * Aplica un efecto de balanceo al elemento
   * @param {number} step - Paso actual para calcular el balanceo
   * @param {number} amount - Cantidad de balanceo
   */
  applySwayEffect(step, amount = 0.05) {
    const sway = Math.sin(step / 10) * amount;
    this.sprite.setScale(
      this.scale + sway,
      this.scale - sway
    );
  }
  
  /**
   * Establece la posición del elemento en un punto específico de la ruta
   * @param {number} routeIndex - Índice del punto en la ruta
   * @param {number} progress - Progreso en el segmento (0-1)
   */
  setRoutePosition(routeIndex, progress) {
    if (!this.route || routeIndex >= this.route.length - 1) return;
    
    this.routeIndex = routeIndex;
    this.progress = progress;
    
    const currentPoint = this.route[routeIndex];
    const nextPoint = this.route[routeIndex + 1];
    
    const x = currentPoint.x + (nextPoint.x - currentPoint.x) * progress;
    const y = currentPoint.y + (nextPoint.y - currentPoint.y) * progress;
    
    this.sprite.setPosition(x, y);
  }
  
  /**
   * Reinicia el elemento al inicio de la ruta
   */
  resetToStart() {
    if (!this.route || !this.route.length) return;
    
    this.routeIndex = 0;
    this.progress = 0;
    this.completed = false;
    
    this.sprite.setPosition(this.route[0].x, this.route[0].y);
  }
  
  /**
   * Destruye el elemento y libera recursos
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
} 
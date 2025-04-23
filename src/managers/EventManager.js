/**
 * Gestor de eventos para el juego
 * @class EventManager
 */
export default class EventManager {
  /**
   * Crea una instancia del gestor de eventos
   * @param {Phaser.Scene} scene - La escena del juego
   */
  constructor(scene) {
    this.scene = scene;
    
    // Registro de todos los listeners añadidos para limpieza
    this.listeners = [];
    
    // Eventos del juego
    this.EVENTS = {
      BROTHERHOOD_CREATED: 'brotherhood_created',
      ROUTE_CREATED: 'route_created',
      PROCESSION_STARTED: 'procession_started',
      PROCESSION_STOPPED: 'procession_stopped',
      YEAR_CHANGED: 'year_changed',
      MAP_CLICKED: 'map_clicked',
      ZOOM_CHANGED: 'zoom_changed'
    };
    
    // Sistema de eventos de Phaser incorporado
    this.emitter = new Phaser.Events.EventEmitter();
  }
  
  /**
   * Emite un evento
   * @param {string} event - Nombre del evento
   * @param {...any} args - Argumentos para pasar al evento
   */
  emit(event, ...args) {
    this.emitter.emit(event, ...args);
  }
  
  /**
   * Registra un listener para un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @param {Object} context - Contexto para el callback
   * @returns {Function} - Función para eliminar el listener
   */
  on(event, callback, context = this) {
    this.emitter.on(event, callback, context);
    
    // Guardar referencia para limpieza
    const listenerInfo = { event, callback, context };
    this.listeners.push(listenerInfo);
    
    // Retornar función para eliminar este listener específico
    return () => this.off(event, callback, context);
  }
  
  /**
   * Elimina un listener
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a eliminar
   * @param {Object} context - Contexto del callback
   */
  off(event, callback, context = this) {
    this.emitter.off(event, callback, context);
    
    // Eliminar de nuestro registro
    const index = this.listeners.findIndex(listener => 
      listener.event === event && 
      listener.callback === callback && 
      listener.context === context
    );
    
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Registra un listener para un evento que se ejecuta solo una vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @param {Object} context - Contexto para el callback
   */
  once(event, callback, context = this) {
    this.emitter.once(event, callback, context);
  }
  
  /**
   * Configura los listeners para eventos del juego
   */
  setupListeners() {
    // Ejemplo: listener para cuando se hace clic en el mapa
    this.scene.input.on('pointerdown', (pointer) => {
      // Verificar que es un clic en el mapa y no en UI
      if (!pointer.rightButtonDown() && pointer.button === 0) {
        // Convertir coordenadas de pantalla a mundo
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.emit(this.EVENTS.MAP_CLICKED, worldPoint);
      }
    });
    
    // Listener para cambios de zoom
    this.scene.scale.on('resize', () => {
      this.emit(this.EVENTS.ZOOM_CHANGED, this.scene.cameras.main.zoom);
    });
    
    // Guardar referencia para limpieza
    // No necesitamos guardar estos listeners específicos porque se limpian automáticamente
    // cuando se destruye la escena, pero podríamos hacerlo si fuera necesario
  }
  
  /**
   * Limpia todos los listeners registrados
   */
  destroy() {
    // Limpiar todos los listeners registrados
    this.listeners.forEach(({ event, callback, context }) => {
      this.emitter.off(event, callback, context);
    });
    
    // Vaciar array de listeners
    this.listeners = [];
    
    // Limpiar sistema de eventos
    this.emitter.removeAllListeners();
  }
} 
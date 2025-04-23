/**
 * Gestor de estados para el juego
 * @class StateManager
 */
export default class StateManager {
  /**
   * Crea una instancia del gestor de estados
   * @param {Phaser.Scene} scene - La escena del juego
   */
  constructor(scene) {
    this.scene = scene;
    
    // Definir los estados posibles del juego
    this.STATES = {
      IDLE: 'idle',                        // Estado normal del juego
      CREATING_BROTHERHOOD: 'creatingBrotherhood', // Creando una hermandad
      CREATING_ROUTE: 'creatingRoute',     // Creando un itinerario
      PROCESSING: 'processing'             // Procesión en marcha
    };
    
    // Estado inicial
    this.currentState = this.STATES.IDLE;
    
    // Lista de callbacks a ejecutar cuando cambia el estado
    this.stateChangeCallbacks = {};
    
    // Inicializar callbacks para cada estado
    Object.values(this.STATES).forEach(state => {
      this.stateChangeCallbacks[state] = [];
    });
  }

  /**
   * Establece un nuevo estado
   * @param {string} newState - Nuevo estado
   * @returns {boolean} - true si el cambio de estado fue exitoso
   */
  setState(newState) {
    // Verificar que el estado es válido
    if (!Object.values(this.STATES).includes(newState)) {
      console.error(`Estado inválido: ${newState}`);
      return false;
    }
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    console.log(`Estado cambiado: ${oldState} -> ${newState}`);
    
    // Ejecutar callbacks para el nuevo estado
    if (this.stateChangeCallbacks[newState]) {
      this.stateChangeCallbacks[newState].forEach(callback => {
        try {
          callback(oldState, newState);
        } catch (error) {
          console.error(`Error en callback de cambio de estado:`, error);
        }
      });
    }
    
    return true;
  }
  
  /**
   * Obtiene el estado actual
   * @returns {string} - Estado actual
   */
  getState() {
    return this.currentState;
  }
  
  /**
   * Verifica si el estado actual coincide con el consultado
   * @param {string} state - Estado a comprobar
   * @returns {boolean} - true si coincide
   */
  isState(state) {
    return this.currentState === state;
  }
  
  /**
   * Registra un callback para ejecutar cuando cambie a un estado específico
   * @param {string} state - Estado en el que ejecutar el callback
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} - Función para eliminar el callback
   */
  onStateChange(state, callback) {
    if (!this.stateChangeCallbacks[state]) {
      this.stateChangeCallbacks[state] = [];
    }
    
    this.stateChangeCallbacks[state].push(callback);
    
    // Retornar función para eliminar el callback
    return () => {
      const index = this.stateChangeCallbacks[state].indexOf(callback);
      if (index !== -1) {
        this.stateChangeCallbacks[state].splice(index, 1);
      }
    };
  }
  
  /**
   * Registra un callback para ejecutar cuando cambie cualquier estado
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} - Función para eliminar el callback
   */
  onAnyStateChange(callback) {
    const unsubscribers = [];
    
    // Registrar el callback para todos los estados
    Object.values(this.STATES).forEach(state => {
      unsubscribers.push(this.onStateChange(state, callback));
    });
    
    // Retornar función para eliminar todos los callbacks
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Actualiza el comportamiento basado en el estado actual
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo desde el último frame
   */
  update(time, delta) {
    // Comportamiento específico según el estado
    switch (this.currentState) {
      case this.STATES.IDLE:
        // En estado normal, permitir navegación libre
        this.enableDragNavigation();
        break;
        
      case this.STATES.CREATING_BROTHERHOOD:
        // En creación de hermandad, limitar algunas acciones
        this.disableDragNavigation();
        break;
        
      case this.STATES.CREATING_ROUTE:
        // En creación de ruta, comportamiento específico
        this.disableDragNavigation();
        break;
        
      case this.STATES.PROCESSING:
        // Durante la procesión, permitir navegación para seguirla
        this.enableDragNavigation();
        break;
    }
  }
  
  /**
   * Habilita la navegación mediante arrastre en el mapa
   */
  enableDragNavigation() {
    // Si ya existe un listener, no hacer nada
    if (this.scene._dragEnabled) return;
    
    this.scene.input.on('pointermove', this.handleDrag, this.scene);
    this.scene._dragEnabled = true;
  }
  
  /**
   * Desactiva la navegación mediante arrastre en el mapa
   */
  disableDragNavigation() {
    // Si ya está desactivado, no hacer nada
    if (!this.scene._dragEnabled) return;
    
    this.scene.input.off('pointermove', this.handleDrag, this.scene);
    this.scene._dragEnabled = false;
  }
  
  /**
   * Manejador para el arrastre del mapa
   * @param {Phaser.Input.Pointer} pointer - El puntero que generó el evento
   */
  handleDrag(pointer) {
    if (pointer.isDown && !this.isPaused) {
      this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
    }
  }
  
  /**
   * Limpia todos los recursos
   */
  destroy() {
    // Limpiar todos los callbacks
    Object.values(this.STATES).forEach(state => {
      this.stateChangeCallbacks[state] = [];
    });
    
    // Restablecer estado
    this.currentState = this.STATES.IDLE;
    
    // Desactivar navegación por arrastre
    this.disableDragNavigation();
  }
} 
/**
 * Clase que representa una Hermandad en el juego
 * @class Brotherhood
 */
export default class Brotherhood {
  /**
   * Constructor de la hermandad
   * @param {Object} config - Configuración inicial
   * @param {string} config.name - Nombre de la hermandad
   * @param {number} config.foundingDate - Año de fundación
   * @param {string} config.habitSpriteKey - Clave del sprite para el hábito
   * @param {Object} config.headquarters - Coordenadas de la sede
   * @param {number} config.headquarters.x - Coordenada X en el mapa
   * @param {number} config.headquarters.y - Coordenada Y en el mapa
   * @param {Array<Object>} [config.events=[]] - Eventos históricos de la hermandad
   */
  constructor(config) {
    this.name = config.name;
    this.foundingDate = config.foundingDate;
    this.habitSpriteKey = config.habitSpriteKey;
    this.headquarters = {
      x: config.headquarters.x,
      y: config.headquarters.y
    };
    this.events = config.events || [];
    
    // Propiedades adicionales
    this.members = config.members || 50; // Número inicial de miembros
    this.reputation = config.reputation || 10; // Reputación inicial (1-100)
    this.route = config.route || []; // Ruta de la procesión
    
    // Estado interno
    this._processingYear = this.foundingDate;
  }
  
  /**
   * Actualiza la hermandad al avanzar en el tiempo
   * @param {number} currentYear - Año actual del juego
   * @returns {Object|null} - Evento generado (si aplica)
   */
  update(currentYear) {
    // Si es la primera vez que se actualiza desde la fundación
    if (this._processingYear === this.foundingDate && currentYear > this.foundingDate) {
      this._processingYear = currentYear;
      return this.generateEvent('Fundación', `Fundación de ${this.name}`, this.foundingDate);
    }
    
    // Actualizar desde último año procesado hasta el año actual
    let generatedEvent = null;
    for (let year = this._processingYear + 1; year <= currentYear; year++) {
      // Incremento de miembros (lógica simple de ejemplo)
      if (Math.random() > 0.7) {
        const growthRate = 0.05 + (Math.random() * 0.1); // 5-15% de crecimiento
        const newMembers = Math.floor(this.members * growthRate);
        this.members += newMembers;
        
        // Generar evento si el crecimiento es significativo
        if (newMembers > 20) {
          generatedEvent = this.generateEvent(
            'Crecimiento',
            `La hermandad ${this.name} experimentó un gran crecimiento con ${newMembers} nuevos miembros`,
            year
          );
        }
      }
      
      // Cambios en reputación (aleatorio para este ejemplo)
      const reputationChange = Math.floor(Math.random() * 10) - 4; // -4 a +5
      this.reputation = Math.max(1, Math.min(100, this.reputation + reputationChange));
      
      // Eventos históricos aleatorios (para ejemplo)
      if (Math.random() > 0.9) {
        const eventTypes = ['Crisis', 'Celebración', 'Renovación', 'Cambio de sede'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        generatedEvent = this.generateEvent(
          eventType,
          `La hermandad ${this.name} tuvo un evento de ${eventType.toLowerCase()}`,
          year
        );
      }
    }
    
    this._processingYear = currentYear;
    return generatedEvent;
  }
  
  /**
   * Genera un nuevo evento histórico
   * @param {string} type - Tipo de evento
   * @param {string} description - Descripción del evento
   * @param {number} year - Año del evento
   * @returns {Object} - El evento generado
   */
  generateEvent(type, description, year) {
    const event = {
      id: this.events.length + 1,
      type,
      description,
      year
    };
    
    this.events.push(event);
    return event;
  }
  
  /**
   * Cambia la sede de la hermandad
   * @param {number} x - Nueva coordenada X
   * @param {number} y - Nueva coordenada Y
   * @param {number} year - Año del cambio
   */
  changeHeadquarters(x, y, year) {
    const oldHQ = { ...this.headquarters };
    this.headquarters = { x, y };
    
    // Generar evento de cambio de sede
    this.generateEvent(
      'Cambio de sede',
      `La hermandad ${this.name} cambió su sede`,
      year
    );
    
    return oldHQ;
  }
  
  /**
   * Serializa la hermandad para guardado
   * @returns {Object} - Datos serializados
   */
  serialize() {
    return {
      name: this.name,
      foundingDate: this.foundingDate,
      habitSpriteKey: this.habitSpriteKey,
      headquarters: this.headquarters,
      events: this.events,
      members: this.members,
      reputation: this.reputation,
      route: this.route,
      _processingYear: this._processingYear
    };
  }
} 
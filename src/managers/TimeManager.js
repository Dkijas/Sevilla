/**
 * Gestor del tiempo en el juego, controlando la evolución histórica
 * @class TimeManager
 */
export default class TimeManager {
  /**
   * Constructor del gestor de tiempo
   * @param {Phaser.Scene} scene - Escena del juego
   * @param {Object} [config] - Configuración adicional
   * @param {number} [config.minYear=1550] - Año mínimo del juego
   * @param {number} [config.maxYear=2050] - Año máximo del juego
   * @param {number} [config.startYear=1550] - Año inicial
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.minYear = config.minYear || 1550;
    this.maxYear = config.maxYear || 2050;
    this.currentYear = config.startYear || 1550;
    
    // Almacenamiento de eventos históricos globales
    this.globalEvents = [];
    
    // Callbacks a ejecutar cuando avanza el tiempo
    this.timeChangeCallbacks = [];
    
    // Referencia a la hermandad activa
    this.brotherhood = null;
    this.setActiveBrotherhood(window.gameData.brotherhood);
    
    // Iniciar variable global de tiempo
    window.gameData.currentYear = this.currentYear;
    
    // Crear UI del controlador de tiempo si se requiere
    if (config.createUI !== false) {
      this.createTimeUI();
    }
  }
  
  /**
   * Crea la interfaz para controlar el tiempo
   */
  createTimeUI() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Panel para el slider de tiempo
    const timePanel = this.scene.add.rectangle(
      width / 2,
      height - 40,
      width - 100,
      50,
      0x000000,
      0.7
    ).setScrollFactor(0);
    
    // Textos de años (min y max)
    this.scene.add.text(
      60,
      height - 40,
      `${this.minYear}`,
      {
        font: '16px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5).setScrollFactor(0);
    
    this.scene.add.text(
      width - 60,
      height - 40,
      `${this.maxYear}`,
      {
        font: '16px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5).setScrollFactor(0);
    
    // Crear marcador de año actual (punto que se mueve en la línea de tiempo)
    this.timeMarker = this.scene.add.circle(
      this.calculateMarkerPosition(),
      height - 40,
      10,
      0xffffff
    ).setScrollFactor(0);
    
    // Eventos interactivos para el panel de tiempo
    timePanel.setInteractive();
    timePanel.on('pointerdown', (pointer) => {
      // Calcular nuevo año basado en la posición X del clic
      const relativeX = pointer.x - 60;
      const totalWidth = width - 120;
      const yearRange = this.maxYear - this.minYear;
      const yearOffset = Math.floor((relativeX / totalWidth) * yearRange);
      const newYear = this.minYear + yearOffset;
      
      // Actualizar al nuevo año
      this.setYear(newYear);
    });
  }
  
  /**
   * Calcula la posición X del marcador de tiempo
   * @returns {number} - Posición X en la pantalla
   */
  calculateMarkerPosition() {
    const width = this.scene.cameras.main.width;
    const totalWidth = width - 120;
    const yearRange = this.maxYear - this.minYear;
    const yearPosition = this.currentYear - this.minYear;
    const relativePosition = yearPosition / yearRange;
    
    return 60 + (relativePosition * totalWidth);
  }
  
  /**
   * Establece la hermandad activa para los eventos de tiempo
   * @param {Brotherhood} brotherhood - Hermandad a controlar
   */
  setActiveBrotherhood(brotherhood) {
    this.brotherhood = brotherhood;
  }
  
  /**
   * Registra un callback a ejecutar cuando cambia el tiempo
   * @param {Function} callback - Función a ejecutar con (year, events)
   */
  onTimeChange(callback) {
    this.timeChangeCallbacks.push(callback);
  }
  
  /**
   * Avanza el tiempo en un número determinado de años
   * @param {number} years - Años a avanzar
   * @returns {Array<Object>} - Eventos generados durante este avance
   */
  advance(years) {
    if (years <= 0) return [];
    
    const oldYear = this.currentYear;
    const newYear = Math.min(this.currentYear + years, this.maxYear);
    
    // Recolección de eventos
    const events = this.processTimeAdvance(oldYear, newYear);
    
    // Actualizar año actual
    this.setYear(newYear);
    
    return events;
  }
  
  /**
   * Establece un año específico
   * @param {number} year - Nuevo año
   * @returns {Array<Object>} - Eventos generados durante este cambio
   */
  setYear(year) {
    if (year < this.minYear || year > this.maxYear) {
      return [];
    }
    
    const oldYear = this.currentYear;
    this.currentYear = year;
    window.gameData.currentYear = year;
    
    // Actualizar marcador visual si existe
    if (this.timeMarker) {
      this.timeMarker.x = this.calculateMarkerPosition();
    }
    
    // Actualizar texto de año en la UI
    if (this.scene.yearText) {
      this.scene.yearText.setText(`Año: ${year}`);
    }
    
    // Si el año no cambió, no hay eventos
    if (oldYear === year) {
      return [];
    }
    
    // Procesar avance de tiempo y recolectar eventos
    return this.processTimeAdvance(oldYear, year);
  }
  
  /**
   * Procesa la lógica interna del avance de tiempo
   * @param {number} fromYear - Año inicial
   * @param {number} toYear - Año final
   * @returns {Array<Object>} - Eventos generados
   */
  processTimeAdvance(fromYear, toYear) {
    const generatedEvents = [];
    
    // Actualizaciones en la hermandad activa
    if (this.brotherhood) {
      const brotherhoodEvent = this.brotherhood.update(toYear);
      if (brotherhoodEvent) {
        generatedEvents.push(brotherhoodEvent);
      }
    }
    
    // Generación de eventos históricos globales (ejemplos)
    if (Math.random() > 0.85) {
      const eventTypes = [
        'Guerra', 'Epidemia', 'Cambio político',
        'Renovación cultural', 'Reforma religiosa'
      ];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Año aleatorio entre fromYear y toYear
      const eventYear = fromYear + Math.floor(Math.random() * (toYear - fromYear));
      
      // Crear evento
      const globalEvent = {
        id: this.globalEvents.length + 1,
        type: eventType,
        description: `Evento histórico: ${eventType}`,
        year: eventYear,
        impact: Math.floor(Math.random() * 5) + 1 // Impacto 1-5
      };
      
      this.globalEvents.push(globalEvent);
      generatedEvents.push(globalEvent);
    }
    
    // Ejecutar callbacks registrados
    this.timeChangeCallbacks.forEach(callback => {
      callback(toYear, generatedEvents);
    });
    
    // Mostrar eventos en pantalla
    this.showEvents(generatedEvents);
    
    return generatedEvents;
  }
  
  /**
   * Muestra notificaciones de eventos en pantalla
   * @param {Array<Object>} events - Eventos a mostrar
   */
  showEvents(events) {
    if (!events || events.length === 0) return;
    
    // Para cada evento, mostrar una notificación
    let offsetY = 150; // Posición inicial desde la parte superior
    
    events.forEach(event => {
      const eventText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        offsetY,
        `${event.year}: ${event.description}`,
        {
          font: '16px Arial',
          fill: '#ffffff',
          backgroundColor: '#4527a0',
          padding: { x: 16, y: 8 }
        }
      ).setOrigin(0.5).setScrollFactor(0);
      
      // Animar aparición y desaparición
      this.scene.tweens.add({
        targets: eventText,
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Linear',
        onComplete: () => {
          this.scene.time.delayedCall(5000, () => {
            this.scene.tweens.add({
              targets: eventText,
              alpha: { from: 1, to: 0 },
              duration: 500,
              ease: 'Linear',
              onComplete: () => {
                eventText.destroy();
              }
            });
          });
        }
      });
      
      offsetY += 50;
    });
  }
  
  /**
   * Obtiene todos los eventos históricos almacenados
   * @returns {Array<Object>} - Todos los eventos registrados
   */
  getAllEvents() {
    const events = [...this.globalEvents];
    
    // Añadir eventos de hermandad si existe
    if (this.brotherhood) {
      events.push(...this.brotherhood.events);
    }
    
    // Ordenar por año
    return events.sort((a, b) => a.year - b.year);
  }
} 
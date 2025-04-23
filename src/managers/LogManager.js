/**
 * Gestor de logs para el juego
 * @class LogManager
 */
export default class LogManager {
  /**
   * Crea una instancia del gestor de logs
   * @param {EventManager} eventManager - El gestor de eventos
   */
  constructor(eventManager) {
    this.eventManager = eventManager;
    
    // Configuración
    this.config = {
      logToConsole: true,        // Mostrar logs en consola
      saveToFile: true,          // Guardar logs en archivo
      maxLogsInMemory: 1000,     // Máximo de logs en memoria
      logDateFormat: 'DD/MM/YYYY HH:mm:ss', // Formato de fecha
      logFolder: 'logs'          // Carpeta donde se guardarán los logs
    };
    
    // Niveles de log
    this.LOG_LEVELS = {
      DEBUG: { value: 0, label: 'DEBUG', color: 'blue' },
      INFO: { value: 1, label: 'INFO', color: 'green' },
      WARNING: { value: 2, label: 'WARNING', color: 'orange' },
      ERROR: { value: 3, label: 'ERROR', color: 'red' },
      FATAL: { value: 4, label: 'FATAL', color: 'purple' }
    };
    
    // Nivel mínimo para guardar en archivo
    this.minFileLogLevel = this.LOG_LEVELS.WARNING.value;
    
    // Almacenamiento de logs en memoria
    this.logs = [];
    
    // Registro de la sesión
    this.sessionId = this.generateSessionId();
    
    // Registrar eventos para capturar errores automáticamente
    this.registerErrorEvents();
    
    // Log inicial
    this.info('Sistema de logs iniciado', { sessionId: this.sessionId });
  }
  
  /**
   * Genera un ID único para la sesión
   * @returns {string} ID de sesión
   * @private
   */
  generateSessionId() {
    const date = new Date();
    const randomPart = Math.floor(Math.random() * 10000);
    return `session_${date.getFullYear()}${date.getMonth()+1}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}_${randomPart}`;
  }
  
  /**
   * Registra eventos para capturar errores globales
   * @private
   */
  registerErrorEvents() {
    // Capturar errores no controlados
    window.addEventListener('error', (event) => {
      this.fatal('Error no controlado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? (event.error.stack || event.error.toString()) : null
      });
      return false; // Permitir que el error se propague
    });
    
    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promesa rechazada no controlada', {
        reason: event.reason ? (event.reason.stack || event.reason.toString()) : 'Desconocido'
      });
    });
    
    // Suscribirse a eventos específicos del juego si existe el eventManager
    if (this.eventManager) {
      // Registrar eventos de ciclo de vida
      this.eventManager.on('GAME_INIT', () => this.info('Juego inicializado'));
      this.eventManager.on('GAME_PAUSE', () => this.info('Juego pausado'));
      this.eventManager.on('GAME_RESUME', () => this.info('Juego reanudado'));
      
      // Registrar eventos de procesión
      this.eventManager.on('PROCESSION_STARTED', (data) => 
        this.info('Procesión iniciada', data)
      );
      this.eventManager.on('PROCESSION_COMPLETED', (data) => 
        this.info('Procesión completada', data)
      );
      this.eventManager.on('PROCESSION_CANCELLED', (data) => 
        this.warning('Procesión cancelada', data)
      );
      
      // Registrar errores que se emitan a través del sistema de eventos
      this.eventManager.on('ERROR', (data) => this.error('Error emitido', data));
      this.eventManager.on('FATAL_ERROR', (data) => this.fatal('Error fatal emitido', data));
    }
  }
  
  /**
   * Formatea un mensaje de log
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje principal
   * @param {Object} data - Datos adicionales
   * @returns {Object} - Objeto de log formateado
   * @private
   */
  formatLog(level, message, data = null) {
    const timestamp = new Date();
    const logObject = {
      timestamp,
      timestampFormatted: this.formatDate(timestamp),
      level,
      message,
      data
    };
    
    return logObject;
  }
  
  /**
   * Formatea una fecha según la configuración
   * @param {Date} date - Fecha a formatear
   * @returns {string} - Fecha formateada
   * @private
   */
  formatDate(date) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  
  /**
   * Registra un mensaje de debug
   * @param {string} message - Mensaje principal
   * @param {Object} data - Datos adicionales
   */
  debug(message, data = null) {
    this.log(this.LOG_LEVELS.DEBUG, message, data);
  }
  
  /**
   * Registra un mensaje informativo
   * @param {string} message - Mensaje principal
   * @param {Object} data - Datos adicionales
   */
  info(message, data = null) {
    this.log(this.LOG_LEVELS.INFO, message, data);
  }
  
  /**
   * Registra una advertencia
   * @param {string} message - Mensaje principal
   * @param {Object} data - Datos adicionales
   */
  warning(message, data = null) {
    this.log(this.LOG_LEVELS.WARNING, message, data);
  }
  
  /**
   * Registra un error
   * @param {string} message - Mensaje principal
   * @param {Object|Error} data - Datos adicionales o error
   */
  error(message, data = null) {
    // Si data es un Error, convertirlo a un objeto con propiedades útiles
    if (data instanceof Error) {
      data = {
        message: data.message,
        name: data.name,
        stack: data.stack,
        toString: data.toString()
      };
    }
    
    this.log(this.LOG_LEVELS.ERROR, message, data);
  }
  
  /**
   * Registra un error fatal
   * @param {string} message - Mensaje principal
   * @param {Object|Error} data - Datos adicionales o error
   */
  fatal(message, data = null) {
    // Si data es un Error, convertirlo a un objeto con propiedades útiles
    if (data instanceof Error) {
      data = {
        message: data.message,
        name: data.name,
        stack: data.stack,
        toString: data.toString()
      };
    }
    
    this.log(this.LOG_LEVELS.FATAL, message, data);
    
    // Para errores fatales, guardar inmediatamente
    this.saveLogsToFile(true);
  }
  
  /**
   * Registra un mensaje en el nivel especificado
   * @param {Object} levelObj - Nivel de log
   * @param {string} message - Mensaje principal
   * @param {Object} data - Datos adicionales
   * @private
   */
  log(levelObj, message, data) {
    const logObject = this.formatLog(levelObj, message, data);
    
    // Añadir al registro en memoria
    this.logs.push(logObject);
    
    // Limitar tamaño del array de logs
    if (this.logs.length > this.config.maxLogsInMemory) {
      this.logs.shift(); // Eliminar el más antiguo
    }
    
    // Mostrar en consola si está habilitado
    if (this.config.logToConsole) {
      this.printToConsole(logObject);
    }
    
    // Si es un nivel que debe guardarse en archivo, activar guardado
    if (this.config.saveToFile && levelObj.value >= this.minFileLogLevel) {
      // Si es un error fatal, guardar inmediatamente
      if (levelObj.value === this.LOG_LEVELS.FATAL.value) {
        this.saveLogsToFile(true);
      } else {
        // Para niveles inferiores, guardar pero no forzar inmediatamente
        this.saveLogsToFile(false);
      }
    }
  }
  
  /**
   * Imprime un log en la consola con formato
   * @param {Object} logObject - Objeto de log
   * @private
   */
  printToConsole(logObject) {
    const { level, message, timestampFormatted, data } = logObject;
    
    // Preparar estilo según nivel
    const style = `color: ${level.color}; font-weight: bold;`;
    
    // Imprimir encabezado con estilo
    console.group(`%c[${level.label}] ${timestampFormatted}: ${message}`, style);
    
    // Imprimir datos adicionales si existen
    if (data) {
      console.log('Datos adicionales:', data);
    }
    
    console.groupEnd();
  }
  
  /**
   * Guarda los logs en un archivo
   * @param {boolean} immediate - Si debe guardar inmediatamente o programar
   * @private
   */
  saveLogsToFile(immediate = false) {
    // Si ya hay un guardado programado y no es inmediato, no hacer nada
    if (this.saveTimeout && !immediate) return;
    
    // Si es inmediato, cancelar cualquier guardado programado
    if (immediate && this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Si no es inmediato, programar guardado
    if (!immediate) {
      this.saveTimeout = setTimeout(() => {
        this.saveTimeout = null;
        this.performSave();
      }, 5000); // Guardar después de 5 segundos de inactividad
      return;
    }
    
    // Guardado inmediato
    this.performSave();
  }
  
  /**
   * Realiza el guardado efectivo de los logs
   * @private
   */
  performSave() {
    try {
      // Filtrar logs según nivel mínimo para archivo
      const logsToSave = this.logs.filter(log => 
        log.level.value >= this.minFileLogLevel
      );
      
      if (logsToSave.length === 0) return;
      
      // Convertir logs a formato de texto
      const logText = this.formatLogsForFile(logsToSave);
      
      // Nombre del archivo basado en fecha y sesión
      const date = new Date();
      const dateStr = `${date.getFullYear()}${this.pad(date.getMonth()+1)}${this.pad(date.getDate())}`;
      const filename = `sevilla_log_${dateStr}_${this.sessionId}.txt`;
      
      // En entorno web, ofrecer descarga del archivo
      this.downloadLogFile(logText, filename);
      
    } catch (err) {
      console.error('Error al guardar logs:', err);
    }
  }
  
  /**
   * Añade ceros a la izquierda para formato consistente
   * @param {number} num - Número a formatear
   * @returns {string} - Número formateado
   * @private
   */
  pad(num) {
    return num < 10 ? '0' + num : num;
  }
  
  /**
   * Formatea los logs para guardado en archivo
   * @param {Array} logs - Logs a formatear
   * @returns {string} - Contenido del archivo de logs
   * @private
   */
  formatLogsForFile(logs) {
    let content = `=== LOGS DE SEVILLA - SESIÓN: ${this.sessionId} ===\n`;
    content += `Generado: ${this.formatDate(new Date())}\n\n`;
    
    logs.forEach(log => {
      content += `[${log.level.label}] ${log.timestampFormatted}: ${log.message}\n`;
      
      if (log.data) {
        // Formatear datos como JSON con sangría
        const dataStr = JSON.stringify(log.data, null, 2);
        // Añadir sangría a cada línea para mejorar legibilidad
        const indentedData = dataStr.split('\n').map(line => `  ${line}`).join('\n');
        content += `${indentedData}\n`;
      }
      
      content += '\n'; // Línea en blanco entre logs
    });
    
    return content;
  }
  
  /**
   * Descarga el archivo de logs
   * @param {string} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   * @private
   */
  downloadLogFile(content, filename) {
    // Crear un blob con el contenido
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // Usar FileSaver.js si está disponible, o implementación básica
    if (window.saveAs) {
      window.saveAs(blob, filename);
    } else {
      // Implementación básica
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      
      // Añadir temporalmente al documento y hacer clic
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  }
  
  /**
   * Obtiene todos los logs almacenados en memoria
   * @returns {Array} - Todos los logs
   */
  getAllLogs() {
    return [...this.logs];
  }
  
  /**
   * Obtiene logs filtrados por nivel
   * @param {Object} level - Nivel de log para filtrar
   * @returns {Array} - Logs filtrados
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level.value === level.value);
  }
  
  /**
   * Limpia los logs en memoria
   */
  clearLogs() {
    this.logs = [];
    this.info('Logs limpiados');
  }
  
  /**
   * Fuerza el guardado inmediato de los logs
   */
  forceSave() {
    this.saveLogsToFile(true);
  }
  
  /**
   * Destruye el gestor y libera recursos
   */
  destroy() {
    // Guardar logs antes de destruir
    this.saveLogsToFile(true);
    
    // Limpiar timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Desregistrar eventos globales si es necesario
    
    // Limpiar referencias
    this.logs = null;
    this.eventManager = null;
  }
  
  /**
   * Simula un error fatal para probar el sistema de logs
   * @param {string} customMessage - Mensaje personalizado opcional
   */
  simulateError(customMessage = 'Error simulado para pruebas') {
    try {
      // Crear un error artificial
      throw new Error(`${customMessage} - ${new Date().toISOString()}`);
    } catch (error) {
      // Registrar como error fatal
      this.fatal('Error simulado para pruebas', {
        message: error.message,
        stack: error.stack,
        simulatedAt: new Date().toISOString(),
        additionalInfo: 'Este error fue generado intencionalmente para probar el sistema de logs'
      });
      
      return error;
    }
  }
} 
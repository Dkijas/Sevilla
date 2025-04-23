/**
 * Gestor de interfaz de usuario para el juego
 * @class UIManager
 */
export default class UIManager {
  /**
   * Crea una instancia del gestor de UI
   * @param {Phaser.Scene} scene - La escena del juego
   * @param {EventManager} eventManager - El gestor de eventos
   */
  constructor(scene, eventManager) {
    this.scene = scene;
    this.eventManager = eventManager;
    
    // Elementos UI activos
    this.uiElements = new Map();
    this.forms = new Map();
    
    // Dimensiones y estilos
    this.padding = 10;
    
    this.styles = {
      button: {
        backgroundColor: '#4a7c59',
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        padding: {
          left: 10,
          right: 10,
          top: 5,
          bottom: 5
        }
      },
      text: {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#333333'
      },
      form: {
        backgroundColor: 'rgba(50, 50, 50, 0.8)',
        border: '2px solid #4a7c59',
        titleColor: '#FFFFFF',
        labelColor: '#CCCCCC',
        inputBackground: '#FFFFFF',
        inputColor: '#333333',
        buttonColor: '#4a7c59'
      }
    };
  }
  
  /**
   * Crea un botón de UI
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} text - Texto del botón
   * @param {Function} callback - Función a ejecutar al hacer clic
   * @param {string} id - Identificador único para el botón
   * @returns {Phaser.GameObjects.Text} - El botón creado
   */
  createButton(x, y, text, callback, id) {
    const button = this.scene.add.text(x, y, text, this.styles.button)
      .setInteractive({ useHandCursor: true })
      .setPadding(this.styles.button.padding)
      .setBackgroundColor(this.styles.button.backgroundColor);
    
    button.on('pointerdown', () => callback())
      .on('pointerover', () => button.setBackgroundColor('#5d9b6d'))
      .on('pointerout', () => button.setBackgroundColor(this.styles.button.backgroundColor));
    
    if (id) {
      this.uiElements.set(id, button);
    }
    
    return button;
  }
  
  /**
   * Crea un texto
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} text - Contenido del texto
   * @param {string} id - Identificador único
   * @returns {Phaser.GameObjects.Text} - El texto creado
   */
  createText(x, y, text, id) {
    const textObject = this.scene.add.text(x, y, text, this.styles.text);
    
    if (id) {
      this.uiElements.set(id, textObject);
    }
    
    return textObject;
  }
  
  /**
   * Crea un campo de entrada de texto
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho del campo
   * @param {number} height - Alto del campo
   * @param {Object} config - Configuración adicional
   * @returns {Phaser.GameObjects.DOMElement} - El campo de entrada
   */
  createInputField(x, y, width, height, config = {}) {
    const inputElement = document.createElement('input');
    inputElement.type = config.type || 'text';
    inputElement.style.width = width + 'px';
    inputElement.style.height = height + 'px';
    inputElement.style.fontSize = '16px';
    inputElement.style.padding = '5px';
    inputElement.style.border = '1px solid #ccc';
    inputElement.style.borderRadius = '4px';
    
    if (config.placeholder) {
      inputElement.placeholder = config.placeholder;
    }
    
    if (config.value) {
      inputElement.value = config.value;
    }
    
    const input = this.scene.add.dom(x, y, inputElement);
    
    if (config.id) {
      this.uiElements.set(config.id, input);
    }
    
    return input;
  }
  
  /**
   * Crea un panel para un formulario
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho del panel
   * @param {number} height - Alto del panel
   * @param {string} title - Título del panel
   * @param {string} id - Identificador único
   * @returns {Object} - Objeto con elementos del panel
   */
  createFormPanel(x, y, width, height, title, id) {
    const panel = {
      elements: [],
      background: this.scene.add.rectangle(x, y, width, height, 0x333333)
        .setOrigin(0)
        .setAlpha(0.8),
      title: this.scene.add.text(
        x + this.padding, 
        y + this.padding, 
        title,
        { fontSize: '20px', color: this.styles.form.titleColor, fontFamily: 'Arial' }
      ),
      container: this.scene.add.container(x, y)
    };
    
    // Añadir elementos básicos al contenedor
    panel.container.add([panel.background, panel.title]);
    panel.elements.push(panel.background, panel.title);
    
    if (id) {
      this.forms.set(id, panel);
    }
    
    return panel;
  }
  
  /**
   * Muestra un mensaje temporal
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en milisegundos
   */
  showTemporaryMessage(message, duration = 3000) {
    const x = this.scene.cameras.main.width / 2;
    const y = 100;
    
    const messageText = this.scene.add.text(x, y, message, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
      backgroundColor: '#333333',
      padding: {
        left: 15,
        right: 15,
        top: 10,
        bottom: 10
      }
    }).setOrigin(0.5).setDepth(1000);
    
    this.scene.tweens.add({
      targets: messageText,
      alpha: 0,
      duration: 500,
      delay: duration - 500,
      onComplete: () => {
        messageText.destroy();
      }
    });
  }
  
  /**
   * Elimina un elemento UI por su ID
   * @param {string} id - ID del elemento a eliminar
   */
  removeElement(id) {
    if (this.uiElements.has(id)) {
      const element = this.uiElements.get(id);
      element.destroy();
      this.uiElements.delete(id);
    }
  }
  
  /**
   * Elimina un formulario completo por su ID
   * @param {string} id - ID del formulario a eliminar
   */
  removeForm(id) {
    if (this.forms.has(id)) {
      const form = this.forms.get(id);
      
      // Destruir cada elemento del formulario
      form.elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      
      // Destruir el contenedor
      if (form.container) {
        form.container.destroy();
      }
      
      this.forms.delete(id);
    }
  }
  
  /**
   * Elimina todos los elementos de UI
   */
  clearAll() {
    // Eliminar elementos individuales
    this.uiElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.uiElements.clear();
    
    // Eliminar formularios
    this.forms.forEach(form => {
      form.elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      
      if (form.container) {
        form.container.destroy();
      }
    });
    this.forms.clear();
  }
  
  /**
   * Función de limpieza al destruir
   */
  destroy() {
    this.clearAll();
  }
} 
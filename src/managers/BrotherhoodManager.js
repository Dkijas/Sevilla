/**
 * Gestor de hermandades para el juego
 * @class BrotherhoodManager
 */
export default class BrotherhoodManager {
  /**
   * Crea una instancia del gestor de hermandades
   * @param {Phaser.Scene} scene - La escena del juego
   */
  constructor(scene) {
    this.scene = scene;
    this.isCreatingBrotherhood = false;
    this.brotherhood = null;
    this.brotherhoodInterface = null;
    this.headquartersMarker = null;
    this.formElements = [];
    
    // Enlazar métodos para mantener el contexto
    this.handleFormMapClick = this.handleFormMapClick.bind(this);
  }

  /**
   * Muestra el formulario para crear una nueva hermandad
   */
  showBrotherhoodForm() {
    // Asegurarnos de que la escena esté cargada
    if (!this.scene.scene.isActive('GameScene')) {
      console.warn("Intento de mostrar formulario de hermandad en una escena inactiva");
      return;
    }
    
    console.log("Mostrando formulario de creación de hermandad");
    this.isCreatingBrotherhood = true;
    this.scene.stateManager.setState('CREATING_BROTHERHOOD');
    
    // Fondo semi-transparente
    const formBackground = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      400,
      500,
      0x222222,
      0.9
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Título del formulario
    const formTitle = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 - 220,
      'CREAR NUEVA HERMANDAD',
      {
        font: 'bold 20px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Variables para almacenar los datos del formulario
    let hermandadData = {
      name: 'Hermandad Nueva',
      foundingDate: 1550,
      habitColor: 'purple', // Valor por defecto
      headquarters: { x: 400, y: 300 },
      isValid: false // Flag para validación
    };
    
    // Campo de nombre
    const nombreLabel = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 180,
      this.scene.cameras.main.height / 2 - 170,
      'Nombre:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Campo para introducir el nombre
    const nameInput = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 80,
      this.scene.cameras.main.height / 2 - 170,
      hermandadData.name,
      { font: '16px Arial', fill: '#ffff00', backgroundColor: '#333344', padding: { x: 10, y: 5 } }
    ).setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100);
    
    nameInput.on('pointerdown', () => {
      // Simulamos un cuadro de entrada de texto
      const newName = prompt('Introduce el nombre de la hermandad:', hermandadData.name);
      if (newName && newName.trim() !== '') {
        hermandadData.name = newName.trim();
        nameInput.setText(hermandadData.name);
        validateForm();
      }
    });
    
    // Fecha de fundación
    const yearLabel = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 180,
      this.scene.cameras.main.height / 2 - 110,
      'Fecha de fundación:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    const yearValue = this.scene.add.text(
      this.scene.cameras.main.width / 2 + 30,
      this.scene.cameras.main.height / 2 - 110,
      hermandadData.foundingDate.toString(),
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Botones para ajustar el año
    const decreaseYearBtn = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 20,
      this.scene.cameras.main.height / 2 - 110,
      '◀',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    
    const increaseYearBtn = this.scene.add.text(
      this.scene.cameras.main.width / 2 + 90,
      this.scene.cameras.main.height / 2 - 110,
      '▶',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#1a237e', padding: 5 }
    ).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    
    decreaseYearBtn.on('pointerdown', () => {
      if (hermandadData.foundingDate > 1500) {
        hermandadData.foundingDate -= 10;
        yearValue.setText(hermandadData.foundingDate.toString());
        validateForm();
      }
    });
    
    increaseYearBtn.on('pointerdown', () => {
      if (hermandadData.foundingDate < 1900) {
        hermandadData.foundingDate += 10;
        yearValue.setText(hermandadData.foundingDate.toString());
        validateForm();
      }
    });
    
    // Selección de hábito
    const habitLabel = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 180,
      this.scene.cameras.main.height / 2 - 50,
      'Color del hábito:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Opciones de colores para el hábito
    const colors = [
      { name: 'Morado', value: 'purple', hex: 0x800080 },
      { name: 'Negro', value: 'black', hex: 0x000000 },
      { name: 'Blanco', value: 'white', hex: 0xffffff },
      { name: 'Rojo', value: 'red', hex: 0xff0000 },
      { name: 'Verde', value: 'green', hex: 0x008800 },
      { name: 'Azul', value: 'blue', hex: 0x0000ff }
    ];
    
    // Crear grupo de opciones de colores
    const colorOptions = [];
    const colorTexts = [];
    const colorSamples = [];
    
    colors.forEach((color, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const xPos = this.scene.cameras.main.width / 2 - 180 + (col * 120);
      const yPos = this.scene.cameras.main.height / 2 - 20 + (row * 40);
      
      // Muestra del color
      const colorSample = this.scene.add.rectangle(xPos + 12, yPos + 12, 25, 25, color.hex)
        .setScrollFactor(0)
        .setStrokeStyle(1, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);
      
      // Texto del color
      const colorText = this.scene.add.text(xPos + 40, yPos, color.name, 
        { font: '14px Arial', fill: '#cccccc' }
      ).setScrollFactor(0)
       .setDepth(100);
      
      // Marca de selección (inicialmente invisible excepto para el primero)
      const selected = this.scene.add.text(xPos - 15, yPos, '✓', 
        { font: '16px Arial', fill: '#ffffff' }
      ).setScrollFactor(0)
        .setVisible(color.value === hermandadData.habitColor)
        .setDepth(100);
      
      colorSample.on('pointerdown', () => {
        // Actualizar selección
        hermandadData.habitColor = color.value;
        
        // Actualizar marcas de selección
        colorOptions.forEach(opt => opt.setVisible(false));
        selected.setVisible(true);
        validateForm();
      });
      
      colorOptions.push(selected);
      colorTexts.push(colorText);
      colorSamples.push(colorSample);
    });
    
    // Ubicación
    const locationLabel = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 180,
      this.scene.cameras.main.height / 2 + 70,
      'Ubicación:',
      { font: '16px Arial', fill: '#ffffff' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    const locationText = this.scene.add.text(
      this.scene.cameras.main.width / 2 - 90,
      this.scene.cameras.main.height / 2 + 70,
      'Selecciona en el mapa',
      { font: '16px Arial', fill: '#ffff00' }
    ).setScrollFactor(0)
     .setDepth(100);
    
    // Estado de validación (inicialmente invisible)
    const validationText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 + 150,
      'Selecciona la ubicación para continuar',
      { font: '14px Arial', fill: '#ff6666', align: 'center' }
    ).setOrigin(0.5, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Instrucciones para seleccionar en el mapa
    const mapInstructions = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 + 110,
      'Haz clic en el mapa para elegir ubicación',
      { font: '14px Arial', fill: '#aaaaaa', align: 'center' }
    ).setOrigin(0.5, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Marcador de posición en el mapa (inicialmente invisible)
    const locationMarker = this.scene.add.circle(0, 0, 15, 0xff0000)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(false)
      .setDepth(100);
    
    // Efecto de resplandor para ayudar a visualizar el marcador
    const locationGlow = this.scene.add.circle(0, 0, 20, 0xff0000, 0.4)
      .setVisible(false)
      .setDepth(100);
    
    // Habilitar selección de ubicación en el mapa
    this.scene.input.on('pointerdown', this.handleFormMapClick);
    
    // Botón para crear la hermandad (inicialmente desactivado)
    const createButton = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2 + 200,
      'CREAR',
      {
        font: 'bold 18px Arial',
        fill: '#aaaaaa', // Color gris cuando está desactivado
        backgroundColor: '#666666',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setInteractive({ useHandCursor: true })
     .setDepth(100);
    
    // Función para validar el formulario
    const validateForm = () => {
      const isNameValid = hermandadData.name && hermandadData.name.length >= 3;
      const isLocationSelected = locationMarker.visible;
      
      hermandadData.isValid = isNameValid && isLocationSelected;
      
      // Actualizar estado del botón
      if (hermandadData.isValid) {
        createButton.setStyle({ 
          fill: '#ffffff',
          backgroundColor: '#1a237e'
        });
        validationText.setVisible(false);
      } else {
        createButton.setStyle({ 
          fill: '#aaaaaa',
          backgroundColor: '#666666'
        });
        
        // Mostrar mensaje de error específico
        if (!isNameValid) {
          validationText.setText('El nombre debe tener al menos 3 caracteres');
        } else if (!isLocationSelected) {
          validationText.setText('Selecciona una ubicación en el mapa');
        }
        validationText.setVisible(true);
      }
      
      return hermandadData.isValid;
    };
    
    // Configurar eventos del botón crear
    createButton.on('pointerover', () => {
      if (hermandadData.isValid) {
        createButton.setStyle({ backgroundColor: '#3949ab' });
      }
    });
    
    createButton.on('pointerout', () => {
      if (hermandadData.isValid) {
        createButton.setStyle({ backgroundColor: '#1a237e' });
      }
    });
    
    createButton.on('pointerdown', () => {
      // Verificar validación antes de crear
      if (!validateForm()) {
        // Mostrar mensaje de error si no es válido
        this.scene.cameras.main.shake(200, 0.01);
        return;
      }
      
      this.createBrotherhood(hermandadData);
    });
    
    // Almacenar referencias a todos los elementos del formulario
    this.formElements = [
      formBackground, formTitle, nombreLabel, nameInput, yearLabel, yearValue, 
      decreaseYearBtn, increaseYearBtn, mapInstructions, validationText,
      locationLabel, locationText, locationMarker, locationGlow,
      habitLabel, createButton, ...colorOptions, ...colorTexts, ...colorSamples
    ];
    
    // Almacenar referencias específicas para el manejo de clics
    this.formData = {
      hermandadData,
      locationMarker,
      locationGlow,
      locationText,
      validateForm
    };
    
    // Validar estado inicial
    validateForm();
  }
  
  /**
   * Maneja los clics en el mapa durante la creación de la hermandad
   * @param {Phaser.Input.Pointer} pointer - El puntero que generó el evento
   */
  handleFormMapClick(pointer) {
    if (!this.isCreatingBrotherhood || !this.formData) return;
    
    // Convertir coordenadas del mundo
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Actualizar datos y marcador
    this.formData.hermandadData.headquarters = { x: worldPoint.x, y: worldPoint.y };
    this.formData.locationMarker.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
    this.formData.locationGlow.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
    
    // Actualizar texto
    this.formData.locationText.setText(`X: ${Math.floor(worldPoint.x)}, Y: ${Math.floor(worldPoint.y)}`);
    this.formData.validateForm();
    
    // Hacer zoom y centrar en la ubicación seleccionada
    this.scene.cameras.main.pan(worldPoint.x, worldPoint.y, 500, 'Power2');
  }
  
  /**
   * Crea una hermandad con los datos proporcionados
   * @param {Object} data - Datos de la hermandad
   */
  createBrotherhood(data) {
    // Importar la clase Brotherhood
    const Brotherhood = require('../entities/Brotherhood.js').default;
    
    // Crear la hermandad con los datos del formulario
    const brotherhood = new Brotherhood({
      name: data.name,
      foundingDate: data.foundingDate,
      habitSpriteKey: data.habitColor, // Usamos el color como clave del sprite
      headquarters: data.headquarters
    });
    
    // Guardar hermandad en el juego
    this.brotherhood = brotherhood;
    this.scene.brotherhood = brotherhood; // Para compatibilidad
    
    if (window.gameData) {
      window.gameData.brotherhood = brotherhood;
    }
    
    // Cerrar el formulario y limpiar elementos
    this.isCreatingBrotherhood = false;
    
    if (this.scene.stateManager) {
      this.scene.stateManager.setState('IDLE');
    }
    
    // Verificar que cada elemento existe antes de destruirlo
    this.formElements.forEach(element => {
      if (element && !element.destroyed) {
        element.destroy();
      }
    });
    
    // Asegurarse de que la escucha de eventos del mapa para selección de ubicación sea cancelada
    this.scene.input.off('pointerdown', this.handleFormMapClick);
    
    // Limpiar datos del formulario
    this.formElements = [];
    this.formData = null;
    
    // Crear una interfaz informativa para la hermandad
    this.createBrotherhoodInterface(brotherhood);
    
    // Mostrar mensaje de confirmación
    if (this.scene.uiManager) {
      this.scene.uiManager.showMessage(`¡Hermandad "${brotherhood.name}" fundada en ${brotherhood.foundingDate}!`);
    }
  }
  
  /**
   * Crea una interfaz para mostrar la información de la hermandad
   * @param {Brotherhood} brotherhood - La hermandad a mostrar
   */
  createBrotherhoodInterface(brotherhood) {
    // Eliminar interfaz anterior si existe
    if (this.brotherhoodInterface) {
      Object.values(this.brotherhoodInterface).forEach(el => {
        if (el && el.destroy) el.destroy();
      });
    }
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Fondo del panel (semi-transparente)
    const panelBg = this.scene.add.rectangle(20, height - 150, 280, 180, 0x000000, 0.8)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff)
      .setName('brotherhoodPanelBg')
      .setData('isUI', true);
    
    // Contenedor para todos los elementos de la interfaz
    const container = this.scene.add.container(0, 0);
    container.setScrollFactor(0);
    container.setData('isUI', true);
    container.setName('brotherhoodInfoContainer');
    
    // Título de la hermandad
    const title = this.scene.add.text(
      30,
      height - 145,
      brotherhood.name,
      {
        font: 'bold 18px Arial',
        fill: '#ffffff'
      }
    ).setName('brotherhoodTitle').setData('isUI', true);
    container.add(title);
    
    // Subtítulo (año de fundación)
    const foundingYear = this.scene.add.text(
      30,
      height - 120,
      `Fundación: ${brotherhood.foundingYear || brotherhood.foundingDate}`,
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setName('brotherhoodYear').setData('isUI', true);
    container.add(foundingYear);
    
    // Indicador de color del hábito
    const habitColorText = this.scene.add.text(
      30,
      height - 100,
      'Color del hábito:',
      {
        font: '14px Arial',
        fill: '#cccccc'
      }
    ).setName('habitColorLabel').setData('isUI', true);
    container.add(habitColorText);
    
    // Representación visual del color
    let colorHex;
    switch (brotherhood.habitSpriteKey) {
      case 'purple': colorHex = 0x800080; break;
      case 'black': colorHex = 0x000000; break;
      case 'white': colorHex = 0xffffff; break;
      case 'red': colorHex = 0xff0000; break;
      case 'green': colorHex = 0x008800; break;
      case 'blue': colorHex = 0x0000ff; break;
      default: colorHex = 0x800080;
    }
    
    const colorSwatch = this.scene.add.rectangle(
      150,
      height - 93,
      30,
      15,
      colorHex
    ).setStrokeStyle(1, 0xffffff)
      .setName('habitColorSwatch')
      .setData('isUI', true);
    container.add(colorSwatch);
    
    // Botón para centrar la cámara en la sede
    const centerButton = this.scene.add.text(
      30,
      height - 75,
      'Ir a la sede',
      {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#1a237e',
        padding: { x: 8, y: 4 }
      }
    ).setInteractive({ useHandCursor: true })
      .setName('centerHQButton')
      .setData('isUI', true);
    container.add(centerButton);
    
    // Evento para centrar la cámara en la sede
    centerButton.on('pointerdown', () => {
      if (brotherhood.headquarters) {
        this.scene.cameras.main.pan(
          brotherhood.headquarters.x,
          brotherhood.headquarters.y,
          1000,
          'Power2'
        );
      }
    });
    
    // Efectos de hover para el botón
    centerButton.on('pointerover', () => {
      centerButton.setStyle({ backgroundColor: '#3949ab' });
    });
    
    centerButton.on('pointerout', () => {
      centerButton.setStyle({ backgroundColor: '#1a237e' });
    });
    
    // Estado de la procesión
    const processionStatus = this.scene.add.text(
      30,
      height - 45,
      'Estado: Sin procesar',
      {
        font: '14px Arial',
        fill: '#ffffff'
      }
    ).setName('processionStatus').setData('isUI', true);
    container.add(processionStatus);
    
    // Guardar referencia a todos los elementos de la interfaz
    this.brotherhoodInterface = {
      panel: panelBg,
      container: container,
      title: title,
      foundingYear: foundingYear,
      habitColorText: habitColorText,
      colorSwatch: colorSwatch,
      centerButton: centerButton,
      processionStatus: processionStatus
    };
    
    // Crear un marcador permanente en el mapa para la sede
    this.createHeadquartersMarker(brotherhood);
    
    return this.brotherhoodInterface;
  }
  
  /**
   * Actualiza las posiciones de los elementos de la interfaz de la hermandad
   */
  updateInterfacePositions() {
    if (!this.brotherhoodInterface) return;
    
    const height = this.scene.cameras.main.height;
    
    // Reposicionar panel principal
    this.brotherhoodInterface.panel.setPosition(20, height - 150);
    
    // Actualizar posiciones de todos los elementos
    this.brotherhoodInterface.title.setPosition(30, height - 145);
    this.brotherhoodInterface.foundingYear.setPosition(30, height - 120);
    this.brotherhoodInterface.habitColorText.setPosition(30, height - 100);
    this.brotherhoodInterface.colorSwatch.setPosition(150, height - 93);
    this.brotherhoodInterface.centerButton.setPosition(30, height - 75);
    this.brotherhoodInterface.processionStatus.setPosition(30, height - 45);
  }
  
  /**
   * Actualiza el estado de la procesión en la interfaz
   * @param {string} status - Texto del estado
   * @param {string} color - Color del texto
   */
  updateProcessionStatus(status, color) {
    if (!this.brotherhoodInterface || !this.brotherhoodInterface.processionStatus) return;
    
    this.brotherhoodInterface.processionStatus.setText(`Estado: ${status}`);
    this.brotherhoodInterface.processionStatus.setStyle({ fill: color });
  }
  
  /**
   * Crea un marcador permanente en el mapa para la sede de la hermandad
   * @param {Brotherhood} brotherhood - La hermandad cuya sede se va a marcar
   */
  createHeadquartersMarker(brotherhood) {
    if (!brotherhood || !brotherhood.headquarters) return;
    
    // Eliminar marcador anterior si existe
    if (this.headquartersMarker) {
      this.headquartersMarker.destroy();
    }
    
    // Grupo para contener todos los elementos del marcador
    const markerGroup = this.scene.add.group();
    
    // Crear efecto de resplandor exterior
    const outerGlow = this.scene.add.circle(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      25,
      0xffffff,
      0.3
    ).setStrokeStyle(2, 0xffffff, 0.5);
    
    // Crear círculo principal (usando el color del hábito)
    let colorHex = 0x800080; // Morado por defecto
    switch(brotherhood.habitSpriteKey) {
      case 'purple': colorHex = 0x800080; break;
      case 'black': colorHex = 0x000000; break;
      case 'white': colorHex = 0xffffff; break;
      case 'red': colorHex = 0xff0000; break;
      case 'green': colorHex = 0x008800; break;
      case 'blue': colorHex = 0x0000ff; break;
    }
    
    const mainMarker = this.scene.add.circle(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      15,
      colorHex,
      1
    ).setStrokeStyle(2, 0xffffff);
    
    // Añadir icono de cruz en el centro
    const cross = this.scene.add.text(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y,
      '✝',
      { font: 'bold 16px Arial', fill: '#ffffff' }
    ).setOrigin(0.5, 0.5);
    
    // Añadir texto con el nombre de la hermandad
    const nameTag = this.scene.add.text(
      brotherhood.headquarters.x,
      brotherhood.headquarters.y + 35,
      brotherhood.name,
      { 
        font: 'bold 14px Arial', 
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      }
    ).setOrigin(0.5, 0.5)
      .setAlpha(0.85);
    
    // Agregar todos los elementos al grupo
    markerGroup.add(outerGlow);
    markerGroup.add(mainMarker);
    markerGroup.add(cross);
    markerGroup.add(nameTag);
    
    // Añadir un pulso animado al marcador
    this.scene.tweens.add({
      targets: outerGlow,
      alpha: { start: 0.3, to: 0.6 },
      scaleX: { start: 1, to: 1.2 },
      scaleY: { start: 1, to: 1.2 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
    
    // Guardar referencia al marcador en la escena
    this.headquartersMarker = markerGroup;
    
    // Hacer que el marcador sea interactivo para mostrar información al hacer clic
    mainMarker.setInteractive({ useHandCursor: true });
    mainMarker.on('pointerdown', () => {
      // Centrar en la sede
      this.scene.cameras.main.pan(
        brotherhood.headquarters.x,
        brotherhood.headquarters.y,
        500,
        'Power2'
      );
      
      // Mostrar mensaje
      if (this.scene.uiManager) {
        this.scene.uiManager.showMessage(`Sede de ${brotherhood.name}`);
      }
    });
    
    return this.headquartersMarker;
  }
  
  /**
   * Obtiene la hermandad actual
   * @returns {Brotherhood} - La hermandad actual o null
   */
  getBrotherhood() {
    return this.brotherhood;
  }
  
  /**
   * Destruye todos los recursos
   */
  destroy() {
    // Eliminar la interfaz de la hermandad
    if (this.brotherhoodInterface) {
      Object.values(this.brotherhoodInterface).forEach(el => {
        if (el && el.destroy) el.destroy();
      });
      this.brotherhoodInterface = null;
    }
    
    // Eliminar el marcador de la sede
    if (this.headquartersMarker) {
      this.headquartersMarker.destroy();
      this.headquartersMarker = null;
    }
    
    // Eliminar elementos del formulario si existen
    this.formElements.forEach(element => {
      if (element && !element.destroyed) {
        element.destroy();
      }
    });
    this.formElements = [];
    
    // Eliminar manejador de eventos
    this.scene.input.off('pointerdown', this.handleFormMapClick);
    
    // Limpiar datos
    this.formData = null;
    this.isCreatingBrotherhood = false;
  }
} 
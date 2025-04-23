// Intentamos importar el módulo de diagnóstico
import diagnostico, { testModulo } from './diagnostico.js';

// Registramos en consola para verificar
console.log("Archivo main.js ejecutándose");

try {
  // Probamos que el módulo se cargue
  const testResult = testModulo();
  console.log("Resultado del test de módulo:", testResult);
  console.log("Información del módulo:", diagnostico.nombre, diagnostico.version);
  
  if (document.getElementById('estado')) {
    document.getElementById('estado').textContent = 'Estado: Módulos ES cargados correctamente';
  }
} catch (e) {
  console.error("Error al cargar módulos ES:", e);
  
  if (document.getElementById('estado')) {
    document.getElementById('estado').textContent = 'Estado: ERROR al cargar módulos ES - ' + e.message;
  }
}

/*
// Escena básica para pruebas
class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  create() {
    console.log('TestScene creada correctamente');
    this.add.text(100, 100, 'TestScene funciona!', { font: '24px Arial', fill: '#ffffff' });
    this.add.rectangle(400, 300, 200, 200, 0xff0000);
  }
}
*/

// Importamos las escenas originales
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

/**
 * Configuración principal del juego Phaser
 */
const config = {
  type: Phaser.AUTO, // WebGL por defecto, Canvas como fallback
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#333333',
  // Comentamos la escena de prueba
  // scene: [TestScene],
  // Usamos las escenas originales
  scene: [BootScene, MenuScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Intentamos crear el juego dentro de un try-catch para capturar errores
try {
  console.log('Iniciando Phaser...');
  const game = new Phaser.Game(config);
  console.log('Phaser inicializado correctamente');
  
  // Informamos al diagnóstico
  if (document.getElementById('estado')) {
    document.getElementById('estado').textContent = 'Estado: Juego Phaser inicializado correctamente';
  }
  
  // Variables globales para usar a través del juego
  window.gameData = {
    brotherhood: null,
    currentYear: 1550
  };
  
} catch (error) {
  console.error('Error al inicializar Phaser:', error);
  
  // Informamos al diagnóstico
  if (document.getElementById('estado')) {
    document.getElementById('estado').textContent = 'Estado: ERROR al inicializar Phaser - ' + error.message;
  }
} 
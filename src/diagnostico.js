/**
 * Script de diagnóstico para verificar la carga de módulos ES
 */

// Función simple para probar que los módulos ES se cargan correctamente
export function testModulo() {
  console.log("El módulo de diagnóstico se ha cargado correctamente");
  return true;
}

// Exportación por defecto
export default {
  nombre: "Módulo de diagnóstico",
  version: "1.0",
  test: function() {
    console.log("Test de módulo ejecutado");
    return "OK";
  }
}; 
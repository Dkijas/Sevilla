# Simulador de Gestión de Hermandades - Sevilla 1550-2050

Juego de simulación histórica para la gestión de hermandades en Sevilla, que abarca desde el año 1550 hasta el 2050, permitiendo tanto recrear la historia como proyectar el futuro de las cofradías sevillanas.

## Características

- **Simulación histórica precisa**: Recreación de eventos históricos que afectaron a las hermandades sevillanas.
- **Mapa interactivo**: Basado en la geografía real de Sevilla con rutas procesionales.
- **Gestión completa**: Creación y desarrollo de hermandades a lo largo de 500 años.
- **Procesiones animadas**: Representación visual de nazarenos y pasos.
- **Audio inmersivo**: Incorporación de marchas procesionales tradicionales.

## Requisitos técnicos

Este proyecto utiliza las siguientes tecnologías:

- HTML5
- JavaScript
- [Phaser 3](https://phaser.io/) para el motor del juego
- [Howler.js](https://howlerjs.com/) para gestión de audio

## Estructura del proyecto

```
/
├── index.html              # Página principal del juego
├── src/                    # Código fuente
│   ├── main.js             # Punto de entrada
│   ├── scenes/             # Escenas del juego
│   │   ├── BootScene.js    # Carga inicial
│   │   ├── MenuScene.js    # Menú principal
│   │   └── GameScene.js    # Escena principal
│   ├── entities/           # Entidades del juego
│   │   ├── Brotherhood.js  # Clase Hermandad
│   │   ├── Nazareno.js     # Clase Nazareno
│   │   └── Paso.js         # Clase Paso
│   └── managers/           # Gestores de juego
│       └── TimeManager.js  # Control del tiempo
├── assets/                 # Recursos del juego
│   ├── images/             # Imágenes y sprites
│   ├── audio/              # Archivos de audio
│   └── tilemaps/           # Mapas de niveles
└── data/                   # Datos del juego
    └── hermandades.json    # Datos históricos
```

## Instrucciones para desarrolladores

1. **Preparación del proyecto**:
   - No se requiere instalación adicional, ya que las dependencias se cargan vía CDN

2. **Ejecución del proyecto**:
   - Para desarrollo local, se recomienda usar un servidor web simple
   - Puedes utilizar extensiones como "Live Server" en Visual Studio Code
   - Alternativamente: `python -m http.server` en la carpeta raíz

3. **Creación de assets**:
   - Los archivos necesarios para los sprites, tilemaps y audio deben colocarse en sus respectivas carpetas dentro de `assets/`

## Licencia

Este proyecto es académico y de ejemplo. 
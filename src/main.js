import * as THREE from 'three';
import { World } from './world/World.js';
import { Player } from './player/Player.js';
import { InputManager } from './input/InputManager.js';
import { MinecraftUIManager } from './ui/MinecraftUIManager.js';
import { RealisticCropManager } from './crops/RealisticCropManager.js';
import { EnhancedRootSystem } from './crops/EnhancedRootSystem.js';
import { AudioManager } from './audio/AudioManager.js';
import { ParticleManager } from './effects/ParticleManager.js';
import { APIStatusManager } from './ui/APIStatusManager.js';
import { ToolManager } from './tools/ToolManager.js';

class MinecraftFarmSimulator {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.gameStarted = false;
    this.cropsLoaded = false;
    
    // Time management
    this.gameTime = {
      day: 1,
      hour: 6,
      minute: 0,
      timeSpeed: 0.1
    };
    
    this.setupRenderer();
    this.setupMinecraftLighting();
    
    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.camera);
    this.inputManager = new InputManager();
    this.uiManager = new MinecraftUIManager();
    this.cropManager = new RealisticCropManager(this.scene);
    this.rootSystem = new EnhancedRootSystem(this.scene);
    this.audioManager = new AudioManager();
    this.particleManager = new ParticleManager(this.scene);
    this.apiStatusManager = new APIStatusManager();
    this.toolManager = new ToolManager(this.scene, this.camera);
    
    this.setupEventListeners();
    
    // Start the game immediately
    this.startGame();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB); // Minecraft sky blue
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Light fog for distance
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
  }

  setupMinecraftLighting() {
    // Ambient light (bright like Minecraft)
    const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.updateSunPosition();

    // Hemisphere light for natural outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x7CB342, 0.4);
    this.scene.add(hemisphereLight);
  }

  updateSunPosition() {
    const hourProgress = (this.gameTime.hour + this.gameTime.minute / 60) / 24;
    const sunAngle = (hourProgress - 0.25) * Math.PI * 2;
    
    this.sunLight.position.set(
      Math.cos(sunAngle) * 200,
      Math.max(50, Math.sin(sunAngle) * 200),
      Math.sin(sunAngle) * 100
    );
    
    // Adjust lighting intensity based on time
    const intensity = Math.max(0.8, Math.sin(sunAngle) * 1.5);
    this.sunLight.intensity = intensity;
    
    // Update sky color based on time
    let skyColor = 0x87CEEB; // Default day sky
    if (this.sunLight.position.y < 20) {
      skyColor = 0x2C1810; // Night
    } else if (this.sunLight.position.y < 50) {
      skyColor = 0xFF6B47; // Sunset/sunrise
    }
    
    this.renderer.setClearColor(skyColor);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(skyColor);
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    
    // UI event listeners
    this.uiManager.onCropAction = async (action, crop) => {
      // Handle harvest action specially
      if (action === 'harvest') {
        if (crop.growth >= 80 && crop.health > 30) {
          // Start harvest animation
          const success = this.player.startHarvest(crop, async () => {
            // Complete the harvest after animation
            await this.cropManager.handleCropAction(action, crop);
            this.particleManager.createActionParticles(crop.position, action);
            this.audioManager.playSound(action);
          });
          
          if (!success) {
            console.log('Cannot harvest - already harvesting another crop');
          }
          return;
        } else {
          console.log('Crop is not ready for harvest or too unhealthy');
          return;
        }
      }

      // Animate tool based on action
      if (action === 'water') {
        this.toolManager.switchTool('watering_can');
        this.toolManager.animateTool('water');
      } else if (action === 'fertilize') {
        this.toolManager.switchTool('fertilizer');
        this.toolManager.animateTool('use');
      } else if (action === 'fix') {
        this.toolManager.switchTool('shears');
        this.toolManager.animateTool('use');
      }

      if (action === 'ai_analyze') {
        const analysis = await this.cropManager.performAIAnalysis(crop);
        return analysis;
      } else {
        await this.cropManager.handleCropAction(action, crop);
        this.particleManager.createActionParticles(crop.position, action);
        this.audioManager.playSound(action);
      }
    };

    // Root view toggle
    this.uiManager.onRootViewToggle = () => {
      return this.rootSystem.toggleRootView();
    };

    // Interaction with E key
    this.inputManager.onInteract = () => {
      if (!this.cropsLoaded || this.player.isHarvesting()) return;
      
      const targetCrop = this.getTargetCrop();
      if (targetCrop) {
        this.uiManager.showPlantDetails(targetCrop);
      }
    };

    // Load crops in background
    this.loadCropsAsync();
  }

  async loadCropsAsync() {
    try {
      await this.cropManager.loadCrops();
      
      this.cropManager.crops.forEach(crop => {
        if (crop && crop.cropInfo) {
          this.rootSystem.createAdvancedRootSystem(
            crop.cropInfo, 
            crop.growth / 100, 
            crop.position
          );
        }
      });
      
      this.cropsLoaded = true;
      console.log(`Created ${this.cropManager.crops.length} crops successfully`);
    } catch (error) {
      console.error('Failed to load crops:', error);
      this.cropsLoaded = true;
    }
  }

  async startGame() {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    console.log('Minecraft Farm Simulator started!');
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getTargetCrop() {
    if (!this.cropsLoaded || !this.cropManager.crops.length) return null;
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    try {
      const cropMeshes = this.cropManager.crops
        .filter(crop => crop && crop.mesh && !crop.isHarvested)
        .map(crop => crop.mesh);
      
      if (cropMeshes.length === 0) return null;
      
      const intersects = this.raycaster.intersectObjects(cropMeshes, true);
      
      if (intersects.length > 0 && intersects[0].distance < 8) {
        const intersectedMesh = intersects[0].object.parent || intersects[0].object;
        return this.cropManager.crops.find(crop => crop && crop.mesh === intersectedMesh && !crop.isHarvested);
      }
    } catch (error) {
      console.warn('Raycasting error:', error);
    }
    
    return null;
  }

  updateGameTime(deltaTime) {
    this.gameTime.minute += deltaTime * this.gameTime.timeSpeed;
    
    if (this.gameTime.minute >= 60) {
      this.gameTime.minute = 0;
      this.gameTime.hour += 1;
      
      if (this.gameTime.hour >= 24) {
        this.gameTime.hour = 0;
        this.gameTime.day += 1;
      }
      
      this.updateSunPosition();
    }
    
    this.uiManager.setGameTime(this.gameTime);
  }

  animate() {
    if (!this.gameStarted) return;
    
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update game time
    this.updateGameTime(deltaTime);
    
    // Update player
    this.player.update(this.inputManager, deltaTime);
    
    // Create walking particles (only when not harvesting)
    if (this.player.isMoving && this.player.isGrounded && !this.player.isHarvesting()) {
      if (Math.random() < 0.08) {
        this.particleManager.createWalkingParticles(this.player.position);
      }
    }
    
    // Check for crop interaction (only when not harvesting)
    let targetCrop = null;
    if (this.cropsLoaded && !this.player.isHarvesting()) {
      targetCrop = this.getTargetCrop();
    }
    
    // Update UI
    this.uiManager.update(deltaTime, targetCrop);
    
    // Update API status
    this.apiStatusManager.update();
    
    // Update crop systems
    if (this.cropsLoaded) {
      this.cropManager.update(deltaTime * 0.1);
    }
    
    // Update root system
    this.rootSystem.update(deltaTime);
    
    // Update particles
    this.particleManager.update(deltaTime);
    
    // Update tools
    this.toolManager.update(deltaTime);
    
    // Add subtle camera effects (only in first person)
    if (!this.player.isInThirdPerson()) {
      this.addCameraEffects(deltaTime);
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  addCameraEffects(deltaTime) {
    const time = Date.now() * 0.001;
    
    // Very subtle breathing effect
    const breathingIntensity = 0.001;
    this.camera.position.y += Math.sin(time * 0.5) * breathingIntensity;
    
    // Subtle head bob when moving
    if (this.player.isMoving && !this.player.isHarvesting()) {
      const bobIntensity = 0.005;
      this.camera.position.y += Math.sin(time * 8) * bobIntensity;
    }
  }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  new MinecraftFarmSimulator();
});
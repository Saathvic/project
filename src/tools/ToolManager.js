import * as THREE from 'three';

export class ToolManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentTool = 'hoe';
    this.toolMesh = null;
    this.tools = {
      hoe: { name: 'Hoe', icon: '🔨', color: 0x8D6E63 },
      watering_can: { name: 'Watering Can', icon: '💧', color: 0x2196F3 },
      seeds: { name: 'Seeds', icon: '🌱', color: 0x4CAF50 },
      fertilizer: { name: 'Fertilizer', icon: '💊', color: 0xFFEB3B },
      shears: { name: 'Shears', icon: '✂️', color: 0x9E9E9E },
      harvest_basket: { name: 'Harvest Basket', icon: '🧺', color: 0x8D6E63 }
    };
    
    this.createToolInHand();
    this.setupToolSwitching();
  }

  createToolInHand() {
    this.removeCurrentTool();
    
    const tool = this.tools[this.currentTool];
    const toolGroup = new THREE.Group();
    
    switch (this.currentTool) {
      case 'hoe':
        this.createHoe(toolGroup);
        break;
      case 'watering_can':
        this.createWateringCan(toolGroup);
        break;
      case 'seeds':
        this.createSeedBag(toolGroup);
        break;
      case 'fertilizer':
        this.createFertilizerBag(toolGroup);
        break;
      case 'shears':
        this.createShears(toolGroup);
        break;
      case 'harvest_basket':
        this.createBasket(toolGroup);
        break;
    }
    
    // Position tool in front of camera
    toolGroup.position.set(0.8, -0.5, -1.5);
    toolGroup.rotation.set(-0.2, 0.3, 0);
    
    this.toolMesh = toolGroup;
    this.camera.add(toolGroup);
  }

  createHoe(group) {
    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = 0.6;
    group.add(handle);
    
    // Blade
    const bladeGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.15);
    const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x757575 });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.set(0, 1.2, 0);
    blade.rotation.z = Math.PI / 2;
    group.add(blade);
  }

  createWateringCan(group) {
    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2196F3 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.15;
    group.add(body);
    
    // Spout
    const spoutGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6);
    const spout = new THREE.Mesh(spoutGeometry, bodyMaterial);
    spout.position.set(0.2, 0.2, 0);
    spout.rotation.z = -Math.PI / 4;
    group.add(spout);
    
    // Handle
    const handleGeometry = new THREE.TorusGeometry(0.08, 0.02, 4, 8);
    const handle = new THREE.Mesh(handleGeometry, bodyMaterial);
    handle.position.set(-0.15, 0.2, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);
  }

  createSeedBag(group) {
    // Bag
    const bagGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.15);
    const bagMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const bag = new THREE.Mesh(bagGeometry, bagMaterial);
    bag.position.y = 0.15;
    group.add(bag);
    
    // Seeds spilling out
    for (let i = 0; i < 5; i++) {
      const seedGeometry = new THREE.SphereGeometry(0.01, 4, 4);
      const seedMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
      const seed = new THREE.Mesh(seedGeometry, seedMaterial);
      seed.position.set(
        (Math.random() - 0.5) * 0.1,
        0.3 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      group.add(seed);
    }
  }

  createFertilizerBag(group) {
    // Bag
    const bagGeometry = new THREE.BoxGeometry(0.18, 0.25, 0.12);
    const bagMaterial = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
    const bag = new THREE.Mesh(bagGeometry, bagMaterial);
    bag.position.y = 0.125;
    group.add(bag);
    
    // Label
    const labelGeometry = new THREE.PlaneGeometry(0.15, 0.08);
    const labelMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 0.125, 0.061);
    group.add(label);
  }

  createShears(group) {
    // Handle 1
    const handle1Geometry = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const handle1 = new THREE.Mesh(handle1Geometry, handleMaterial);
    handle1.position.set(-0.02, 0.15, 0);
    handle1.rotation.z = 0.2;
    group.add(handle1);
    
    // Handle 2
    const handle2 = new THREE.Mesh(handle1Geometry, handleMaterial);
    handle2.position.set(0.02, 0.15, 0);
    handle2.rotation.z = -0.2;
    group.add(handle2);
    
    // Blade 1
    const bladeGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.01);
    const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x757575 });
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.position.set(-0.05, 0.3, 0);
    blade1.rotation.z = 0.1;
    group.add(blade1);
    
    // Blade 2
    const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.position.set(0.05, 0.3, 0);
    blade2.rotation.z = -0.1;
    group.add(blade2);
  }

  createBasket(group) {
    // Basket body
    const basketGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.25, 8, 1, true);
    const basketMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8D6E63,
      side: THREE.DoubleSide
    });
    const basket = new THREE.Mesh(basketGeometry, basketMaterial);
    basket.position.y = 0.125;
    group.add(basket);
    
    // Handle
    const handleGeometry = new THREE.TorusGeometry(0.12, 0.02, 4, 8, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, basketMaterial);
    handle.position.y = 0.3;
    handle.rotation.x = Math.PI;
    group.add(handle);
    
    // Bottom
    const bottomGeometry = new THREE.CircleGeometry(0.15, 8);
    const bottom = new THREE.Mesh(bottomGeometry, basketMaterial);
    bottom.position.y = 0;
    bottom.rotation.x = -Math.PI / 2;
    group.add(bottom);
  }

  setupToolSwitching() {
    document.addEventListener('keydown', (event) => {
      const toolKeys = {
        'Digit1': 'hoe',
        'Digit2': 'watering_can',
        'Digit3': 'seeds',
        'Digit4': 'fertilizer',
        'Digit5': 'shears',
        'Digit6': 'harvest_basket'
      };
      
      if (toolKeys[event.code]) {
        this.switchTool(toolKeys[event.code]);
      }
    });

    // Mouse wheel for tool switching
    document.addEventListener('wheel', (event) => {
      if (document.pointerLockElement) {
        event.preventDefault();
        const toolNames = Object.keys(this.tools);
        const currentIndex = toolNames.indexOf(this.currentTool);
        let newIndex;
        
        if (event.deltaY > 0) {
          newIndex = (currentIndex + 1) % toolNames.length;
        } else {
          newIndex = (currentIndex - 1 + toolNames.length) % toolNames.length;
        }
        
        this.switchTool(toolNames[newIndex]);
      }
    });
  }

  switchTool(toolName) {
    if (this.tools[toolName] && toolName !== this.currentTool) {
      this.currentTool = toolName;
      this.createToolInHand();
      
      // Update UI
      this.updateToolUI();
      
      // Play tool switch sound
      this.playToolSwitchSound();
    }
  }

  updateToolUI() {
    // Update tool display in UI
    const toolDisplay = document.getElementById('currentTool');
    if (toolDisplay) {
      const tool = this.tools[this.currentTool];
      toolDisplay.innerHTML = `
        <span class="tool-icon">${tool.icon}</span>
        <span class="tool-name">${tool.name}</span>
      `;
    }
  }

  playToolSwitchSound() {
    // Simple tool switch sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Audio not supported
    }
  }

  removeCurrentTool() {
    if (this.toolMesh) {
      this.camera.remove(this.toolMesh);
      this.toolMesh = null;
    }
  }

  getCurrentTool() {
    return this.currentTool;
  }

  getToolInfo(toolName) {
    return this.tools[toolName];
  }

  animateTool(action) {
    if (!this.toolMesh) return;
    
    // Simple tool animation
    const originalRotation = { ...this.toolMesh.rotation };
    
    switch (action) {
      case 'use':
        // Swing animation
        this.toolMesh.rotation.x -= 0.5;
        setTimeout(() => {
          if (this.toolMesh) {
            this.toolMesh.rotation.x = originalRotation.x;
          }
        }, 200);
        break;
      case 'water':
        // Tilt animation for watering can
        this.toolMesh.rotation.z += 0.3;
        setTimeout(() => {
          if (this.toolMesh) {
            this.toolMesh.rotation.z = originalRotation.z;
          }
        }, 300);
        break;
    }
  }

  update(deltaTime) {
    if (this.toolMesh) {
      // Subtle tool bobbing animation
      const time = Date.now() * 0.001;
      this.toolMesh.position.y = -0.5 + Math.sin(time * 2) * 0.02;
    }
  }

  dispose() {
    this.removeCurrentTool();
  }
}
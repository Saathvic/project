import * as THREE from 'three';

export class InterstellarUIManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // UI Groups
    this.hudGroup = new THREE.Group();
    this.crosshairGroup = new THREE.Group();
    this.panelGroup = new THREE.Group();
    this.textElements = [];
    
    this.scene.add(this.hudGroup);
    this.scene.add(this.crosshairGroup);
    this.scene.add(this.panelGroup);
    
    // State
    this.gameTime = { day: 1, hour: 6, minute: 0 };
    this.weather = { icon: '☀️', temp: 22, humidity: 65 };
    this.showingInstructions = true;
    this.currentCrop = null;
    this.rootViewActive = false;
    
    // Callbacks
    this.onCropAction = null;
    this.onRootViewToggle = null;
    
    this.createInterstellarHUD();
    this.createInterstellarCrosshair();
    this.createInterstellarInstructions();
    
    // Setup keyboard controls
    this.setupKeyboardControls();
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyR':
          this.toggleRootView();
          break;
        case 'KeyH':
          this.toggleInstructions();
          break;
        case 'Escape':
          this.hideAllPanels();
          break;
      }
    });
  }

  createInterstellarText(text, options = {}) {
    const {
      position = [0, 0, 0],
      size = 0.3,
      color = '#00D4FF',
      font = 'Arial',
      weight = 'normal',
      opacity = 0.9,
      glow = true
    } = options;

    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // High resolution for crisp text
    const scale = 4;
    canvas.width = 2048 * scale;
    canvas.height = 512 * scale;
    context.scale(scale, scale);

    // Clear canvas
    context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

    // Set font properties
    const fontSize = size * 200;
    context.font = `${weight} ${fontSize}px ${font}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Create glow effect if enabled
    if (glow) {
      context.shadowColor = color;
      context.shadowBlur = 20;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    }

    // Draw text with Interstellar-style glow
    context.fillStyle = color;
    context.fillText(text, canvas.width / (2 * scale), canvas.height / (2 * scale));

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create material with Interstellar-style properties
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });

    // Create geometry
    const textWidth = text.length * size * 0.6;
    const textHeight = size * 2;
    const geometry = new THREE.PlaneGeometry(textWidth, textHeight);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);

    // Store update function
    mesh.userData = {
      originalText: text,
      updateText: (newText) => {
        context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
        if (glow) {
          context.shadowColor = color;
          context.shadowBlur = 20;
        }
        context.fillStyle = color;
        context.fillText(newText, canvas.width / (2 * scale), canvas.height / (2 * scale));
        texture.needsUpdate = true;
        mesh.userData.originalText = newText;
      }
    };

    this.textElements.push(mesh);
    return mesh;
  }

  createInterstellarHUD() {
    // Weather display with Interstellar styling
    this.weatherText = this.createInterstellarText('☀️ 22°C | 65% HUMIDITY', {
      position: [-8, 4.5, -10],
      size: 0.25,
      color: '#00D4FF',
      weight: 'bold'
    });
    this.hudGroup.add(this.weatherText);

    // Time display
    this.timeText = this.createInterstellarText('DAY 001 | 06:00', {
      position: [0, 4.5, -10],
      size: 0.3,
      color: '#FFD700',
      weight: 'bold'
    });
    this.hudGroup.add(this.timeText);

    // Controls display
    this.controlsText = this.createInterstellarText('[R] ROOT VIEW | [H] HELP', {
      position: [6, 4.5, -10],
      size: 0.2,
      color: '#00FF88',
      weight: 'normal'
    });
    this.hudGroup.add(this.controlsText);

    // Root view indicator (initially hidden)
    this.rootViewIndicator = this.createInterstellarText('◉ ROOT ANALYSIS MODE ACTIVE', {
      position: [0, 4, -10],
      size: 0.25,
      color: '#FF6B47',
      weight: 'bold',
      glow: true
    });
    this.rootViewIndicator.visible = false;
    this.hudGroup.add(this.rootViewIndicator);
  }

  createInterstellarCrosshair() {
    // Create advanced crosshair with Interstellar styling
    const crosshairGroup = new THREE.Group();

    // Main crosshair lines
    const createCrosshairLine = (start, end, color = '#00D4FF') => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([...start, ...end]);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });
      
      return new THREE.Line(geometry, material);
    };

    // Horizontal and vertical lines
    const hLine = createCrosshairLine([-0.15, 0, 0], [0.15, 0, 0]);
    const vLine = createCrosshairLine([0, -0.15, 0], [0, 0.15, 0]);
    
    crosshairGroup.add(hLine);
    crosshairGroup.add(vLine);

    // Corner brackets for targeting feel
    const corners = [
      [[-0.3, 0.3, 0], [-0.2, 0.3, 0]], [[-0.3, 0.3, 0], [-0.3, 0.2, 0]], // Top-left
      [[0.3, 0.3, 0], [0.2, 0.3, 0]], [[0.3, 0.3, 0], [0.3, 0.2, 0]], // Top-right
      [[-0.3, -0.3, 0], [-0.2, -0.3, 0]], [[-0.3, -0.3, 0], [-0.3, -0.2, 0]], // Bottom-left
      [[0.3, -0.3, 0], [0.2, -0.3, 0]], [[0.3, -0.3, 0], [0.3, -0.2, 0]] // Bottom-right
    ];

    corners.forEach(([start, end]) => {
      const corner = createCrosshairLine(start, end, '#FFD700');
      corner.material.opacity = 0.6;
      crosshairGroup.add(corner);
    });

    crosshairGroup.position.set(0, 0, -5);
    this.crosshair = crosshairGroup;
    this.crosshairGroup.add(crosshairGroup);

    // Crosshair hint text
    this.crosshairHint = this.createInterstellarText('', {
      position: [0, -1.2, -5],
      size: 0.18,
      color: '#00FF88',
      weight: 'bold'
    });
    this.crosshairHint.visible = false;
    this.crosshairGroup.add(this.crosshairHint);
  }

  createInterstellarInstructions() {
    // Create holographic-style instruction panel
    const panelGeometry = new THREE.PlaneGeometry(14, 10);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    
    this.instructionPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.instructionPanel.position.set(0, 0, -8);
    this.panelGroup.add(this.instructionPanel);

    // Add border glow effect
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#00D4FF',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.instructionPanel.position);
    this.panelGroup.add(border);

    // Title
    this.instructionTitle = this.createInterstellarText('AGRICULTURAL SIMULATION PROTOCOL', {
      position: [0, 3.5, -7.9],
      size: 0.4,
      color: '#FFD700',
      weight: 'bold'
    });
    this.panelGroup.add(this.instructionTitle);

    // Subtitle
    this.instructionSubtitle = this.createInterstellarText('INTERSTELLAR FARMING INITIATIVE', {
      position: [0, 3, -7.9],
      size: 0.25,
      color: '#00D4FF',
      weight: 'normal'
    });
    this.panelGroup.add(this.instructionSubtitle);

    // Instructions with Interstellar styling
    const instructions = [
      { text: '[WASD] NAVIGATION CONTROLS', color: '#00FF88' },
      { text: '[MOUSE] VISUAL SCANNING', color: '#00FF88' },
      { text: '[SPACE] VERTICAL PROPULSION', color: '#00FF88' },
      { text: '[E] CROP INTERFACE', color: '#FFD700' },
      { text: '[R] ROOT ANALYSIS MODE', color: '#FF6B47' },
      { text: '[H] HELP PROTOCOL', color: '#00D4FF' }
    ];

    instructions.forEach((instruction, index) => {
      const instructionText = this.createInterstellarText(instruction.text, {
        position: [0, 1.8 - index * 0.35, -7.9],
        size: 0.22,
        color: instruction.color,
        weight: 'normal'
      });
      this.panelGroup.add(instructionText);
    });

    // Start prompt
    this.startPrompt = this.createInterstellarText('CLICK TO INITIALIZE FARMING PROTOCOL', {
      position: [0, -2.5, -7.9],
      size: 0.3,
      color: '#00FF88',
      weight: 'bold'
    });
    this.panelGroup.add(this.startPrompt);

    // Add pulsing animation to start prompt
    this.animateStartPrompt();
  }

  animateStartPrompt() {
    if (this.startPrompt && this.startPrompt.material) {
      const animate = () => {
        if (this.showingInstructions && this.startPrompt.visible) {
          const time = Date.now() * 0.003;
          this.startPrompt.material.opacity = 0.7 + Math.sin(time) * 0.3;
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  createCropDetailsPanel(crop) {
    this.removeCropDetailsPanel();

    // Create holographic panel
    const panelGeometry = new THREE.PlaneGeometry(8, 10);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    this.cropPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.cropPanel.position.set(5, 0, -6);
    this.panelGroup.add(this.cropPanel);

    // Panel border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#00D4FF',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.cropPanel.position);
    this.panelGroup.add(border);

    // Panel title
    const title = this.createInterstellarText(`${crop.type.toUpperCase()} ANALYSIS`, {
      position: [5, 4.5, -5.9],
      size: 0.3,
      color: '#FFD700',
      weight: 'bold'
    });
    this.panelGroup.add(title);

    // Status indicator
    const healthColor = crop.health > 70 ? '#00FF88' : crop.health > 40 ? '#FFD700' : '#FF6B47';
    const status = this.createInterstellarText(`STATUS: ${this.getStatusText(crop)}`, {
      position: [5, 4, -5.9],
      size: 0.2,
      color: healthColor,
      weight: 'bold'
    });
    this.panelGroup.add(status);

    // Vital signs
    const vitals = [
      { label: 'GROWTH', value: `${Math.floor(crop.growth)}%`, color: '#00D4FF' },
      { label: 'HEALTH', value: `${Math.floor(crop.health)}%`, color: healthColor },
      { label: 'HYDRATION', value: `${Math.floor(crop.waterLevel)}%`, color: '#00D4FF' },
      { label: 'NUTRIENTS', value: `${Math.floor(crop.nutrientLevel)}%`, color: '#00FF88' },
      { label: 'PATHOGEN', value: `${Math.floor(crop.diseaseLevel)}%`, color: '#FF6B47' }
    ];

    vitals.forEach((vital, index) => {
      const vitalText = this.createInterstellarText(`${vital.label}: ${vital.value}`, {
        position: [5, 3.2 - index * 0.4, -5.9],
        size: 0.18,
        color: vital.color,
        weight: 'normal'
      });
      this.panelGroup.add(vitalText);
    });

    // Action protocols
    const actions = [
      { key: '[1]', action: 'HARVEST', color: '#FFD700' },
      { key: '[2]', action: 'IRRIGATE', color: '#00D4FF' },
      { key: '[3]', action: 'TREATMENT', color: '#FF6B47' },
      { key: '[4]', action: 'FERTILIZE', color: '#00FF88' }
    ];

    actions.forEach((action, index) => {
      const actionText = this.createInterstellarText(`${action.key} ${action.action}`, {
        position: [5, 0.5 - index * 0.3, -5.9],
        size: 0.16,
        color: action.color,
        weight: 'normal'
      });
      this.panelGroup.add(actionText);
    });

    // Close instruction
    const closeText = this.createInterstellarText('[ESC] CLOSE INTERFACE', {
      position: [5, -2.5, -5.9],
      size: 0.15,
      color: '#FF6B47',
      weight: 'normal'
    });
    this.panelGroup.add(closeText);
  }

  removeCropDetailsPanel() {
    if (this.cropPanel) {
      const toRemove = [];
      this.panelGroup.traverse((child) => {
        if (child !== this.instructionPanel && 
            child !== this.instructionTitle && 
            child !== this.instructionSubtitle &&
            child !== this.startPrompt &&
            !this.isInstructionElement(child)) {
          toRemove.push(child);
        }
      });
      
      toRemove.forEach(child => {
        this.panelGroup.remove(child);
        this.disposeObject(child);
      });
      
      this.cropPanel = null;
    }
  }

  isInstructionElement(object) {
    // Check if object is part of instructions
    return this.panelGroup.children.includes(object) && 
           object.position.z < -7.8; // Instructions are at z = -7.9
  }

  disposeObject(object) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (object.material.map) object.material.map.dispose();
      object.material.dispose();
    }
  }

  getStatusText(crop) {
    if (crop.health > 80) return 'OPTIMAL';
    if (crop.health > 60) return 'STABLE';
    if (crop.health > 40) return 'DEGRADED';
    if (crop.health > 20) return 'CRITICAL';
    return 'FAILING';
  }

  update(deltaTime, targetCrop) {
    this.updateHUDText();
    this.updateCrosshair(targetCrop);
    this.updateUIOrientation();
    this.animateElements(deltaTime);
  }

  updateHUDText() {
    // Update weather display
    if (this.weatherText && this.weatherText.userData.updateText) {
      this.weatherText.userData.updateText(
        `${this.weather.icon} ${this.weather.temp}°C | ${this.weather.humidity}% HUMIDITY`
      );
    }

    // Update time display
    if (this.timeText && this.timeText.userData.updateText) {
      const dayStr = this.gameTime.day.toString().padStart(3, '0');
      const hourStr = this.gameTime.hour.toString().padStart(2, '0');
      const minStr = Math.floor(this.gameTime.minute).toString().padStart(2, '0');
      this.timeText.userData.updateText(`DAY ${dayStr} | ${hourStr}:${minStr}`);
    }

    // Update root view indicator
    this.rootViewIndicator.visible = this.rootViewActive;
  }

  updateCrosshair(targetCrop) {
    if (targetCrop) {
      // Show targeting mode
      this.crosshair.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(0x00FF88);
          child.material.opacity = 1.0;
        }
      });

      // Show crop information
      this.crosshairHint.visible = true;
      if (this.crosshairHint.userData.updateText) {
        const urgentAction = this.getMostUrgentAction(targetCrop);
        this.crosshairHint.userData.updateText(
          `◉ ${targetCrop.type.toUpperCase()} DETECTED\n${urgentAction.text}\n[E] INTERFACE`
        );
      }
    } else {
      // Normal crosshair mode
      this.crosshair.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(0x00D4FF);
          child.material.opacity = 0.8;
        }
      });

      this.crosshairHint.visible = false;
    }
  }

  updateUIOrientation() {
    // Make UI elements face camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    [this.hudGroup, this.crosshairGroup, this.panelGroup].forEach(group => {
      group.children.forEach(child => {
        if (child.isGroup) {
          child.children.forEach(subChild => {
            if (subChild.lookAt) subChild.lookAt(this.camera.position);
          });
        } else if (child.lookAt) {
          child.lookAt(this.camera.position);
        }
      });
    });
  }

  animateElements(deltaTime) {
    const time = Date.now() * 0.001;
    
    // Subtle glow animation for UI elements
    this.textElements.forEach((element, index) => {
      if (element.material && element.visible) {
        const baseOpacity = element.material.opacity;
        const glowIntensity = 0.1 + Math.sin(time * 2 + index) * 0.05;
        element.material.opacity = Math.min(1, baseOpacity + glowIntensity);
      }
    });

    // Crosshair rotation animation
    if (this.crosshair) {
      this.crosshair.rotation.z = Math.sin(time * 0.5) * 0.02;
    }
  }

  getMostUrgentAction(crop) {
    if (crop.health < 30) {
      return { text: "◉ CRITICAL HEALTH DETECTED", class: "critical" };
    }
    if (crop.waterLevel < 20) {
      return { text: "◉ DEHYDRATION CRITICAL", class: "critical" };
    }
    if (crop.growth >= 80 && crop.health >= 30) {
      return { text: "◉ HARVEST PROTOCOL READY", class: "harvest" };
    }
    if (crop.waterLevel < 40) {
      return { text: "◉ IRRIGATION REQUIRED", class: "water" };
    }
    if (crop.nutrientLevel < 30) {
      return { text: "◉ NUTRIENT DEFICIENCY", class: "fertilize" };
    }
    return { text: "◉ SPECIMEN STABLE", class: "healthy" };
  }

  toggleRootView() {
    if (this.onRootViewToggle) {
      this.rootViewActive = this.onRootViewToggle();
      
      // Update controls text
      if (this.controlsText && this.controlsText.userData.updateText) {
        const rootText = this.rootViewActive ? 'SURFACE' : 'ROOT';
        this.controlsText.userData.updateText(`[R] ${rootText} VIEW | [H] HELP`);
      }
    }
  }

  setGameTime(gameTime) {
    this.gameTime = gameTime;
  }

  showCropDetails(crop) {
    this.currentCrop = crop;
    this.createCropDetailsPanel(crop);
  }

  hideAllPanels() {
    this.removeCropDetailsPanel();
    this.currentCrop = null;
  }

  hideInstructions() {
    this.showingInstructions = false;
    
    // Hide instruction elements
    [this.instructionPanel, this.instructionTitle, this.instructionSubtitle, this.startPrompt].forEach(element => {
      if (element) element.visible = false;
    });
    
    // Hide instruction text elements
    this.panelGroup.children.forEach(child => {
      if (this.isInstructionElement(child)) {
        child.visible = false;
      }
    });
  }

  showInstructions() {
    this.showingInstructions = true;
    
    // Show instruction elements
    [this.instructionPanel, this.instructionTitle, this.instructionSubtitle, this.startPrompt].forEach(element => {
      if (element) element.visible = true;
    });
    
    // Show instruction text elements
    this.panelGroup.children.forEach(child => {
      if (this.isInstructionElement(child)) {
        child.visible = true;
      }
    });
    
    this.animateStartPrompt();
  }

  toggleInstructions() {
    if (this.showingInstructions) {
      this.hideInstructions();
    } else {
      this.showInstructions();
    }
  }

  handleKeyPress(keyCode) {
    switch (keyCode) {
      case 'Digit1':
        if (this.currentCrop && this.onCropAction) {
          this.onCropAction('harvest', this.currentCrop);
        }
        break;
      case 'Digit2':
        if (this.currentCrop && this.onCropAction) {
          this.onCropAction('water', this.currentCrop);
        }
        break;
      case 'Digit3':
        if (this.currentCrop && this.onCropAction) {
          this.onCropAction('fix', this.currentCrop);
        }
        break;
      case 'Digit4':
        if (this.currentCrop && this.onCropAction) {
          this.onCropAction('fertilize', this.currentCrop);
        }
        break;
    }
  }

  dispose() {
    // Clean up all resources
    this.textElements.forEach(element => {
      this.disposeObject(element);
    });
    
    [this.hudGroup, this.crosshairGroup, this.panelGroup].forEach(group => {
      group.children.forEach(child => {
        this.disposeObject(child);
      });
      this.scene.remove(group);
    });
    
    this.textElements = [];
  }
}
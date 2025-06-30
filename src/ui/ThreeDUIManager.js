import * as THREE from 'three';

export class ThreeDUIManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // UI Groups
    this.hudGroup = new THREE.Group();
    this.crosshairGroup = new THREE.Group();
    this.panelGroup = new THREE.Group();
    this.menuGroup = new THREE.Group();
    this.textElements = [];
    
    this.scene.add(this.hudGroup);
    this.scene.add(this.crosshairGroup);
    this.scene.add(this.panelGroup);
    this.scene.add(this.menuGroup);
    
    // State
    this.gameTime = { day: 1, hour: 6, minute: 0 };
    this.weather = { icon: '☀️', temp: 22, humidity: 65 };
    this.playerHealth = 100;
    this.showingInstructions = true;
    this.showingPauseMenu = false;
    this.showingSettings = false;
    this.showingApiPanel = false;
    this.showingCropDetails = false;
    this.currentCrop = null;
    this.rootViewActive = false;
    
    // Callbacks
    this.onCropAction = null;
    this.onRootViewToggle = null;
    
    this.createMinecraftStyleHUD();
    this.createCrosshair();
    this.createInstructions();
    
    // Setup keyboard controls
    this.setupKeyboardControls();
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyR':
          if (!this.showingInstructions && !this.showingPauseMenu) {
            this.toggleRootView();
          }
          break;
        case 'KeyH':
        case 'F1':
          this.toggleInstructions();
          break;
        case 'Escape':
          if (this.showingCropDetails) {
            this.hideCropDetails();
          } else if (this.showingSettings) {
            this.hideSettings();
          } else if (this.showingApiPanel) {
            this.hideApiPanel();
          } else if (!this.showingInstructions) {
            this.togglePauseMenu();
          }
          break;
        case 'KeyP':
          if (!this.showingInstructions) {
            this.togglePauseMenu();
          }
          break;
        case 'KeyI':
          if (!this.showingInstructions && !this.showingPauseMenu) {
            this.toggleApiPanel();
          }
          break;
        case 'KeyO':
          if (!this.showingInstructions && !this.showingPauseMenu) {
            this.toggleSettings();
          }
          break;
      }
    });
  }

  createText(text, options = {}) {
    const {
      position = [0, 0, 0],
      size = 0.3,
      color = '#00D4FF',
      font = 'Arial',
      weight = 'normal',
      opacity = 0.9,
      glow = true,
      maxWidth = 20
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

    // Draw text with glow
    context.fillStyle = color;
    context.fillText(text, canvas.width / (2 * scale), canvas.height / (2 * scale));

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });

    // Create geometry
    const textWidth = Math.min(text.length * size * 0.6, maxWidth);
    const textHeight = size * 2;
    const geometry = new THREE.PlaneGeometry(textWidth, textHeight);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);

    // Store update function
    mesh.userData = {
      originalText: text,
      canvas: canvas,
      context: context,
      texture: texture,
      scale: scale,
      color: color,
      glow: glow,
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

  createMinecraftStyleHUD() {
    // Health display
    this.healthText = this.createText('❤️ 100', {
      position: [-8, 4.5, -10],
      size: 0.25,
      color: '#FF4444',
      weight: 'bold'
    });
    this.hudGroup.add(this.healthText);

    // Time display
    this.timeText = this.createText('DAY 001 | 06:00', {
      position: [0, 4.5, -10],
      size: 0.3,
      color: '#FFD700',
      weight: 'bold'
    });
    this.hudGroup.add(this.timeText);

    // Weather display
    this.weatherText = this.createText('☀️ 22°C | 65%', {
      position: [6, 4.5, -10],
      size: 0.25,
      color: '#00D4FF',
      weight: 'bold'
    });
    this.hudGroup.add(this.weatherText);

    // Controls display
    this.controlsText = this.createText('[R] ROOT | [P] PAUSE | [H] HELP', {
      position: [0, 4, -10],
      size: 0.2,
      color: '#00FF88',
      weight: 'normal'
    });
    this.hudGroup.add(this.controlsText);

    // Root view indicator (initially hidden)
    this.rootViewIndicator = this.createText('◉ ROOT ANALYSIS MODE ACTIVE', {
      position: [0, 3.5, -10],
      size: 0.25,
      color: '#FF6B47',
      weight: 'bold',
      glow: true
    });
    this.rootViewIndicator.visible = false;
    this.hudGroup.add(this.rootViewIndicator);
  }

  createCrosshair() {
    // Create advanced crosshair
    const crosshairGroup = new THREE.Group();

    // Create crosshair lines
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
    this.crosshairHint = this.createText('', {
      position: [0, -1.2, -5],
      size: 0.18,
      color: '#00FF88',
      weight: 'bold'
    });
    this.crosshairHint.visible = false;
    this.crosshairGroup.add(this.crosshairHint);
  }

  createInstructions() {
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
    this.instructionTitle = this.createText('🌾 AGRICULTURAL SIMULATION', {
      position: [0, 3.5, -7.9],
      size: 0.4,
      color: '#FFD700',
      weight: 'bold'
    });
    this.panelGroup.add(this.instructionTitle);

    // Instructions
    const instructions = [
      { text: '[WASD] MOVEMENT', color: '#00FF88' },
      { text: '[MOUSE] LOOK AROUND', color: '#00FF88' },
      { text: '[SPACE] JUMP', color: '#00FF88' },
      { text: '[E] INTERACT WITH CROPS', color: '#FFD700' },
      { text: '[R] ROOT ANALYSIS MODE', color: '#FF6B47' },
      { text: '[P] PAUSE MENU', color: '#00D4FF' },
      { text: '[H] HELP', color: '#00D4FF' },
      { text: '[I] AI API STATUS', color: '#2196F3' },
      { text: '[O] SETTINGS', color: '#9C27B0' }
    ];

    instructions.forEach((instruction, index) => {
      const instructionText = this.createText(instruction.text, {
        position: [0, 2.5 - index * 0.35, -7.9],
        size: 0.22,
        color: instruction.color,
        weight: 'normal'
      });
      this.panelGroup.add(instructionText);
    });

    // Start prompt
    this.startPrompt = this.createText('CLICK TO START FARMING', {
      position: [0, -3, -7.9],
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

  createPauseMenu() {
    this.removePauseMenu();

    // Create panel
    const panelGeometry = new THREE.PlaneGeometry(8, 6);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    this.pausePanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.pausePanel.position.set(0, 0, -6);
    this.menuGroup.add(this.pausePanel);

    // Border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.pausePanel.position);
    this.menuGroup.add(border);

    // Title
    const title = this.createText('GAME PAUSED', {
      position: [0, 2, -5.9],
      size: 0.4,
      color: '#FFD700',
      weight: 'bold'
    });
    this.menuGroup.add(title);

    // Menu options
    const options = [
      { text: '[ESC] RESUME', color: '#00FF88' },
      { text: '[O] SETTINGS', color: '#00D4FF' },
      { text: '[I] AI STATUS', color: '#2196F3' },
      { text: '[H] HELP', color: '#FF6B47' }
    ];

    options.forEach((option, index) => {
      const optionText = this.createText(option.text, {
        position: [0, 0.8 - index * 0.4, -5.9],
        size: 0.25,
        color: option.color,
        weight: 'normal'
      });
      this.menuGroup.add(optionText);
    });
  }

  createCropDetailsPanel(crop) {
    this.removeCropDetailsPanel();

    // Create panel
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

    // Border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#4CAF50',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.cropPanel.position);
    this.panelGroup.add(border);

    // Title
    const title = this.createText(`${crop.type.toUpperCase()} ANALYSIS`, {
      position: [5, 4.5, -5.9],
      size: 0.3,
      color: '#4CAF50',
      weight: 'bold'
    });
    this.panelGroup.add(title);

    // Status
    const healthColor = crop.health > 70 ? '#00FF88' : crop.health > 40 ? '#FFD700' : '#FF6B47';
    const status = this.createText(`STATUS: ${this.getStatusText(crop)}`, {
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
      { label: 'WATER', value: `${Math.floor(crop.waterLevel)}%`, color: '#00D4FF' },
      { label: 'NUTRIENTS', value: `${Math.floor(crop.nutrientLevel)}%`, color: '#00FF88' },
      { label: 'DISEASE', value: `${Math.floor(crop.diseaseLevel)}%`, color: '#FF6B47' }
    ];

    vitals.forEach((vital, index) => {
      const vitalText = this.createText(`${vital.label}: ${vital.value}`, {
        position: [5, 3.2 - index * 0.4, -5.9],
        size: 0.18,
        color: vital.color,
        weight: 'normal'
      });
      this.panelGroup.add(vitalText);
    });

    // Actions
    const actions = [
      { key: '[1]', action: 'HARVEST', color: '#FFD700' },
      { key: '[2]', action: 'WATER', color: '#00D4FF' },
      { key: '[3]', action: 'TREAT', color: '#FF6B47' },
      { key: '[4]', action: 'FERTILIZE', color: '#00FF88' },
      { key: '[5]', action: 'AI ANALYZE', color: '#2196F3' }
    ];

    actions.forEach((action, index) => {
      const actionText = this.createText(`${action.key} ${action.action}`, {
        position: [5, 0.5 - index * 0.3, -5.9],
        size: 0.16,
        color: action.color,
        weight: 'normal'
      });
      this.panelGroup.add(actionText);
    });

    // Close instruction
    const closeText = this.createText('[ESC] CLOSE', {
      position: [5, -2.5, -5.9],
      size: 0.15,
      color: '#FF6B47',
      weight: 'normal'
    });
    this.panelGroup.add(closeText);
  }

  createApiStatusPanel() {
    this.removeApiStatusPanel();

    // Create panel
    const panelGeometry = new THREE.PlaneGeometry(10, 8);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    this.apiPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.apiPanel.position.set(0, 0, -6);
    this.menuGroup.add(this.apiPanel);

    // Border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#2196F3',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.apiPanel.position);
    this.menuGroup.add(border);

    // Title
    const title = this.createText('🤖 AI API STATUS', {
      position: [0, 3.5, -5.9],
      size: 0.3,
      color: '#2196F3',
      weight: 'bold'
    });
    this.menuGroup.add(title);

    // Check API status
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'undefined';
    
    // Status info
    const statusItems = [
      { label: 'API KEY:', value: hasApiKey ? '🟢 CONFIGURED' : '🔴 NOT SET', color: hasApiKey ? '#00FF88' : '#FF6B47' },
      { label: 'CONNECTION:', value: '🟡 TESTING...', color: '#FFD700' },
      { label: 'MODEL:', value: 'LLAMA-3.1-70B', color: '#00D4FF' },
      { label: 'REQUESTS:', value: '0 TODAY', color: '#00FF88' }
    ];

    statusItems.forEach((item, index) => {
      const itemText = this.createText(`${item.label} ${item.value}`, {
        position: [0, 2.5 - index * 0.4, -5.9],
        size: 0.18,
        color: item.color,
        weight: 'normal'
      });
      this.menuGroup.add(itemText);
    });

    // Instructions
    const instructions = [
      '[T] TEST CONNECTION',
      '[C] CLEAR CACHE',
      '[ESC] CLOSE'
    ];

    instructions.forEach((instruction, index) => {
      const instructionText = this.createText(instruction, {
        position: [0, 0.5 - index * 0.3, -5.9],
        size: 0.16,
        color: '#00D4FF',
        weight: 'normal'
      });
      this.menuGroup.add(instructionText);
    });

    // Test connection if API key exists
    if (hasApiKey) {
      this.testApiConnection();
    }
  }

  createSettingsPanel() {
    this.removeSettingsPanel();

    // Create panel
    const panelGeometry = new THREE.PlaneGeometry(10, 8);
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    this.settingsPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.settingsPanel.position.set(0, 0, -6);
    this.menuGroup.add(this.settingsPanel);

    // Border
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#9C27B0',
      transparent: true,
      opacity: 0.8
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(this.settingsPanel.position);
    this.menuGroup.add(border);

    // Title
    const title = this.createText('⚙️ SETTINGS', {
      position: [0, 3.5, -5.9],
      size: 0.3,
      color: '#9C27B0',
      weight: 'bold'
    });
    this.menuGroup.add(title);

    // Settings options
    const settings = [
      { label: 'GRAPHICS QUALITY:', value: 'HIGH', color: '#00FF88' },
      { label: 'SHADOW QUALITY:', value: 'MEDIUM', color: '#FFD700' },
      { label: 'RENDER DISTANCE:', value: '100M', color: '#00D4FF' },
      { label: 'SOUND EFFECTS:', value: 'ON', color: '#00FF88' },
      { label: 'TIME SPEED:', value: '1.0X', color: '#FFD700' },
      { label: 'AUTO-SAVE:', value: 'ENABLED', color: '#00FF88' }
    ];

    settings.forEach((setting, index) => {
      const settingText = this.createText(`${setting.label} ${setting.value}`, {
        position: [0, 2.5 - index * 0.35, -5.9],
        size: 0.16,
        color: setting.color,
        weight: 'normal'
      });
      this.menuGroup.add(settingText);
    });

    // Instructions
    const closeText = this.createText('[ESC] CLOSE SETTINGS', {
      position: [0, -2.5, -5.9],
      size: 0.15,
      color: '#FF6B47',
      weight: 'normal'
    });
    this.menuGroup.add(closeText);
  }

  // Removal methods
  removePauseMenu() {
    if (this.pausePanel) {
      this.removeMenuElements();
      this.pausePanel = null;
    }
  }

  removeCropDetailsPanel() {
    if (this.cropPanel) {
      this.removePanelElements();
      this.cropPanel = null;
    }
  }

  removeApiStatusPanel() {
    if (this.apiPanel) {
      this.removeMenuElements();
      this.apiPanel = null;
    }
  }

  removeSettingsPanel() {
    if (this.settingsPanel) {
      this.removeMenuElements();
      this.settingsPanel = null;
    }
  }

  removeMenuElements() {
    const toRemove = [];
    this.menuGroup.traverse((child) => {
      if (child !== this.menuGroup) {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(child => {
      this.menuGroup.remove(child);
      this.disposeObject(child);
    });
  }

  removePanelElements() {
    const toRemove = [];
    this.panelGroup.traverse((child) => {
      if (child !== this.instructionPanel && 
          child !== this.instructionTitle && 
          child !== this.startPrompt &&
          !this.isInstructionElement(child)) {
        toRemove.push(child);
      }
    });
    
    toRemove.forEach(child => {
      this.panelGroup.remove(child);
      this.disposeObject(child);
    });
  }

  isInstructionElement(object) {
    return this.panelGroup.children.includes(object) && 
           object.position.z < -7.8;
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

  async testApiConnection() {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a test. Respond with "OK" only.'
            },
            {
              role: 'user',
              content: 'Test'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      // Update connection status in API panel if it's showing
      if (this.showingApiPanel && this.apiPanel) {
        // Find and update connection status text
        this.menuGroup.children.forEach(child => {
          if (child.userData && child.userData.originalText && 
              child.userData.originalText.includes('CONNECTION:')) {
            const status = response.ok ? '🟢 CONNECTED' : '🔴 FAILED';
            child.userData.updateText(`CONNECTION: ${status}`);
          }
        });
      }
      
    } catch (error) {
      console.error('API test failed:', error);
    }
  }

  update(deltaTime, targetCrop) {
    this.updateHUDText();
    this.updateCrosshair(targetCrop);
    this.updateUIOrientation();
    this.animateElements(deltaTime);
  }

  updateHUDText() {
    // Update health display
    if (this.healthText && this.healthText.userData.updateText) {
      this.healthText.userData.updateText(`❤️ ${Math.floor(this.playerHealth)}`);
    }

    // Update weather display
    if (this.weatherText && this.weatherText.userData.updateText) {
      this.weatherText.userData.updateText(
        `${this.weather.icon} ${this.weather.temp}°C | ${this.weather.humidity}%`
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
    if (targetCrop && !this.showingInstructions && !this.showingPauseMenu) {
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
          `◉ ${targetCrop.type.toUpperCase()}\n${urgentAction.text}\n[E] ANALYZE`
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

    // Hide crosshair when showing menus
    this.crosshair.visible = !this.showingInstructions && !this.showingPauseMenu && 
                            !this.showingSettings && !this.showingApiPanel;
  }

  updateUIOrientation() {
    // Make UI elements face camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    [this.hudGroup, this.crosshairGroup, this.panelGroup, this.menuGroup].forEach(group => {
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
      return { text: "◉ CRITICAL HEALTH", class: "critical" };
    }
    if (crop.waterLevel < 20) {
      return { text: "◉ DEHYDRATION CRITICAL", class: "critical" };
    }
    if (crop.growth >= 80 && crop.health >= 30) {
      return { text: "◉ HARVEST READY", class: "harvest" };
    }
    if (crop.waterLevel < 40) {
      return { text: "◉ NEEDS WATER", class: "water" };
    }
    if (crop.nutrientLevel < 30) {
      return { text: "◉ NUTRIENT DEFICIENCY", class: "fertilize" };
    }
    return { text: "◉ HEALTHY PLANT", class: "healthy" };
  }

  // Public methods for game interaction
  setGameTime(gameTime) {
    this.gameTime = gameTime;
  }

  setPlayerHealth(health) {
    this.playerHealth = Math.max(0, Math.min(100, health));
  }

  showCropDetails(crop) {
    this.currentCrop = crop;
    this.showingCropDetails = true;
    this.createCropDetailsPanel(crop);
  }

  hideCropDetails() {
    this.showingCropDetails = false;
    this.removeCropDetailsPanel();
    this.currentCrop = null;
  }

  togglePauseMenu() {
    this.showingPauseMenu = !this.showingPauseMenu;
    
    if (this.showingPauseMenu) {
      this.createPauseMenu();
    } else {
      this.removePauseMenu();
    }
  }

  toggleSettings() {
    this.showingSettings = !this.showingSettings;
    
    if (this.showingSettings) {
      this.createSettingsPanel();
    } else {
      this.removeSettingsPanel();
    }
  }

  toggleApiPanel() {
    this.showingApiPanel = !this.showingApiPanel;
    
    if (this.showingApiPanel) {
      this.createApiStatusPanel();
    } else {
      this.removeApiStatusPanel();
    }
  }

  toggleRootView() {
    if (this.onRootViewToggle) {
      this.rootViewActive = this.onRootViewToggle();
      
      // Update controls text
      if (this.controlsText && this.controlsText.userData.updateText) {
        const rootText = this.rootViewActive ? 'SURFACE' : 'ROOT';
        this.controlsText.userData.updateText(`[R] ${rootText} | [P] PAUSE | [H] HELP`);
      }
    }
  }

  hideInstructions() {
    this.showingInstructions = false;
    
    // Hide instruction elements
    [this.instructionPanel, this.instructionTitle, this.startPrompt].forEach(element => {
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
    [this.instructionPanel, this.instructionTitle, this.startPrompt].forEach(element => {
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
      case 'Digit5':
        if (this.currentCrop && this.onCropAction) {
          this.onCropAction('ai_analyze', this.currentCrop);
        }
        break;
      case 'KeyT':
        if (this.showingApiPanel) {
          this.testApiConnection();
        }
        break;
      case 'KeyC':
        if (this.showingApiPanel) {
          console.log('API cache cleared');
        }
        break;
    }
  }

  dispose() {
    // Clean up all resources
    this.textElements.forEach(element => {
      this.disposeObject(element);
    });
    
    [this.hudGroup, this.crosshairGroup, this.panelGroup, this.menuGroup].forEach(group => {
      group.children.forEach(child => {
        this.disposeObject(child);
      });
      this.scene.remove(group);
    });
    
    this.textElements = [];
  }
}
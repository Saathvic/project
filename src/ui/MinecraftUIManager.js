export class MinecraftUIManager {
  constructor() {
    this.currentCrop = null;
    this.onCropAction = null;
    this.onRootViewToggle = null;
    this.gameTime = { day: 1, hour: 6, minute: 0 };
    this.weather = { icon: '☀️', temp: 22, humidity: 65 };
    this.playerHealth = 100;
    this.isPaused = false;
    this.rootViewActive = false;
    this.showingInstructions = true;
    this.currentTool = 'hoe';
    
    this.setupEventListeners();
    this.updateHealthDisplay();
    this.updateTimeDisplay();
    this.updateWeatherDisplay();
    this.updateToolDisplay();
    
    // Initialize API status
    this.checkApiStatus();
    
    // Ensure UI is properly layered
    this.ensureUILayering();
  }

  ensureUILayering() {
    // Force UI to be on top with proper z-index
    const gameUI = document.getElementById('gameUI');
    if (gameUI) {
      gameUI.style.position = 'fixed';
      gameUI.style.zIndex = '100';
      gameUI.style.pointerEvents = 'none';
    }

    // Ensure canvas is behind UI
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.style.zIndex = '1';
    }

    // Make interactive elements have pointer events
    const interactiveElements = [
      '#topMenuBar', '.plant-popup', '.detailed-panel', 
      '.settings-panel', '.api-panel', '.pause-menu', '.instructions-overlay',
      '.tool-bar'
    ];
    
    interactiveElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.pointerEvents = 'auto';
      }
    });
  }

  setupEventListeners() {
    // Menu buttons
    document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
    document.getElementById('apiBtn').addEventListener('click', () => this.showApiPanel());
    document.getElementById('rootViewBtn').addEventListener('click', () => this.toggleRootView());

    // Close buttons
    document.getElementById('closePanelBtn').addEventListener('click', () => this.hidePlantDetails());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettings());
    document.getElementById('closeApiBtn').addEventListener('click', () => this.hideApiPanel());

    // Pause menu buttons
    document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('saveGameBtn').addEventListener('click', () => this.saveGame());
    document.getElementById('loadGameBtn').addEventListener('click', () => this.loadGame());
    document.getElementById('mainMenuBtn').addEventListener('click', () => this.showMainMenu());

    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', () => this.hideInstructions());

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Tool slots
    document.querySelectorAll('.tool-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const tool = e.target.dataset.tool;
        if (tool) {
          this.switchTool(tool);
        }
      });
    });

    // Settings controls
    this.setupSettingsControls();
    
    // API controls
    this.setupApiControls();

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Prevent default behavior for game keys when UI is open
      if (this.isPaused || this.showingInstructions) {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
          event.preventDefault();
        }
      }

      switch (event.code) {
        case 'Escape':
          event.preventDefault();
          if (!this.showingInstructions) {
            this.togglePause();
          }
          break;
        case 'KeyR':
          if (!this.isPaused && !this.showingInstructions) {
            event.preventDefault();
            this.toggleRootView();
          }
          break;
        case 'F1':
          event.preventDefault();
          this.showInstructions();
          break;
        case 'KeyE':
          if (this.currentCrop && !this.isPaused && !this.showingInstructions) {
            event.preventDefault();
            this.showPlantDetails(this.currentCrop);
          }
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
          if (!this.isPaused && !this.showingInstructions) {
            const toolMap = {
              'Digit1': 'hoe',
              'Digit2': 'watering_can',
              'Digit3': 'seeds',
              'Digit4': 'fertilizer',
              'Digit5': 'shears',
              'Digit6': 'harvest_basket'
            };
            this.switchTool(toolMap[event.code]);
          }
          break;
      }
    });

    // Click outside to close panels
    document.addEventListener('click', (event) => {
      // Close plant details if clicking outside
      const plantPanel = document.getElementById('plantDetailsPanel');
      if (!plantPanel.classList.contains('hidden') && 
          !plantPanel.contains(event.target) && 
          !document.getElementById('plantPopup').contains(event.target)) {
        this.hidePlantDetails();
      }

      // Close settings if clicking outside
      const settingsPanel = document.getElementById('settingsPanel');
      if (!settingsPanel.classList.contains('hidden') && 
          !settingsPanel.contains(event.target) && 
          !document.getElementById('settingsBtn').contains(event.target)) {
        this.hideSettings();
      }

      // Close API panel if clicking outside
      const apiPanel = document.getElementById('apiPanel');
      if (!apiPanel.classList.contains('hidden') && 
          !apiPanel.contains(event.target) && 
          !document.getElementById('apiBtn').contains(event.target)) {
        this.hideApiPanel();
      }
    });
  }

  setupSettingsControls() {
    // Render distance
    const renderDistance = document.getElementById('renderDistance');
    const renderDistanceValue = document.getElementById('renderDistanceValue');
    renderDistance.addEventListener('input', (e) => {
      renderDistanceValue.textContent = e.target.value;
    });

    // Master volume
    const masterVolume = document.getElementById('masterVolume');
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    masterVolume.addEventListener('input', (e) => {
      masterVolumeValue.textContent = e.target.value + '%';
    });

    // Time speed
    const timeSpeed = document.getElementById('timeSpeed');
    const timeSpeedValue = document.getElementById('timeSpeedValue');
    timeSpeed.addEventListener('input', (e) => {
      timeSpeedValue.textContent = e.target.value + 'x';
    });
  }

  setupApiControls() {
    // AI Temperature
    const aiTemperature = document.getElementById('aiTemperature');
    const temperatureValue = document.getElementById('temperatureValue');
    aiTemperature.addEventListener('input', (e) => {
      temperatureValue.textContent = e.target.value;
    });

    // Test API button
    document.getElementById('testApiBtn').addEventListener('click', () => this.testApiConnection());
    
    // Clear cache button
    document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearApiCache());
  }

  switchTool(toolName) {
    if (this.currentTool === toolName) return;
    
    this.currentTool = toolName;
    this.updateToolDisplay();
    
    // Update tool slots
    document.querySelectorAll('.tool-slot').forEach(slot => {
      slot.classList.remove('active');
      if (slot.dataset.tool === toolName) {
        slot.classList.add('active');
      }
    });
    
    // Play tool switch sound
    this.playToolSwitchSound();
  }

  updateToolDisplay() {
    const toolInfo = {
      hoe: { icon: '🔨', name: 'Hoe' },
      watering_can: { icon: '💧', name: 'Watering Can' },
      seeds: { icon: '🌱', name: 'Seeds' },
      fertilizer: { icon: '💊', name: 'Fertilizer' },
      shears: { icon: '✂️', name: 'Shears' },
      harvest_basket: { icon: '🧺', name: 'Basket' }
    };
    
    const tool = toolInfo[this.currentTool];
    const currentToolElement = document.getElementById('currentTool');
    if (currentToolElement && tool) {
      currentToolElement.innerHTML = `
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
      
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Audio not supported
    }
  }

  update(deltaTime, targetCrop) {
    this.updateCrosshair(targetCrop);
    this.updatePlantPopup(targetCrop);
    this.updateTimeDisplay();
    this.updateHealthDisplay();
    
    // Ensure UI layering is maintained
    this.ensureUILayering();
  }

  updateCrosshair(targetCrop) {
    const crosshair = document.getElementById('crosshair');
    if (targetCrop && !this.isPaused && !this.showingInstructions) {
      crosshair.classList.add('targeting');
      crosshair.style.display = 'block';
    } else {
      crosshair.classList.remove('targeting');
      if (this.isPaused || this.showingInstructions) {
        crosshair.style.display = 'none';
      } else {
        crosshair.style.display = 'block';
      }
    }
  }

  updatePlantPopup(targetCrop) {
    const popup = document.getElementById('plantPopup');
    
    if (targetCrop && !this.isPaused && !this.showingInstructions) {
      this.currentCrop = targetCrop;
      this.populatePlantPopup(targetCrop);
      popup.classList.remove('hidden');
    } else {
      popup.classList.add('hidden');
      if (!this.isPaused && !this.showingInstructions) {
        this.currentCrop = null;
      }
    }
  }

  populatePlantPopup(crop) {
    document.getElementById('plantName').textContent = 
      crop.type.charAt(0).toUpperCase() + crop.type.slice(1) + ' Plant';
    
    // Health indicator
    const healthIndicator = document.getElementById('plantHealthIndicator');
    if (crop.health > 70) {
      healthIndicator.className = 'plant-health good';
      healthIndicator.textContent = '●';
    } else if (crop.health > 40) {
      healthIndicator.className = 'plant-health fair';
      healthIndicator.textContent = '●';
    } else {
      healthIndicator.className = 'plant-health poor';
      healthIndicator.textContent = '●';
    }

    // Update stat bars
    document.getElementById('growthBar').style.width = crop.growth + '%';
    document.getElementById('growthValue').textContent = Math.floor(crop.growth) + '%';
    
    document.getElementById('healthBar').style.width = crop.health + '%';
    document.getElementById('healthValue').textContent = Math.floor(crop.health) + '%';
    
    document.getElementById('waterBar').style.width = crop.waterLevel + '%';
    document.getElementById('waterValue').textContent = Math.floor(crop.waterLevel) + '%';
  }

  showPlantDetails(crop) {
    this.currentCrop = crop;
    this.populateDetailedPanel(crop);
    document.getElementById('plantDetailsPanel').classList.remove('hidden');
  }

  populateDetailedPanel(crop) {
    document.getElementById('detailPlantName').textContent = 
      crop.type.charAt(0).toUpperCase() + crop.type.slice(1) + ' Plant Analysis';

    // Overview tab
    this.populateOverviewTab(crop);
    
    // Disease tab
    this.populateDiseaseTab(crop);
    
    // Switch to overview tab
    this.switchTab('overview');
  }

  populateOverviewTab(crop) {
    const detailedStats = document.getElementById('detailedStats');
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - daysSincePlanted);
    
    detailedStats.innerHTML = `
      <div class="detail-stat">
        <div class="detail-stat-label">Growth Progress</div>
        <div class="detail-stat-value">${Math.floor(crop.growth)}%</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Plant Health</div>
        <div class="detail-stat-value">${Math.floor(crop.health)}%</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Water Level</div>
        <div class="detail-stat-value">${Math.floor(crop.waterLevel)}%</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Soil Moisture</div>
        <div class="detail-stat-value">${Math.floor(crop.soilMoisture)}%</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Nutrients</div>
        <div class="detail-stat-value">${Math.floor(crop.nutrientLevel)}%</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Days to Maturity</div>
        <div class="detail-stat-value">${Math.floor(daysToMaturity)}</div>
      </div>
    `;

    const actionButtons = document.getElementById('actionButtons');
    actionButtons.innerHTML = `
      <button class="action-btn" onclick="window.cropAction('harvest')" 
              ${crop.growth < 80 || crop.health < 30 ? 'disabled' : ''}>
        🌾 Harvest
      </button>
      <button class="action-btn" onclick="window.cropAction('water')"
              ${crop.waterLevel > 80 ? 'disabled' : ''}>
        💧 Water
      </button>
      <button class="action-btn" onclick="window.cropAction('fix')"
              ${crop.health > 80 && crop.diseaseLevel < 20 ? 'disabled' : ''}>
        🔧 Treat
      </button>
      <button class="action-btn" onclick="window.cropAction('fertilize')"
              ${crop.nutrientLevel > 80 ? 'disabled' : ''}>
        🌱 Fertilize
      </button>
      <button class="action-btn" onclick="window.cropAction('inspect')">
        🔍 Inspect
      </button>
      <button class="action-btn" onclick="window.cropAction('ai_analyze')">
        🤖 AI Analysis
      </button>
    `;

    // Set up global action handler
    window.cropAction = (action) => {
      if (this.onCropAction && this.currentCrop) {
        this.onCropAction(action, this.currentCrop);
        
        // Update the panel after action
        setTimeout(() => {
          if (!document.getElementById('plantDetailsPanel').classList.contains('hidden')) {
            this.populateDetailedPanel(this.currentCrop);
          }
        }, 100);
        
        // Show AI analysis if requested
        if (action === 'ai_analyze') {
          setTimeout(() => {
            this.switchTab('ai');
            this.loadAIAnalysis(this.currentCrop);
          }, 500);
        }
      }
    };
  }

  populateDiseaseTab(crop) {
    const diseaseInfo = document.getElementById('diseaseInfo');
    let diseaseLevel = 'low';
    let diseaseColor = '#4CAF50';
    let diseaseText = 'Plant appears healthy with no visible signs of disease.';
    
    if (crop.diseaseLevel > 70) {
      diseaseLevel = 'high';
      diseaseColor = '#ff4444';
      diseaseText = 'Severe disease detected! Immediate treatment required. Symptoms may include wilting, discoloration, and stunted growth.';
    } else if (crop.diseaseLevel > 40) {
      diseaseLevel = 'medium';
      diseaseColor = '#ffaa00';
      diseaseText = 'Moderate disease pressure detected. Monitor closely and consider preventive treatments.';
    } else if (crop.diseaseLevel > 20) {
      diseaseLevel = 'low';
      diseaseColor = '#ffaa00';
      diseaseText = 'Minor disease symptoms detected. Early intervention recommended.';
    }

    diseaseInfo.innerHTML = `
      <div class="disease-level">
        <div class="disease-indicator ${diseaseLevel}"></div>
        <h3>Disease Level: ${Math.floor(crop.diseaseLevel)}%</h3>
      </div>
      <div class="disease-details">
        <p><strong>Assessment:</strong> ${diseaseText}</p>
        <p><strong>Environmental Factors:</strong></p>
        <ul>
          <li>Humidity: ${crop.soilMoisture > 80 ? 'High (promotes fungal growth)' : 'Normal'}</li>
          <li>Air Circulation: ${crop.diseaseLevel > 30 ? 'Poor' : 'Good'}</li>
          <li>Plant Stress: ${crop.health < 60 ? 'High' : 'Low'}</li>
        </ul>
        <p><strong>Recommended Actions:</strong></p>
        <ul>
          ${crop.diseaseLevel > 50 ? '<li>Apply fungicide or organic treatment</li>' : ''}
          ${crop.soilMoisture > 80 ? '<li>Improve drainage and reduce watering</li>' : ''}
          <li>Remove affected plant parts if visible</li>
          <li>Improve air circulation around plants</li>
          <li>Monitor daily for changes</li>
        </ul>
      </div>
    `;
  }

  async loadAIAnalysis(crop) {
    const aiAnalysis = document.getElementById('aiAnalysis');
    aiAnalysis.innerHTML = '<div class="loading">🤖 Analyzing crop conditions...</div>';
    
    // Trigger AI analysis if we have the callback
    if (this.onCropAction) {
      try {
        const analysis = await this.onCropAction('ai_analyze', crop);
        if (analysis) {
          this.displayAIAnalysis(analysis);
        }
      } catch (error) {
        aiAnalysis.innerHTML = '<div class="loading">❌ AI analysis failed. Please check API connection.</div>';
      }
    }
  }

  displayAIAnalysis(analysis) {
    const aiAnalysis = document.getElementById('aiAnalysis');
    aiAnalysis.innerHTML = `
      <div class="ai-recommendation">
        <h4>🔍 Current Condition</h4>
        <p>${analysis.condition}</p>
      </div>
      
      <div class="ai-recommendation">
        <h4>⚡ Urgent Action Required</h4>
        <p>${analysis.urgentAction}</p>
      </div>
      
      <div class="ai-recommendation">
        <h4>💡 Optimization Recommendations</h4>
        <p>${analysis.recommendations}</p>
      </div>
      
      <div class="ai-recommendation">
        <h4>🦠 Disease Management</h4>
        <p>${analysis.diseaseManagement}</p>
      </div>
      
      <div class="ai-recommendation">
        <h4>📈 Yield Prediction</h4>
        <p>${analysis.yieldPrediction}</p>
      </div>
      
      <div class="ai-recommendation">
        <h4>⏰ Timeline & Next Steps</h4>
        <p>${analysis.timeline}</p>
      </div>
      
      <div style="text-align: center; margin-top: 15px; font-size: 11px; opacity: 0.7;">
        AI Confidence: ${analysis.confidence}% | Analysis Time: ${new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    `;
  }

  switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  }

  updateHealthDisplay() {
    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');
    
    healthFill.style.width = this.playerHealth + '%';
    healthText.textContent = Math.floor(this.playerHealth);
  }

  updateTimeDisplay() {
    const timeElement = document.getElementById('gameTime');
    const timeStr = `${this.gameTime.hour.toString().padStart(2, '0')}:${Math.floor(this.gameTime.minute).toString().padStart(2, '0')}`;
    timeElement.textContent = `Day ${this.gameTime.day} - ${timeStr}`;
  }

  updateWeatherDisplay() {
    document.getElementById('weatherIcon').textContent = this.weather.icon;
    document.getElementById('temperature').textContent = `${this.weather.temp}°C`;
    document.getElementById('humidity').textContent = `${this.weather.humidity}%`;
  }

  setGameTime(gameTime) {
    this.gameTime = gameTime;
  }

  setPlayerHealth(health) {
    this.playerHealth = Math.max(0, Math.min(100, health));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseMenu = document.getElementById('pauseMenu');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (this.isPaused) {
      pauseMenu.classList.remove('hidden');
      pauseBtn.textContent = '▶️';
      pauseBtn.classList.add('active');
      // Hide crosshair when paused
      document.getElementById('crosshair').style.display = 'none';
    } else {
      pauseMenu.classList.add('hidden');
      pauseBtn.textContent = '⏸️';
      pauseBtn.classList.remove('active');
      // Show crosshair when unpaused
      document.getElementById('crosshair').style.display = 'block';
    }
  }

  toggleRootView() {
    if (this.onRootViewToggle) {
      this.rootViewActive = this.onRootViewToggle();
      const rootBtn = document.getElementById('rootViewBtn');
      
      if (this.rootViewActive) {
        rootBtn.classList.add('active');
        rootBtn.title = 'Surface View';
        document.body.classList.add('root-view-active');
      } else {
        rootBtn.classList.remove('active');
        rootBtn.title = 'Root View';
        document.body.classList.remove('root-view-active');
      }
    }
  }

  showSettings() {
    document.getElementById('settingsPanel').classList.remove('hidden');
  }

  hideSettings() {
    document.getElementById('settingsPanel').classList.add('hidden');
  }

  showApiPanel() {
    document.getElementById('apiPanel').classList.remove('hidden');
    this.updateApiStatus();
  }

  hideApiPanel() {
    document.getElementById('apiPanel').classList.add('hidden');
  }

  hidePlantDetails() {
    document.getElementById('plantDetailsPanel').classList.add('hidden');
    if (window.cropAction) {
      delete window.cropAction;
    }
  }

  showInstructions() {
    this.showingInstructions = true;
    document.getElementById('instructionsOverlay').classList.remove('hidden');
    // Hide crosshair when showing instructions
    document.getElementById('crosshair').style.display = 'none';
  }

  hideInstructions() {
    this.showingInstructions = false;
    document.getElementById('instructionsOverlay').classList.add('hidden');
    // Show crosshair when hiding instructions
    if (!this.isPaused) {
      document.getElementById('crosshair').style.display = 'block';
    }
  }

  async checkApiStatus() {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const groqStatus = document.getElementById('groqStatus');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    
    if (apiKey && apiKey !== 'undefined') {
      groqStatus.textContent = '🟡 Connecting...';
      apiKeyStatus.textContent = 'Configured';
      
      // Test actual connection
      try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        });
        
        if (response.ok) {
          groqStatus.textContent = '🟢 Connected';
        } else {
          groqStatus.textContent = '🔴 Invalid Key';
        }
      } catch (error) {
        groqStatus.textContent = '🔴 Connection Failed';
      }
    } else {
      groqStatus.textContent = '🔴 No API Key';
      apiKeyStatus.textContent = 'Not configured';
    }
  }

  updateApiStatus() {
    this.checkApiStatus();
    
    // Update request count (mock data for now)
    document.getElementById('requestCount').textContent = '0';
    document.getElementById('lastRequest').textContent = 'Never';
  }

  async testApiConnection() {
    const testBtn = document.getElementById('testApiBtn');
    const originalText = testBtn.textContent;
    
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error('No API key configured');
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
              content: 'You are a test. Respond with "Connection successful" only.'
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

      if (response.ok) {
        const groqStatus = document.getElementById('groqStatus');
        groqStatus.textContent = '🟢 Connection Successful';
        
        setTimeout(() => {
          this.checkApiStatus();
        }, 3000);
      } else {
        throw new Error(`API test failed: ${response.status}`);
      }
      
    } catch (error) {
      const groqStatus = document.getElementById('groqStatus');
      groqStatus.textContent = '🔴 Connection Failed';
      console.error('API test failed:', error);
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  clearApiCache() {
    // Clear any cached AI responses
    console.log('API cache cleared');
    
    const clearBtn = document.getElementById('clearCacheBtn');
    const originalText = clearBtn.textContent;
    
    clearBtn.textContent = 'Cleared!';
    setTimeout(() => {
      clearBtn.textContent = originalText;
    }, 2000);
  }

  saveGame() {
    console.log('Game saved');
    const saveBtn = document.getElementById('saveGameBtn');
    const originalText = saveBtn.textContent;
    
    saveBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 2000);
  }

  loadGame() {
    console.log('Game loaded');
    const loadBtn = document.getElementById('loadGameBtn');
    const originalText = loadBtn.textContent;
    
    loadBtn.textContent = 'Loaded!';
    setTimeout(() => {
      loadBtn.textContent = originalText;
    }, 2000);
  }

  showMainMenu() {
    console.log('Returning to main menu');
    // In a real implementation, this would navigate to the main menu
  }

  handleKeyPress(keyCode) {
    // Handle additional key presses if needed
    switch (keyCode) {
      case 'KeyE':
        if (this.currentCrop && !this.isPaused && !this.showingInstructions) {
          this.showPlantDetails(this.currentCrop);
        }
        break;
    }
  }
}
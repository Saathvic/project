import * as THREE from 'three';

export class InGameUIManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.onCropAction = null;
    this.onRootViewToggle = null;
    
    this.currentCrop = null;
    this.showingInstructions = true;
    this.showingCropDetails = false;
    this.showingAIAnalysis = false;
    this.rootViewActive = false;
    
    this.gameTime = { day: 1, hour: 6, minute: 0 };
    this.weather = { icon: '☀️', temp: 22, humidity: 65 };
    
    this.setupEventListeners();
    this.setupHTMLEventListeners();
    
    // Update weather periodically (much slower)
    setInterval(() => this.updateWeather(), 300000); // Every 5 minutes
    
    // Ensure UI is visible on startup
    this.showUI();
  }

  showUI() {
    // Make sure all UI elements are properly visible
    const ui = document.getElementById('ui');
    if (ui) {
      ui.style.display = 'block';
      ui.style.pointerEvents = 'none';
    }
    
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) {
      gameHUD.style.display = 'block';
    }
    
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.style.display = 'block';
    }
    
    // Show instructions initially
    this.showInstructions();
  }

  setupEventListeners() {
    // Handle keyboard input for UI
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyH':
          this.toggleInstructions();
          break;
        case 'KeyR':
          this.toggleRootView();
          break;
        case 'Escape':
          this.hideAllPanels();
          break;
      }
    });
  }

  setupHTMLEventListeners() {
    // Start game button
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.hideInstructions();
      });
    }

    // Root view toggle
    const rootBtn = document.getElementById('rootViewToggle');
    if (rootBtn) {
      rootBtn.addEventListener('click', () => {
        this.toggleRootView();
      });
    }

    // Help button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.toggleInstructions();
      });
    }

    // Close panel buttons
    const closePanelBtn = document.getElementById('closePanelBtn');
    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', () => {
        this.hideAllPanels();
      });
    }

    const closeAIBtn = document.getElementById('closeAIBtn');
    if (closeAIBtn) {
      closeAIBtn.addEventListener('click', () => {
        this.hideAllPanels();
      });
    }
  }

  update(deltaTime, targetCrop) {
    // Update HUD display
    this.updateHTMLOverlay();
    
    // Update crosshair hint based on target crop
    this.updateCrosshairHint(targetCrop);
  }

  updateHTMLOverlay() {
    // Update the HTML overlay with essential info
    const weatherElement = document.getElementById('weatherIcon');
    const tempElement = document.getElementById('temperature');
    const humidityElement = document.getElementById('humidity');
    const timeElement = document.getElementById('gameTime');
    
    if (weatherElement) weatherElement.textContent = this.weather.icon;
    if (tempElement) tempElement.textContent = `${this.weather.temp}°C`;
    if (humidityElement) humidityElement.textContent = `${this.weather.humidity}%`;
    if (timeElement) {
      const timeStr = `${this.gameTime.hour.toString().padStart(2, '0')}:${Math.floor(this.gameTime.minute).toString().padStart(2, '0')}`;
      const period = this.gameTime.hour < 12 ? 'AM' : 'PM';
      const displayHour = this.gameTime.hour === 0 ? 12 : this.gameTime.hour > 12 ? this.gameTime.hour - 12 : this.gameTime.hour;
      timeElement.textContent = `Day ${this.gameTime.day} - ${displayHour}:${Math.floor(this.gameTime.minute).toString().padStart(2, '0')} ${period}`;
    }
  }

  updateCrosshairHint(targetCrop) {
    const crosshair = document.getElementById('crosshair');
    const crosshairHint = document.getElementById('crosshair')?.querySelector('.crosshair-hint');
    const hintText = document.getElementById('crosshair')?.querySelector('.hint-text');
    
    if (!crosshair || !crosshairHint || !hintText) return;
    
    if (targetCrop) {
      const urgentAction = this.getMostUrgentAction(targetCrop);
      const cropStatus = this.getCropStatus(targetCrop);
      
      hintText.innerHTML = `
        <div class="crop-name">${targetCrop.type.charAt(0).toUpperCase() + targetCrop.type.slice(1)}</div>
        <div class="crop-status ${cropStatus.class}">${cropStatus.text}</div>
        <div class="urgent-action">${urgentAction.text}</div>
      `;
      
      crosshairHint.className = `crosshair-hint ${urgentAction.class}`;
      crosshair.className = `dynamic-crosshair targeting ${urgentAction.class}`;
    } else {
      crosshairHint.classList.add('hidden');
      crosshair.className = 'dynamic-crosshair';
    }
  }

  setGameTime(gameTime) {
    this.gameTime = gameTime;
  }

  showCropDetails(crop) {
    this.currentCrop = crop;
    this.showingCropDetails = true;
    
    // Show HTML panel
    const panel = document.getElementById('cropDetailsPanel');
    if (panel) {
      this.populateCropDetails(crop);
      panel.classList.remove('hidden');
    }
  }

  populateCropDetails(crop) {
    // Use the existing HTML panel population logic
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - daysSincePlanted);
    const qualityRating = this.getQualityRating(crop);
    const urgentAction = this.getMostUrgentAction(crop);
    
    const titleElement = document.getElementById('cropTitle');
    const contentElement = document.getElementById('cropDetailsContent');
    
    if (!titleElement || !contentElement) return;
    
    titleElement.textContent = `${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Plant`;
    
    contentElement.innerHTML = `
      <div class="quality-badge ${qualityRating.toLowerCase()}">${qualityRating}</div>
      
      <div class="urgent-status ${urgentAction.class}">
        <div class="status-icon">⚠️</div>
        <div class="status-text">${urgentAction.text}</div>
      </div>
      
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">Growth</div>
          <div class="stat-value">${Math.floor(crop.growth)}%</div>
          <div class="stat-bar">
            <div class="stat-fill growth" style="width: ${crop.growth}%"></div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Health</div>
          <div class="stat-value">${Math.floor(crop.health)}%</div>
          <div class="stat-bar">
            <div class="stat-fill health" style="width: ${crop.health}%"></div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Water</div>
          <div class="stat-value">${Math.floor(crop.waterLevel)}%</div>
          <div class="stat-bar">
            <div class="stat-fill water" style="width: ${crop.waterLevel}%"></div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Nutrients</div>
          <div class="stat-value">${Math.floor(crop.nutrientLevel)}%</div>
          <div class="stat-bar">
            <div class="stat-fill nutrients" style="width: ${crop.nutrientLevel}%"></div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Soil Moisture</div>
          <div class="stat-value">${Math.floor(crop.soilMoisture)}%</div>
          <div class="stat-bar">
            <div class="stat-fill water" style="width: ${crop.soilMoisture}%"></div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Disease Level</div>
          <div class="stat-value">${Math.floor(crop.diseaseLevel)}%</div>
          <div class="stat-bar">
            <div class="stat-fill health" style="width: ${crop.diseaseLevel}%"></div>
          </div>
        </div>
      </div>
      
      <div class="crop-info">
        <div class="info-row">
          <span>Days since planted:</span>
          <span>${Math.floor(daysSincePlanted)}</span>
        </div>
        <div class="info-row">
          <span>Days to maturity:</span>
          <span>${Math.floor(daysToMaturity)}</span>
        </div>
        <div class="info-row">
          <span>Expected yield:</span>
          <span>${crop.cropInfo.harvestYield}</span>
        </div>
        <div class="info-row">
          <span>Water requirement:</span>
          <span>${crop.cropInfo.waterNeed}</span>
        </div>
        <div class="info-row">
          <span>Environmental stress:</span>
          <span>${Math.floor(crop.environmentalStress * 100)}%</span>
        </div>
      </div>
      
      <div class="action-grid">
        <button class="action-btn ${crop.growth < 80 || crop.health < 30 ? 'disabled' : ''}" 
                onclick="window.cropAction('harvest')"
                ${crop.growth < 80 || crop.health < 30 ? 'disabled' : ''}>
          <div class="action-icon">🌾</div>
          <div class="action-text">${crop.growth >= 80 ? (crop.health >= 30 ? 'Harvest' : 'Too Unhealthy') : 'Not Ready'}</div>
        </button>
        
        <button class="action-btn ${crop.waterLevel > 80 ? 'disabled' : ''}" 
                onclick="window.cropAction('water')"
                ${crop.waterLevel > 80 ? 'disabled' : ''}>
          <div class="action-icon">💧</div>
          <div class="action-text">${crop.waterLevel > 80 ? 'Well Watered' : 'Water Plant'}</div>
        </button>
        
        <button class="action-btn ${crop.health > 80 && crop.diseaseLevel < 20 ? 'disabled' : ''}" 
                onclick="window.cropAction('fix')"
                ${crop.health > 80 && crop.diseaseLevel < 20 ? 'disabled' : ''}>
          <div class="action-icon">🔧</div>
          <div class="action-text">${crop.health > 80 && crop.diseaseLevel < 20 ? 'Healthy' : 'Treat'}</div>
        </button>
        
        <button class="action-btn ${crop.nutrientLevel > 80 ? 'disabled' : ''}" 
                onclick="window.cropAction('fertilize')"
                ${crop.nutrientLevel > 80 ? 'disabled' : ''}>
          <div class="action-icon">🌱</div>
          <div class="action-text">${crop.nutrientLevel > 80 ? 'Well Fed' : 'Fertilize'}</div>
        </button>
        
        <button class="action-btn" onclick="window.cropAction('inspect')">
          <div class="action-icon">🔍</div>
          <div class="action-text">Inspect</div>
        </button>
        
        <button class="action-btn" onclick="window.cropAction('ai_analyze')">
          <div class="action-icon">🤖</div>
          <div class="action-text">AI Analysis</div>
        </button>
      </div>
    `;

    // Set up global action handler
    window.cropAction = (action) => {
      if (this.onCropAction && this.currentCrop) {
        this.onCropAction(action, this.currentCrop);
        
        // Update the panel after action
        setTimeout(() => {
          if (!document.getElementById('cropDetailsPanel').classList.contains('hidden')) {
            this.populateCropDetails(this.currentCrop);
          }
        }, 100);
        
        // Show AI analysis if requested
        if (action === 'ai_analyze') {
          setTimeout(() => {
            this.showAIAnalysis(this.currentCrop);
          }, 500);
        }
      }
    };
  }

  getMostUrgentAction(crop) {
    const actions = [];
    
    // Critical conditions
    if (crop.health < 30) {
      actions.push({ priority: 10, text: "🚨 Critical Health - Needs Treatment!", class: "critical" });
    }
    
    if (crop.waterLevel < 20) {
      actions.push({ priority: 9, text: "💧 Severely Dehydrated - Water Immediately!", class: "critical" });
    }
    
    if (crop.diseaseLevel > 70) {
      actions.push({ priority: 8, text: "🦠 Severe Disease - Apply Treatment!", class: "critical" });
    }
    
    // Harvest readiness
    if (crop.growth >= 80 && crop.health >= 30) {
      actions.push({ priority: 7, text: "🌾 Ready to Harvest!", class: "harvest" });
    }
    
    // Moderate issues
    if (crop.waterLevel < 40) {
      actions.push({ priority: 6, text: "💧 Needs Watering", class: "water" });
    }
    
    if (crop.nutrientLevel < 30) {
      actions.push({ priority: 5, text: "🌱 Needs Fertilizer", class: "fertilize" });
    }
    
    if (crop.diseaseLevel > 40) {
      actions.push({ priority: 4, text: "🔧 Disease Treatment Recommended", class: "fix" });
    }
    
    if (crop.health < 60) {
      actions.push({ priority: 3, text: "🔧 Health Improvement Needed", class: "fix" });
    }
    
    // Growth stage
    if (crop.growth < 80) {
      const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24));
      actions.push({ priority: 2, text: `🌱 Growing (${Math.floor(daysToMaturity)} days to maturity)`, class: "growing" });
    }
    
    // Default healthy state
    if (actions.length === 0) {
      actions.push({ priority: 1, text: "✅ Healthy Plant", class: "healthy" });
    }
    
    actions.sort((a, b) => b.priority - a.priority);
    return actions[0];
  }

  getCropStatus(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return { text: "Excellent Condition", class: "excellent" };
    if (avgCondition >= 75) return { text: "Good Condition", class: "good" };
    if (avgCondition >= 60) return { text: "Fair Condition", class: "fair" };
    if (avgCondition >= 40) return { text: "Poor Condition", class: "poor" };
    return { text: "Critical Condition", class: "critical" };
  }

  getQualityRating(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return "Premium";
    if (avgCondition >= 75) return "Excellent";
    if (avgCondition >= 60) return "Good";
    if (avgCondition >= 40) return "Fair";
    return "Poor";
  }

  showAIAnalysis(crop) {
    this.showingAIAnalysis = true;
    
    // Show HTML panel
    const panel = document.getElementById('aiAnalysisPanel');
    if (panel) {
      panel.classList.remove('hidden');
      const content = document.getElementById('aiContent');
      if (content) {
        content.innerHTML = '<div class="loading">🤖 AI analyzing crop conditions...</div>';
      }
    }
  }

  displayAIAnalysis(analysis) {
    const content = document.getElementById('aiContent');
    if (content) {
      content.innerHTML = `
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
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; opacity: 0.7;">
          AI Confidence: ${analysis.confidence}% | Analysis Time: ${new Date(analysis.timestamp).toLocaleTimeString()}
        </div>
      `;
    }
  }

  showInstructions() {
    this.showingInstructions = true;
    
    const overlay = document.getElementById('instructionsOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  toggleInstructions() {
    this.showingInstructions = !this.showingInstructions;
    
    const overlay = document.getElementById('instructionsOverlay');
    if (overlay) {
      if (this.showingInstructions) {
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  hideInstructions() {
    this.showingInstructions = false;
    
    const overlay = document.getElementById('instructionsOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  toggleRootView() {
    if (this.onRootViewToggle) {
      this.rootViewActive = this.onRootViewToggle();
      
      // Update button state
      const btn = document.getElementById('rootViewToggle');
      if (btn) {
        if (this.rootViewActive) {
          btn.classList.add('active');
          btn.textContent = '🌱 Surface View';
        } else {
          btn.classList.remove('active');
          btn.textContent = '🌱 Root View';
        }
      }
    }
  }

  hideAllPanels() {
    this.showingCropDetails = false;
    this.showingAIAnalysis = false;
    
    // Hide HTML panels
    const cropPanel = document.getElementById('cropDetailsPanel');
    const aiPanel = document.getElementById('aiAnalysisPanel');
    if (cropPanel) cropPanel.classList.add('hidden');
    if (aiPanel) aiPanel.classList.add('hidden');
    
    this.currentCrop = null;
    if (window.cropAction) {
      delete window.cropAction;
    }
  }

  updateWeather() {
    const temperatures = [18, 20, 22, 25, 28, 24, 21];
    const humidities = [60, 65, 70, 55, 50, 68, 72];
    const weatherIcons = ['☀️', '⛅', '🌤️', '🌦️'];
    
    this.weather.temp = temperatures[Math.floor(Math.random() * temperatures.length)];
    this.weather.humidity = humidities[Math.floor(Math.random() * humidities.length)];
    this.weather.icon = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
  }

  onWindowResize() {
    // Handle window resize for UI elements
  }
}
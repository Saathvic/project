export class AdvancedUIManager {
  constructor() {
    this.cropDetailsPanel = document.getElementById('cropDetailsPanel');
    this.aiAnalysisPanel = document.getElementById('aiAnalysisPanel');
    this.instructionsOverlay = document.getElementById('instructionsOverlay');
    this.gameHUD = document.getElementById('gameHUD');
    
    this.currentCrop = null;
    this.onCropAction = null;
    this.onRootViewToggle = null;
    this.onStartGame = null;
    
    this.createCrosshair();
    this.setupEventListeners();
    this.updateGameTime();
    this.updateWeatherDisplay();
    
    // Start game time updates
    setInterval(() => this.updateGameTime(), 60000); // Update every minute
    setInterval(() => this.updateWeatherDisplay(), 300000); // Update every 5 minutes
  }

  createCrosshair() {
    this.crosshair = document.getElementById('crosshair');
    this.crosshairHint = this.crosshair.querySelector('.crosshair-hint');
    this.hintText = this.crosshair.querySelector('.hint-text');
  }

  setupEventListeners() {
    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', async () => {
      this.hideInstructions();
      if (this.onStartGame) {
        await this.onStartGame();
      }
    });

    // Root view toggle
    document.getElementById('rootViewToggle').addEventListener('click', () => {
      if (this.onRootViewToggle) {
        const isActive = this.onRootViewToggle();
        const btn = document.getElementById('rootViewToggle');
        if (isActive) {
          btn.classList.add('active');
          btn.textContent = '🌱 Surface View';
        } else {
          btn.classList.remove('active');
          btn.textContent = '🌱 Root View';
        }
      }
    });

    // Help button
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.showInstructions();
    });

    // Close panel buttons
    document.getElementById('closePanelBtn').addEventListener('click', () => {
      this.hideCropDetails();
    });

    document.getElementById('closeAIBtn').addEventListener('click', () => {
      this.hideAIAnalysis();
    });

    // Click outside to close panels
    document.addEventListener('click', (event) => {
      if (!this.cropDetailsPanel.contains(event.target) && 
          !this.crosshair.contains(event.target) &&
          !event.target.closest('.view-btn')) {
        this.hideCropDetails();
      }
      
      if (!this.aiAnalysisPanel.contains(event.target)) {
        this.hideAIAnalysis();
      }
    });
  }

  updateCrosshairHint(targetCrop) {
    if (targetCrop) {
      const urgentAction = this.getMostUrgentAction(targetCrop);
      const cropStatus = this.getCropStatus(targetCrop);
      
      this.hintText.innerHTML = `
        <div class="crop-name">${targetCrop.type.charAt(0).toUpperCase() + targetCrop.type.slice(1)}</div>
        <div class="crop-status ${cropStatus.class}">${cropStatus.text}</div>
        <div class="urgent-action">${urgentAction.text}</div>
      `;
      
      this.crosshairHint.className = `crosshair-hint ${urgentAction.class}`;
      this.crosshair.className = `dynamic-crosshair targeting ${urgentAction.class}`;
    } else {
      this.crosshairHint.classList.add('hidden');
      this.crosshair.className = 'dynamic-crosshair';
    }
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

  showCropDetails(crop, camera) {
    this.currentCrop = crop;
    this.populateCropDetails(crop);
    this.cropDetailsPanel.classList.remove('hidden');
  }

  populateCropDetails(crop) {
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - daysSincePlanted);
    const qualityRating = this.getQualityRating(crop);
    const urgentAction = this.getMostUrgentAction(crop);
    
    document.getElementById('cropTitle').textContent = `${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Plant`;
    
    document.getElementById('cropDetailsContent').innerHTML = `
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
          if (!this.cropDetailsPanel.classList.contains('hidden')) {
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

  async showAIAnalysis(crop) {
    this.aiAnalysisPanel.classList.remove('hidden');
    
    // Show loading
    document.getElementById('aiContent').innerHTML = '<div class="loading">🤖 AI analyzing crop conditions...</div>';
    
    // Get AI analysis
    if (crop.lastAIAnalysis) {
      this.displayAIAnalysis(crop.lastAIAnalysis);
    } else {
      // Trigger new analysis
      if (this.onCropAction) {
        const analysis = await this.onCropAction('ai_analyze', crop);
        if (analysis) {
          this.displayAIAnalysis(analysis);
        }
      }
    }
  }

  displayAIAnalysis(analysis) {
    document.getElementById('aiContent').innerHTML = `
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

  hideCropDetails() {
    this.cropDetailsPanel.classList.add('hidden');
    this.currentCrop = null;
    if (window.cropAction) {
      delete window.cropAction;
    }
  }

  hideAIAnalysis() {
    this.aiAnalysisPanel.classList.add('hidden');
  }

  showInstructions() {
    this.instructionsOverlay.classList.remove('hidden');
  }

  hideInstructions() {
    this.instructionsOverlay.classList.add('hidden');
  }

  updateGameTime() {
    const now = new Date();
    const gameDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24)) % 365 + 1;
    const gameTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('gameTime').textContent = `Day ${gameDay} - ${gameTime}`;
  }

  updateWeatherDisplay() {
    // Simulate weather changes
    const temperatures = [18, 20, 22, 25, 28, 24, 21];
    const humidities = [60, 65, 70, 55, 50, 68, 72];
    const weatherIcons = ['☀️', '⛅', '🌤️', '🌦️', '⛈️'];
    
    const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
    const humidity = humidities[Math.floor(Math.random() * humidities.length)];
    const icon = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
    
    document.getElementById('weatherIcon').textContent = icon;
    document.getElementById('temperature').textContent = `${temp}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
  }

  getQualityRating(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return "Premium";
    if (avgCondition >= 75) return "Excellent";
    if (avgCondition >= 60) return "Good";
    if (avgCondition >= 40) return "Fair";
    return "Poor";
  }

  updateInteractionHint(targetCrop) {
    this.updateCrosshairHint(targetCrop);
  }
}
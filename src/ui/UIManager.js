import * as THREE from 'three';

export class UIManager {
  constructor() {
    this.contextMenu = document.getElementById('contextMenu');
    this.instructions = document.getElementById('instructions');
    
    this.currentCrop = null;
    this.onCropAction = null;
    
    this.createAdvancedUI();
    this.createCrosshair();
    this.setupEventListeners();
    this.hideInstructionsAfterDelay();
  }

  createCrosshair() {
    // Remove existing crosshair
    const existingCrosshair = document.getElementById('crosshair');
    if (existingCrosshair) {
      existingCrosshair.remove();
    }

    // Create new dynamic crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    this.crosshair.className = 'dynamic-crosshair';
    this.crosshair.innerHTML = `
      <div class="crosshair-center">+</div>
      <div class="crosshair-hint hidden">
        <div class="hint-text"></div>
        <div class="hint-action">Press E to interact</div>
      </div>
    `;
    
    document.getElementById('ui').appendChild(this.crosshair);
    
    this.crosshairHint = this.crosshair.querySelector('.crosshair-hint');
    this.hintText = this.crosshair.querySelector('.hint-text');
  }

  createAdvancedUI() {
    // Remove old context menu
    if (this.contextMenu) {
      this.contextMenu.remove();
    }

    // Create new advanced popup
    this.contextMenu = document.createElement('div');
    this.contextMenu.id = 'contextMenu';
    this.contextMenu.className = 'advanced-popup hidden';
    
    document.getElementById('ui').appendChild(this.contextMenu);
  }

  setupEventListeners() {
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', (event) => {
      if (!this.contextMenu.contains(event.target)) {
        this.hideContextMenu();
      }
    });

    // Prevent menu from closing when clicking inside
    this.contextMenu.addEventListener('click', (event) => {
      event.stopPropagation();
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
    // Determine the most urgent action needed for this crop
    const actions = [];
    
    // Check for critical conditions first
    if (crop.health < 30) {
      actions.push({ priority: 10, text: "🚨 Critical Health - Needs Treatment!", class: "critical" });
    }
    
    if (crop.waterLevel < 20) {
      actions.push({ priority: 9, text: "💧 Severely Dehydrated - Water Immediately!", class: "critical" });
    }
    
    if (crop.diseaseLevel > 70) {
      actions.push({ priority: 8, text: "🦠 Severe Disease - Apply Treatment!", class: "critical" });
    }
    
    // Check for harvest readiness
    if (crop.growth >= 80 && crop.health >= 30) {
      actions.push({ priority: 7, text: "🌾 Ready to Harvest!", class: "harvest" });
    }
    
    // Check for moderate issues
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
    
    // Check for growth stage
    if (crop.growth < 80) {
      const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24));
      actions.push({ priority: 2, text: `🌱 Growing (${Math.floor(daysToMaturity)} days to maturity)`, class: "growing" });
    }
    
    // Default healthy state
    if (actions.length === 0) {
      actions.push({ priority: 1, text: "✅ Healthy Plant", class: "healthy" });
    }
    
    // Return the highest priority action
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

  updateInteractionHint(targetCrop) {
    if (targetCrop) {
      this.updateCrosshairHint(targetCrop);
    } else {
      this.updateCrosshairHint(null);
    }
  }

  showContextMenu(crop, camera) {
    this.currentCrop = crop;
    
    // Project 3D position to screen coordinates
    const vector = crop.position.clone();
    vector.y += 2;
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    this.contextMenu.style.left = `${Math.max(10, Math.min(window.innerWidth - 400, x - 200))}px`;
    this.contextMenu.style.top = `${Math.max(10, Math.min(window.innerHeight - 500, y))}px`;
    
    this.populateAdvancedMenu(crop);
    this.contextMenu.classList.remove('hidden');
  }

  populateAdvancedMenu(crop) {
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = Math.max(0, crop.cropInfo.growthTime - daysSincePlanted);
    const qualityRating = this.getQualityRating(crop);
    const urgentAction = this.getMostUrgentAction(crop);
    
    this.contextMenu.innerHTML = `
      <div class="popup-header">
        <h3>${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Plant</h3>
        <div class="quality-badge ${qualityRating.toLowerCase().replace(' ', '-')}">${qualityRating}</div>
      </div>
      
      <div class="urgent-status ${urgentAction.class}">
        <div class="status-icon">⚠️</div>
        <div class="status-text">${urgentAction.text}</div>
      </div>
      
      <div class="crop-stats">
        <div class="stat-row">
          <span class="stat-label">Growth Progress:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${crop.growth}%"></div>
            <span class="progress-text">${Math.floor(crop.growth)}%</span>
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Health:</span>
          <div class="progress-bar health">
            <div class="progress-fill" style="width: ${crop.health}%"></div>
            <span class="progress-text">${Math.floor(crop.health)}%</span>
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Water Level:</span>
          <div class="progress-bar water">
            <div class="progress-fill" style="width: ${crop.waterLevel}%"></div>
            <span class="progress-text">${Math.floor(crop.waterLevel)}%</span>
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Soil Moisture:</span>
          <div class="progress-bar soil">
            <div class="progress-fill" style="width: ${crop.soilMoisture}%"></div>
            <span class="progress-text">${Math.floor(crop.soilMoisture)}%</span>
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Nutrients:</span>
          <div class="progress-bar nutrients">
            <div class="progress-fill" style="width: ${crop.nutrientLevel}%"></div>
            <span class="progress-text">${Math.floor(crop.nutrientLevel)}%</span>
          </div>
        </div>
        
        <div class="stat-row">
          <span class="stat-label">Disease Level:</span>
          <div class="progress-bar disease">
            <div class="progress-fill" style="width: ${crop.diseaseLevel}%"></div>
            <span class="progress-text">${Math.floor(crop.diseaseLevel)}%</span>
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
      </div>
      
      <div class="action-buttons">
        <button class="action-btn harvest ${crop.growth < 80 || crop.health < 30 ? 'disabled' : ''}" 
                onclick="window.cropAction('harvest')"
                ${crop.growth < 80 || crop.health < 30 ? 'disabled' : ''}>
          <span class="btn-icon">🌾</span>
          <div class="btn-content">
            <span class="btn-title">Harvest</span>
            <span class="btn-desc">${crop.growth >= 80 ? (crop.health >= 30 ? 'Ready to harvest' : 'Too unhealthy') : `${Math.floor(crop.growth)}% grown`}</span>
          </div>
        </button>
        
        <button class="action-btn water ${crop.waterLevel > 80 ? 'disabled' : ''}" 
                onclick="window.cropAction('water')"
                ${crop.waterLevel > 80 ? 'disabled' : ''}>
          <span class="btn-icon">💧</span>
          <div class="btn-content">
            <span class="btn-title">Water Plant</span>
            <span class="btn-desc">${crop.waterLevel > 80 ? 'Well watered' : 'Needs water'}</span>
          </div>
        </button>
        
        <button class="action-btn fix ${crop.health > 80 && crop.diseaseLevel < 20 ? 'disabled' : ''}" 
                onclick="window.cropAction('fix')"
                ${crop.health > 80 && crop.diseaseLevel < 20 ? 'disabled' : ''}>
          <span class="btn-icon">🔧</span>
          <div class="btn-content">
            <span class="btn-title">Treat Disease</span>
            <span class="btn-desc">${crop.health > 80 && crop.diseaseLevel < 20 ? 'Healthy plant' : 'Apply treatment'}</span>
          </div>
        </button>
        
        <button class="action-btn fertilize ${crop.nutrientLevel > 80 ? 'disabled' : ''}" 
                onclick="window.cropAction('fertilize')"
                ${crop.nutrientLevel > 80 ? 'disabled' : ''}>
          <span class="btn-icon">🌱</span>
          <div class="btn-content">
            <span class="btn-title">Fertilize</span>
            <span class="btn-desc">${crop.nutrientLevel > 80 ? 'Well fertilized' : 'Boost nutrients'}</span>
          </div>
        </button>
        
        <button class="action-btn inspect" onclick="window.cropAction('inspect')">
          <span class="btn-icon">🔍</span>
          <div class="btn-content">
            <span class="btn-title">Detailed Inspection</span>
            <span class="btn-desc">View complete analysis</span>
          </div>
        </button>
      </div>
    `;

    // Set up global action handler
    window.cropAction = (action) => {
      if (this.onCropAction && this.currentCrop) {
        this.onCropAction(action, this.currentCrop);
        // Update the menu after action
        setTimeout(() => {
          if (!this.contextMenu.classList.contains('hidden')) {
            this.populateAdvancedMenu(this.currentCrop);
          }
        }, 100);
      }
    };
  }

  getQualityRating(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return "Excellent";
    if (avgCondition >= 75) return "Good";
    if (avgCondition >= 60) return "Fair";
    if (avgCondition >= 40) return "Poor";
    return "Very Poor";
  }

  hideContextMenu() {
    this.contextMenu.classList.add('hidden');
    this.currentCrop = null;
    if (window.cropAction) {
      delete window.cropAction;
    }
  }

  hideInstructionsAfterDelay() {
    setTimeout(() => {
      this.instructions.style.opacity = '0';
      setTimeout(() => {
        this.instructions.style.display = 'none';
      }, 1000);
    }, 10000);
  }
}
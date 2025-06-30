import * as THREE from 'three';
import { AIManager } from '../ai/AIManager.js';

export class RealisticCropManager {
  constructor(scene) {
    this.scene = scene;
    this.crops = [];
    this.aiManager = new AIManager();
    this.environmentalFactors = {
      soilQuality: 0.7,
      weather: 'sunny',
      season: 'summer',
      temperature: 22,
      humidity: 65,
      windSpeed: 5
    };
  }

  async loadCrops() {
    await this.createRealisticFarm();
  }

  async createRealisticFarm() {
    const cropTypes = [
      { 
        name: 'wheat', 
        color: 0xDAA520, 
        height: 1.2, 
        stages: 5,
        waterNeed: 'medium',
        growthTime: 60,
        harvestYield: '2-3 kg per plant',
        rootDepth: 1.5
      },
      { 
        name: 'corn', 
        color: 0xFFD700, 
        height: 2.5, 
        stages: 6,
        waterNeed: 'high',
        growthTime: 90,
        harvestYield: '1-2 ears per plant',
        rootDepth: 2.0
      },
      { 
        name: 'tomato', 
        color: 0xFF6347, 
        height: 1.8, 
        stages: 5,
        waterNeed: 'medium',
        growthTime: 75,
        harvestYield: '3-5 tomatoes per plant',
        rootDepth: 1.2
      },
      { 
        name: 'lettuce', 
        color: 0x90EE90, 
        height: 0.8, 
        stages: 4,
        waterNeed: 'high',
        growthTime: 30,
        harvestYield: '1 head per plant',
        rootDepth: 0.6
      },
      { 
        name: 'carrot', 
        color: 0xFF8C00, 
        height: 0.9, 
        stages: 4,
        waterNeed: 'low',
        growthTime: 45,
        harvestYield: '1 carrot per plant',
        rootDepth: 1.0
      }
    ];

    // Create organized farm plots
    const cropPromises = [];
    
    for (let plot = 0; plot < 4; plot++) {
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          const x = (col - 4) * 2.5 + (plot % 2) * 20 - 10;
          const z = (row - 3) * 3 + Math.floor(plot / 2) * 18 - 9;
          
          if (Math.random() > 0.2) {
            const cropType = cropTypes[plot % cropTypes.length];
            cropPromises.push(this.createAdvancedCrop(cropType, x, z));
          }
        }
      }
    }

    try {
      this.crops = await Promise.all(cropPromises);
      console.log(`Created ${this.crops.length} crops successfully`);
    } catch (error) {
      console.error('Error creating crops:', error);
      this.crops = [];
    }
  }

  async createAdvancedCrop(cropType, x, z) {
    const variations = await this.aiManager.generateCropVariation(cropType.name, this.environmentalFactors);
    
    const group = new THREE.Group();
    
    const heightVariation = variations.height_variation || (0.8 + Math.random() * 0.4);
    const colorVariation = variations.color_variation || (Math.random() * 0.3);
    const leafCountModifier = variations.leaf_count || (0.7 + Math.random() * 0.6);
    
    const growthStage = Math.floor(Math.random() * cropType.stages * 0.8) + 1;
    const growthProgress = growthStage / (cropType.stages - 1);
    
    // Create plant based on type
    switch (cropType.name) {
      case 'wheat':
        this.createRealisticWheat(group, growthProgress, cropType, heightVariation, colorVariation, leafCountModifier);
        break;
      case 'corn':
        this.createRealisticCorn(group, growthProgress, cropType, heightVariation, colorVariation, leafCountModifier);
        break;
      case 'tomato':
        this.createRealisticTomato(group, growthProgress, cropType, heightVariation, colorVariation, leafCountModifier);
        break;
      case 'lettuce':
        this.createRealisticLettuce(group, growthProgress, cropType, heightVariation, colorVariation, leafCountModifier);
        break;
      case 'carrot':
        this.createRealisticCarrot(group, growthProgress, cropType, heightVariation, colorVariation, leafCountModifier);
        break;
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.createSoilMound(x, z);

    const crop = {
      mesh: group,
      type: cropType.name,
      position: new THREE.Vector3(x, 0, z),
      health: 60 + Math.random() * 30,
      waterLevel: 40 + Math.random() * 40,
      growth: growthProgress * 100,
      maxStages: cropType.stages,
      currentStage: growthStage,
      animationOffset: Math.random() * Math.PI * 2,
      soilMoisture: 50 + Math.random() * 30,
      diseaseLevel: Math.random() * 15,
      nutrientLevel: 60 + Math.random() * 30,
      lastWatered: Date.now() - Math.random() * 43200000,
      plantedDate: Date.now() - Math.random() * cropType.growthTime * 12 * 60 * 60 * 1000,
      cropInfo: cropType,
      aiVariations: variations,
      lastAIAnalysis: null,
      environmentalStress: Math.random() * 0.2,
      isHarvested: false
    };

    return crop;
  }

  createRealisticWheat(group, growthProgress, cropType, heightVar, colorVar, leafMod) {
    const height = cropType.height * heightVar * (0.3 + growthProgress * 0.7);
    const stalkCount = Math.floor((6 + Math.random() * 8) * leafMod);
    
    for (let i = 0; i < stalkCount; i++) {
      const stalkGeometry = new THREE.CylinderGeometry(0.015, 0.025, height, 6);
      const stalkColor = new THREE.Color(0x228B22).multiplyScalar(1 - colorVar * 0.3);
      const stalkMaterial = new THREE.MeshLambertMaterial({ color: stalkColor });
      const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
      
      const angle = (i / stalkCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = Math.random() * 0.3;
      
      stalk.position.set(
        Math.sin(angle) * radius,
        height / 2,
        Math.cos(angle) * radius
      );
      stalk.rotation.z = (Math.random() - 0.5) * 0.2;
      stalk.castShadow = true;
      group.add(stalk);

      for (let j = 0; j < 2 + Math.floor(growthProgress * 3); j++) {
        const leafGeometry = new THREE.PlaneGeometry(0.08, height * 0.6);
        const leafMaterial = new THREE.MeshLambertMaterial({ 
          color: stalkColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.set(
          stalk.position.x + (Math.random() - 0.5) * 0.1,
          height * 0.4 + j * height * 0.15,
          stalk.position.z + (Math.random() - 0.5) * 0.1
        );
        leaf.rotation.y = Math.random() * Math.PI * 2;
        leaf.rotation.z = (Math.random() - 0.5) * 0.3;
        leaf.castShadow = true;
        group.add(leaf);
      }

      if (growthProgress > 0.7) {
        const headGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.15, 8);
        const headColor = new THREE.Color(cropType.color).multiplyScalar(1 - colorVar * 0.2);
        const headMaterial = new THREE.MeshLambertMaterial({ color: headColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(stalk.position.x, height + 0.1, stalk.position.z);
        head.castShadow = true;
        group.add(head);
      }
    }
  }

  createRealisticCorn(group, growthProgress, cropType, heightVar, colorVar, leafMod) {
    const height = cropType.height * heightVar * (0.4 + growthProgress * 0.6);
    
    const stalkGeometry = new THREE.CylinderGeometry(0.08, 0.15, height, 8);
    const stalkColor = new THREE.Color(0x228B22).multiplyScalar(1 - colorVar * 0.2);
    const stalkMaterial = new THREE.MeshLambertMaterial({ color: stalkColor });
    const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
    stalk.position.y = height / 2;
    stalk.castShadow = true;
    group.add(stalk);

    const leafCount = Math.floor((6 + Math.random() * 6) * leafMod);
    for (let i = 0; i < leafCount; i++) {
      const leafHeight = height * (0.6 + Math.random() * 0.3);
      const leafWidth = 0.25 + Math.random() * 0.15;
      
      const leafGeometry = new THREE.PlaneGeometry(leafWidth, leafHeight);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: stalkColor.clone().multiplyScalar(1.1),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const leafHeight_pos = (i / leafCount) * height * 0.8 + height * 0.2;
      leaf.position.set(
        Math.sin(i * 0.8) * 0.2,
        leafHeight_pos,
        Math.cos(i * 0.8) * 0.2
      );
      leaf.rotation.y = i * 0.8;
      leaf.rotation.z = Math.PI * 0.1 + (Math.random() - 0.5) * 0.2;
      leaf.castShadow = true;
      group.add(leaf);
    }

    if (growthProgress > 0.6) {
      const earCount = 1 + Math.floor(growthProgress * 1.5);
      for (let i = 0; i < earCount; i++) {
        const earGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 12);
        const earColor = new THREE.Color(cropType.color).multiplyScalar(1 - colorVar * 0.15);
        const earMaterial = new THREE.MeshLambertMaterial({ color: earColor });
        const ear = new THREE.Mesh(earGeometry, earMaterial);
        
        ear.position.set(
          Math.sin(i * Math.PI) * 0.18,
          height * 0.6 + i * 0.1,
          Math.cos(i * Math.PI) * 0.18
        );
        ear.rotation.z = Math.PI * 0.15;
        ear.castShadow = true;
        group.add(ear);
      }
    }
  }

  createRealisticTomato(group, growthProgress, cropType, heightVar, colorVar, leafMod) {
    const height = cropType.height * heightVar * (0.3 + growthProgress * 0.7);
    
    const vineGeometry = new THREE.CylinderGeometry(0.025, 0.04, height, 6);
    const vineColor = new THREE.Color(0x228B22).multiplyScalar(1 - colorVar * 0.2);
    const vineMaterial = new THREE.MeshLambertMaterial({ color: vineColor });
    const vine = new THREE.Mesh(vineGeometry, vineMaterial);
    vine.position.y = height / 2;
    vine.castShadow = true;
    group.add(vine);

    const stakeGeometry = new THREE.CylinderGeometry(0.015, 0.015, height * 1.2, 4);
    const stakeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
    stake.position.set(0.2, height * 0.6, 0);
    stake.castShadow = true;
    group.add(stake);

    const leafCount = Math.floor((8 + Math.random() * 8) * leafMod);
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.15, 0.1);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: vineColor,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      leaf.position.set(
        Math.sin(i * 0.7) * 0.3,
        (i / leafCount) * height * 0.9 + 0.1,
        Math.cos(i * 0.7) * 0.3
      );
      leaf.rotation.y = i * 0.7;
      leaf.rotation.x = (Math.random() - 0.5) * 0.4;
      leaf.castShadow = true;
      group.add(leaf);
    }

    if (growthProgress > 0.4) {
      const tomatoCount = Math.floor(growthProgress * 6);
      for (let i = 0; i < tomatoCount; i++) {
        const size = 0.06 + Math.random() * 0.04;
        const tomatoGeometry = new THREE.SphereGeometry(size, 8, 8);
        
        const ripeness = Math.random();
        let tomatoColor;
        if (ripeness > 0.8) {
          tomatoColor = new THREE.Color(cropType.color);
        } else if (ripeness > 0.5) {
          tomatoColor = new THREE.Color(0xFFA500);
        } else {
          tomatoColor = new THREE.Color(0x90EE90);
        }
        
        const tomatoMaterial = new THREE.MeshLambertMaterial({ color: tomatoColor });
        const tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
        
        tomato.position.set(
          Math.sin(i * 1.3) * 0.3,
          height * 0.3 + (i * 0.1),
          Math.cos(i * 1.3) * 0.3
        );
        tomato.castShadow = true;
        group.add(tomato);
      }
    }
  }

  createRealisticLettuce(group, growthProgress, cropType, heightVar, colorVar, leafMod) {
    const leafCount = Math.floor((8 + Math.random() * 12) * leafMod);
    const maxRadius = 0.4 * heightVar * (0.5 + growthProgress * 0.5);
    
    for (let i = 0; i < leafCount; i++) {
      const layer = Math.floor(i / 4);
      const leafInLayer = i % 4;
      const radius = maxRadius * (0.3 + layer * 0.35);
      
      const leafGeometry = new THREE.PlaneGeometry(0.2 + Math.random() * 0.1, 0.15 + Math.random() * 0.05);
      
      const baseColor = new THREE.Color(cropType.color);
      const leafColor = baseColor.clone().multiplyScalar(0.8 + Math.random() * 0.4 - colorVar * 0.3);
      
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: leafColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const angle = (leafInLayer / 4) * Math.PI * 2 + layer * 0.5;
      leaf.position.set(
        Math.sin(angle) * radius,
        0.05 + layer * 0.08 + Math.random() * 0.03,
        Math.cos(angle) * radius
      );
      
      leaf.rotation.y = angle + (Math.random() - 0.5) * 0.5;
      leaf.rotation.x = -Math.PI * 0.3 + (Math.random() - 0.5) * 0.4;
      leaf.rotation.z = (Math.random() - 0.5) * 0.3;
      
      leaf.castShadow = true;
      group.add(leaf);
    }

    const coreGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.08, 6);
    const coreMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F8FF });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 0.04;
    core.castShadow = true;
    group.add(core);
  }

  createRealisticCarrot(group, growthProgress, cropType, heightVar, colorVar, leafMod) {
    const leafCount = Math.floor((6 + Math.random() * 6) * leafMod);
    for (let i = 0; i < leafCount; i++) {
      const mainStem = new THREE.Group();
      
      const stemGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.3, 4);
      const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 0.15;
      mainStem.add(stem);
      
      for (let j = 0; j < 4 + Math.floor(Math.random() * 4); j++) {
        const leafletGeometry = new THREE.PlaneGeometry(0.03, 0.08);
        const leafletMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color(0x228B22).multiplyScalar(1 - colorVar * 0.2),
          side: THREE.DoubleSide
        });
        const leaflet = new THREE.Mesh(leafletGeometry, leafletMaterial);
        
        leaflet.position.set(
          (Math.random() - 0.5) * 0.06,
          (j / 4) * 0.25 + 0.05,
          (Math.random() - 0.5) * 0.06
        );
        leaflet.rotation.y = Math.random() * Math.PI * 2;
        leaflet.rotation.z = (Math.random() - 0.5) * 0.5;
        mainStem.add(leaflet);
      }
      
      mainStem.position.set(
        Math.sin(i * 0.8) * 0.15,
        0,
        Math.cos(i * 0.8) * 0.15
      );
      mainStem.rotation.y = i * 0.8;
      mainStem.rotation.z = (Math.random() - 0.5) * 0.3;
      mainStem.castShadow = true;
      group.add(mainStem);
    }

    if (growthProgress > 0.5) {
      const rootLength = 0.25 * growthProgress;
      const rootGeometry = new THREE.ConeGeometry(0.04, rootLength, 6);
      const rootColor = new THREE.Color(cropType.color).multiplyScalar(1 - colorVar * 0.2);
      const rootMaterial = new THREE.MeshLambertMaterial({ color: rootColor });
      const root = new THREE.Mesh(rootGeometry, rootMaterial);
      root.position.y = -rootLength * 0.3;
      root.castShadow = true;
      group.add(root);
    }
  }

  createSoilMound(x, z) {
    const moundGeometry = new THREE.CylinderGeometry(0.8, 1.0, 0.25, 12);
    const moundMaterial = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(0x8B4513).multiplyScalar(0.8 + this.environmentalFactors.soilQuality * 0.4)
    });
    const mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.position.set(x, -0.08, z);
    mound.receiveShadow = true;
    this.scene.add(mound);
  }

  update(deltaTime) {
    const time = Date.now() * 0.001;
    
    this.crops.forEach(crop => {
      if (!crop || !crop.mesh || crop.isHarvested) return;
      
      const windStrength = 0.004 + Math.sin(time * 0.3) * 0.002;
      const windSpeed = 0.8 + Math.sin(time * 0.2) * 0.2;
      const offset = crop.animationOffset;
      
      crop.mesh.rotation.z = Math.sin(time * windSpeed + offset) * windStrength;
      crop.mesh.rotation.x = Math.cos(time * windSpeed * 0.8 + offset) * windStrength * 0.6;

      this.simulateAdvancedGrowth(crop, deltaTime);
      this.simulateEnvironmentalEffects(crop, deltaTime);
    });

    this.updateEnvironment(deltaTime);
  }

  simulateAdvancedGrowth(crop, deltaTime) {
    const currentTime = Date.now();
    const timeSinceWatered = currentTime - crop.lastWatered;
    const hoursWithoutWater = timeSinceWatered / (1000 * 60 * 60);

    const aiGrowthModifier = crop.aiVariations?.growth_rate_modifier || 1.0;
    const baseGrowthRate = 0.01 * aiGrowthModifier;

    const temperatureFactor = this.getTemperatureFactor();
    const humidityFactor = this.getHumidityFactor();
    const soilFactor = Math.max(0.1, crop.soilMoisture / 100);
    const nutrientFactor = Math.max(0.1, crop.nutrientLevel / 100);
    const healthFactor = Math.max(0.1, crop.health / 100);

    const totalGrowthRate = baseGrowthRate * temperatureFactor * humidityFactor * soilFactor * nutrientFactor * healthFactor;

    if (crop.growth < 100) {
      crop.growth = Math.min(100, crop.growth + totalGrowthRate * deltaTime);
    }

    const waterConsumption = this.calculateWaterConsumption(crop, deltaTime) * 0.1;
    crop.waterLevel = Math.max(0, crop.waterLevel - waterConsumption);
    crop.soilMoisture = Math.max(0, crop.soilMoisture - waterConsumption * 0.8);

    const nutrientConsumption = totalGrowthRate * 0.5 * deltaTime * 0.1;
    crop.nutrientLevel = Math.max(0, crop.nutrientLevel - nutrientConsumption);

    this.updatePlantHealth(crop, deltaTime);

    const diseaseResistance = crop.aiVariations?.disease_resistance || 0.5;
    const diseaseProgression = (1 - diseaseResistance) * 0.01 * deltaTime;
    
    if (crop.health < 60 || crop.soilMoisture > 85) {
      crop.diseaseLevel = Math.min(100, crop.diseaseLevel + diseaseProgression);
    } else if (crop.health > 80 && crop.soilMoisture < 70) {
      crop.diseaseLevel = Math.max(0, crop.diseaseLevel - diseaseProgression * 0.5);
    }
  }

  simulateEnvironmentalEffects(crop, deltaTime) {
    const weatherStress = this.calculateWeatherStress() * 0.1;
    crop.environmentalStress = Math.min(1, crop.environmentalStress + weatherStress * deltaTime);

    if (crop.environmentalStress > 0.7) {
      crop.health = Math.max(0, crop.health - 0.5 * deltaTime);
    }

    if (crop.environmentalStress > 0 && crop.waterLevel > 60 && crop.nutrientLevel > 50) {
      crop.environmentalStress = Math.max(0, crop.environmentalStress - 0.05 * deltaTime);
    }
  }

  calculateWaterConsumption(crop, deltaTime) {
    const baseConsumption = 0.05;
    const growthFactor = 1 + (crop.growth / 100);
    const temperatureFactor = Math.max(0.5, this.environmentalFactors.temperature / 20);
    const humidityFactor = Math.max(0.5, 1 - (this.environmentalFactors.humidity / 100));
    const windFactor = 1 + (this.environmentalFactors.windSpeed / 20);
    
    return baseConsumption * growthFactor * temperatureFactor * humidityFactor * windFactor * deltaTime;
  }

  updatePlantHealth(crop, deltaTime) {
    let healthChange = 0;

    if (crop.waterLevel > 40 && crop.waterLevel < 80) healthChange += 0.2;
    if (crop.nutrientLevel > 50) healthChange += 0.1;
    if (crop.soilMoisture > 30 && crop.soilMoisture < 70) healthChange += 0.1;

    if (crop.waterLevel < 20) healthChange -= 0.5;
    if (crop.waterLevel > 90) healthChange -= 0.2;
    if (crop.nutrientLevel < 20) healthChange -= 0.3;
    if (crop.diseaseLevel > 50) healthChange -= 0.4;
    if (crop.environmentalStress > 0.8) healthChange -= 0.3;

    crop.health = Math.max(0, Math.min(100, crop.health + healthChange * deltaTime));
  }

  getTemperatureFactor() {
    const temp = this.environmentalFactors.temperature;
    if (temp < 10 || temp > 35) return 0.3;
    if (temp < 15 || temp > 30) return 0.7;
    return 1.0;
  }

  getHumidityFactor() {
    const humidity = this.environmentalFactors.humidity;
    if (humidity < 30 || humidity > 90) return 0.5;
    if (humidity < 40 || humidity > 80) return 0.8;
    return 1.0;
  }

  calculateWeatherStress() {
    let stress = 0;
    
    if (this.environmentalFactors.temperature > 30) stress += 0.1;
    if (this.environmentalFactors.temperature < 10) stress += 0.15;
    if (this.environmentalFactors.humidity > 85) stress += 0.08;
    if (this.environmentalFactors.humidity < 30) stress += 0.12;
    if (this.environmentalFactors.windSpeed > 15) stress += 0.05;
    
    return stress;
  }

  updateEnvironment(deltaTime) {
    this.environmentalFactors.temperature += (Math.random() - 0.5) * 0.01;
    this.environmentalFactors.humidity += (Math.random() - 0.5) * 0.02;
    this.environmentalFactors.windSpeed += (Math.random() - 0.5) * 0.01;

    this.environmentalFactors.temperature = Math.max(5, Math.min(40, this.environmentalFactors.temperature));
    this.environmentalFactors.humidity = Math.max(20, Math.min(95, this.environmentalFactors.humidity));
    this.environmentalFactors.windSpeed = Math.max(0, Math.min(25, this.environmentalFactors.windSpeed));
  }

  async handleCropAction(action, crop) {
    if (!crop || crop.isHarvested) return;

    switch (action) {
      case 'harvest':
        return await this.harvestCrop(crop);
      case 'water':
        this.waterCrop(crop);
        break;
      case 'fix':
        this.fixCrop(crop);
        break;
      case 'fertilize':
        this.fertilizeCrop(crop);
        break;
      case 'inspect':
        await this.inspectCrop(crop);
        break;
      case 'ai_analyze':
        return await this.performAIAnalysis(crop);
    }
  }

  async harvestCrop(crop) {
    if (crop.growth >= 80 && crop.health > 30 && !crop.isHarvested) {
      const analysis = await this.aiManager.analyzeCrop(crop);
      
      console.log(`Successfully harvested ${crop.type}!`);
      console.log(`Yield: ${crop.cropInfo.harvestYield}`);
      console.log(`Quality: ${this.getQualityRating(crop)}`);
      console.log(`AI Prediction: ${analysis.yieldPrediction}`);
      
      // Mark as harvested but don't remove immediately
      crop.isHarvested = true;
      
      // Create harvest effect
      this.createHarvestEffect(crop);
      
      // Remove crop after animation
      setTimeout(() => {
        this.scene.remove(crop.mesh);
        const index = this.crops.indexOf(crop);
        if (index > -1) {
          this.crops.splice(index, 1);
          
          // Plant new seedling after delay
          setTimeout(async () => {
            const newCrop = await this.createAdvancedCrop(crop.cropInfo, crop.position.x, crop.position.z);
            newCrop.currentStage = 0;
            newCrop.growth = 5;
            newCrop.plantedDate = Date.now();
            this.crops.push(newCrop);
          }, 3000);
        }
      }, 2000);
      
      return true;
    } else if (crop.growth < 80) {
      console.log(`${crop.type} is not ready for harvest yet! Growth: ${Math.floor(crop.growth)}%`);
      return false;
    } else {
      console.log(`${crop.type} is too unhealthy to harvest! Health: ${Math.floor(crop.health)}%`);
      return false;
    }
  }

  createHarvestEffect(crop) {
    // Create golden sparkle effect
    for (let i = 0; i < 20; i++) {
      const sparkleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
      const sparkleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 1
      });
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      
      sparkle.position.copy(crop.position);
      sparkle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ));
      
      this.scene.add(sparkle);
      
      // Animate sparkle
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 3
      );
      
      const animateSparkle = () => {
        sparkle.position.add(velocity.clone().multiplyScalar(0.016));
        velocity.y -= 9.8 * 0.016;
        sparkle.material.opacity -= 0.02;
        sparkle.scale.multiplyScalar(0.98);
        
        if (sparkle.material.opacity > 0) {
          requestAnimationFrame(animateSparkle);
        } else {
          this.scene.remove(sparkle);
          sparkle.geometry.dispose();
          sparkle.material.dispose();
        }
      };
      
      setTimeout(() => animateSparkle(), i * 20);
    }
  }

  waterCrop(crop) {
    const waterAmount = 25 + Math.random() * 15;
    crop.waterLevel = Math.min(100, crop.waterLevel + waterAmount);
    crop.soilMoisture = Math.min(100, crop.soilMoisture + waterAmount * 1.2);
    crop.lastWatered = Date.now();
    
    if (crop.soilMoisture > 40 && crop.soilMoisture < 80) {
      crop.growth = Math.min(100, crop.growth + 2);
    }
    
    if (crop.waterLevel > 50) {
      crop.health = Math.min(100, crop.health + 5);
    }
    
    console.log(`Watered ${crop.type}!`);
    console.log(`Water level: ${Math.floor(crop.waterLevel)}%`);
    console.log(`Soil moisture: ${Math.floor(crop.soilMoisture)}%`);
  }

  fixCrop(crop) {
    const treatmentEffectiveness = 60 + Math.random() * 30;
    
    crop.health = Math.min(100, crop.health + treatmentEffectiveness * 0.4);
    crop.diseaseLevel = Math.max(0, crop.diseaseLevel - treatmentEffectiveness * 0.6);
    crop.environmentalStress = Math.max(0, crop.environmentalStress - 0.3);
    
    console.log(`Applied treatment to ${crop.type}!`);
    console.log(`Health improved to: ${Math.floor(crop.health)}%`);
    console.log(`Disease level reduced to: ${Math.floor(crop.diseaseLevel)}%`);
  }

  fertilizeCrop(crop) {
    crop.nutrientLevel = Math.min(100, crop.nutrientLevel + 40);
    crop.growth = Math.min(100, crop.growth + 3);
    crop.health = Math.min(100, crop.health + 8);
    
    console.log(`Fertilized ${crop.type}!`);
    console.log(`Nutrient level: ${Math.floor(crop.nutrientLevel)}%`);
    console.log(`Growth boosted to: ${Math.floor(crop.growth)}%`);
  }

  async inspectCrop(crop) {
    const analysis = await this.aiManager.analyzeCrop(crop);
    crop.lastAIAnalysis = analysis;
    
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = crop.cropInfo.growthTime - daysSincePlanted;
    
    console.log(`=== ${crop.type.toUpperCase()} DETAILED INSPECTION ===`);
    console.log(`AI Analysis Confidence: ${analysis.confidence}%`);
    console.log(`Condition: ${analysis.condition}`);
    console.log(`Urgent Action: ${analysis.urgentAction}`);
    console.log(`Recommendations: ${analysis.recommendations}`);
    console.log(`Disease Management: ${analysis.diseaseManagement}`);
    console.log(`Yield Prediction: ${analysis.yieldPrediction}`);
    console.log(`Timeline: ${analysis.timeline}`);
    console.log(`Environmental Stress: ${Math.floor(crop.environmentalStress * 100)}%`);
  }

  async performAIAnalysis(crop) {
    const analysis = await this.aiManager.analyzeCrop(crop);
    crop.lastAIAnalysis = analysis;
    return analysis;
  }

  getQualityRating(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return "Premium";
    if (avgCondition >= 75) return "Excellent";
    if (avgCondition >= 60) return "Good";
    if (avgCondition >= 40) return "Fair";
    return "Poor";
  }
}
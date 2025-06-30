import * as THREE from 'three';

export class CropManager {
  constructor(scene) {
    this.scene = scene;
    this.crops = [];
    this.createCrops();
  }

  createCrops() {
    const cropTypes = [
      { 
        name: 'wheat', 
        color: 0xDAA520, 
        height: 1.2, 
        stages: 4,
        waterNeed: 'medium',
        growthTime: 60, // days
        harvestYield: '2-3 kg per plant'
      },
      { 
        name: 'corn', 
        color: 0xFFD700, 
        height: 2.0, 
        stages: 5,
        waterNeed: 'high',
        growthTime: 90,
        harvestYield: '1-2 ears per plant'
      },
      { 
        name: 'tomato', 
        color: 0xFF6347, 
        height: 1.5, 
        stages: 4,
        waterNeed: 'medium',
        growthTime: 75,
        harvestYield: '3-5 tomatoes per plant'
      },
      { 
        name: 'carrot', 
        color: 0xFF8C00, 
        height: 0.8, 
        stages: 3,
        waterNeed: 'low',
        growthTime: 45,
        harvestYield: '1 carrot per plant'
      },
      { 
        name: 'lettuce', 
        color: 0x90EE90, 
        height: 0.6, 
        stages: 3,
        waterNeed: 'high',
        growthTime: 30,
        harvestYield: '1 head per plant'
      }
    ];

    // Create crops in organized rows like a real farm
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 12; col++) {
        const x = (col - 6) * 3;
        const z = (row - 4) * 4;
        
        if (Math.random() > 0.2) { // 80% chance to have a crop
          const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
          const crop = this.createRealisticCrop(cropType, x, z);
          this.crops.push(crop);
        }
      }
    }
  }

  createRealisticCrop(cropType, x, z) {
    const group = new THREE.Group();
    
    // Random growth stage
    const growthStage = Math.floor(Math.random() * cropType.stages);
    const growthProgress = growthStage / (cropType.stages - 1);
    
    // Create realistic plant based on type
    switch (cropType.name) {
      case 'wheat':
        this.createWheatPlant(group, growthProgress, cropType);
        break;
      case 'corn':
        this.createCornPlant(group, growthProgress, cropType);
        break;
      case 'tomato':
        this.createTomatoPlant(group, growthProgress, cropType);
        break;
      case 'carrot':
        this.createCarrotPlant(group, growthProgress, cropType);
        break;
      case 'lettuce':
        this.createLettucePlant(group, growthProgress, cropType);
        break;
    }

    // Position the crop
    group.position.set(x, 0, z);
    this.scene.add(group);

    // Create soil mound around plant
    this.createSoilMound(x, z);

    return {
      mesh: group,
      type: cropType.name,
      position: new THREE.Vector3(x, 0, z),
      health: 60 + Math.random() * 40,
      waterLevel: 30 + Math.random() * 50,
      growth: growthProgress * 100,
      maxStages: cropType.stages,
      currentStage: growthStage,
      animationOffset: Math.random() * Math.PI * 2,
      soilMoisture: 40 + Math.random() * 30,
      diseaseLevel: Math.random() * 20,
      nutrientLevel: 50 + Math.random() * 30,
      lastWatered: Date.now() - Math.random() * 86400000, // Random last watered time
      plantedDate: Date.now() - Math.random() * cropType.growthTime * 24 * 60 * 60 * 1000,
      cropInfo: cropType
    };
  }

  createWheatPlant(group, growthProgress, cropType) {
    const height = cropType.height * (0.2 + growthProgress * 0.8);
    
    // Create multiple wheat stalks
    for (let i = 0; i < 5 + Math.floor(growthProgress * 8); i++) {
      const stalkGeometry = new THREE.CylinderGeometry(0.02, 0.03, height, 6);
      const stalkMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
      
      stalk.position.set(
        (Math.random() - 0.5) * 0.4,
        height / 2,
        (Math.random() - 0.5) * 0.4
      );
      stalk.castShadow = true;
      group.add(stalk);

      // Add wheat head if mature enough
      if (growthProgress > 0.6) {
        const headGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: cropType.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(stalk.position.x, height + 0.1, stalk.position.z);
        head.scale.y = 1.5;
        head.castShadow = true;
        group.add(head);
      }
    }
  }

  createCornPlant(group, growthProgress, cropType) {
    const height = cropType.height * (0.3 + growthProgress * 0.7);
    
    // Main stalk
    const stalkGeometry = new THREE.CylinderGeometry(0.08, 0.12, height, 8);
    const stalkMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
    stalk.position.y = height / 2;
    stalk.castShadow = true;
    group.add(stalk);

    // Corn leaves
    for (let i = 0; i < 6 + Math.floor(growthProgress * 4); i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.3, height * 0.8);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x32CD32,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = height * 0.6;
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.rotation.z = Math.PI * 0.1;
      leaf.castShadow = true;
      group.add(leaf);
    }

    // Corn ears if mature
    if (growthProgress > 0.7) {
      for (let i = 0; i < 1 + Math.floor(growthProgress * 2); i++) {
        const earGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 12);
        const earMaterial = new THREE.MeshLambertMaterial({ color: cropType.color });
        const ear = new THREE.Mesh(earGeometry, earMaterial);
        ear.position.set(
          Math.sin(i * Math.PI) * 0.15,
          height * 0.7,
          Math.cos(i * Math.PI) * 0.15
        );
        ear.rotation.z = Math.PI * 0.1;
        ear.castShadow = true;
        group.add(ear);
      }
    }
  }

  createTomatoPlant(group, growthProgress, cropType) {
    const height = cropType.height * (0.2 + growthProgress * 0.8);
    
    // Main vine
    const vineGeometry = new THREE.CylinderGeometry(0.03, 0.05, height, 6);
    const vineMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const vine = new THREE.Mesh(vineGeometry, vineMaterial);
    vine.position.y = height / 2;
    vine.castShadow = true;
    group.add(vine);

    // Tomato leaves
    for (let i = 0; i < 8 + Math.floor(growthProgress * 6); i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.2, 0.15);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(
        Math.sin(i * 0.8) * 0.3,
        (i / 8) * height * 0.8 + 0.2,
        Math.cos(i * 0.8) * 0.3
      );
      leaf.rotation.y = i * 0.8;
      leaf.castShadow = true;
      group.add(leaf);
    }

    // Tomatoes if mature
    if (growthProgress > 0.5) {
      const tomatoCount = Math.floor(growthProgress * 5);
      for (let i = 0; i < tomatoCount; i++) {
        const tomatoGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const tomatoMaterial = new THREE.MeshLambertMaterial({ color: cropType.color });
        const tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
        tomato.position.set(
          Math.sin(i * 1.2) * 0.25,
          height * 0.4 + (i * 0.15),
          Math.cos(i * 1.2) * 0.25
        );
        tomato.castShadow = true;
        group.add(tomato);
      }
    }
  }

  createCarrotPlant(group, growthProgress, cropType) {
    // Carrot tops (leaves)
    for (let i = 0; i < 6 + Math.floor(growthProgress * 4); i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.15, 0.4);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.set(
        Math.sin(i * 1.0) * 0.2,
        0.2 + growthProgress * 0.3,
        Math.cos(i * 1.0) * 0.2
      );
      leaf.rotation.y = i * 1.0;
      leaf.rotation.z = Math.PI * 0.1;
      leaf.castShadow = true;
      group.add(leaf);
    }

    // Carrot root (partially visible if mature)
    if (growthProgress > 0.6) {
      const rootGeometry = new THREE.ConeGeometry(0.04, 0.3, 8);
      const rootMaterial = new THREE.MeshLambertMaterial({ color: cropType.color });
      const root = new THREE.Mesh(rootGeometry, rootMaterial);
      root.position.y = -0.1;
      root.castShadow = true;
      group.add(root);
    }
  }

  createLettucePlant(group, growthProgress, cropType) {
    const leafCount = 8 + Math.floor(growthProgress * 12);
    
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.25, 0.2);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: cropType.color,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const radius = 0.1 + (i / leafCount) * 0.3;
      leaf.position.set(
        Math.sin(i * 0.6) * radius,
        0.1 + (i / leafCount) * 0.2,
        Math.cos(i * 0.6) * radius
      );
      leaf.rotation.y = i * 0.6;
      leaf.rotation.x = -Math.PI * 0.2;
      leaf.castShadow = true;
      group.add(leaf);
    }
  }

  createSoilMound(x, z) {
    const moundGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.2, 12);
    const moundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.position.set(x, -0.05, z);
    mound.receiveShadow = true;
    this.scene.add(mound);
  }

  update(deltaTime) {
    // Realistic plant animations
    const time = Date.now() * 0.001;
    
    this.crops.forEach(crop => {
      const windStrength = 0.01;
      const windSpeed = 1.5;
      const offset = crop.animationOffset;
      
      crop.mesh.rotation.z = Math.sin(time * windSpeed + offset) * windStrength;
      crop.mesh.rotation.x = Math.cos(time * windSpeed * 0.7 + offset) * windStrength * 0.5;

      // Simulate natural growth and decay
      this.simulateNaturalProcesses(crop, deltaTime);
    });
  }

  simulateNaturalProcesses(crop, deltaTime) {
    const currentTime = Date.now();
    const timeSinceWatered = currentTime - crop.lastWatered;
    const hoursWithoutWater = timeSinceWatered / (1000 * 60 * 60);

    // Water evaporation
    if (hoursWithoutWater > 1) {
      crop.soilMoisture = Math.max(0, crop.soilMoisture - deltaTime * 0.5);
      crop.waterLevel = Math.max(0, crop.waterLevel - deltaTime * 0.3);
    }

    // Health degradation without water
    if (crop.waterLevel < 20) {
      crop.health = Math.max(0, crop.health - deltaTime * 0.2);
    }

    // Disease progression
    if (crop.health < 50 || crop.soilMoisture > 80) {
      crop.diseaseLevel = Math.min(100, crop.diseaseLevel + deltaTime * 0.1);
    }

    // Nutrient depletion
    crop.nutrientLevel = Math.max(0, crop.nutrientLevel - deltaTime * 0.05);
  }

  handleCropAction(action, crop) {
    if (!crop) return;

    switch (action) {
      case 'harvest':
        this.harvestCrop(crop);
        break;
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
        this.inspectCrop(crop);
        break;
    }
  }

  harvestCrop(crop) {
    if (crop.growth >= 80 && crop.health > 30) {
      console.log(`Successfully harvested ${crop.type}!`);
      console.log(`Yield: ${crop.cropInfo.harvestYield}`);
      console.log(`Quality: ${this.getQualityRating(crop)}`);
      
      // Remove crop and create new seedling
      this.scene.remove(crop.mesh);
      const index = this.crops.indexOf(crop);
      if (index > -1) {
        this.crops.splice(index, 1);
        
        // Plant new seedling after delay
        setTimeout(() => {
          const newCrop = this.createRealisticCrop(crop.cropInfo, crop.position.x, crop.position.z);
          newCrop.currentStage = 0;
          newCrop.growth = 5;
          newCrop.plantedDate = Date.now();
          this.crops.push(newCrop);
        }, 3000);
      }
    } else if (crop.growth < 80) {
      console.log(`${crop.type} is not ready for harvest yet! Growth: ${Math.floor(crop.growth)}%`);
    } else {
      console.log(`${crop.type} is too unhealthy to harvest! Health: ${Math.floor(crop.health)}%`);
    }
  }

  waterCrop(crop) {
    const waterAmount = 25 + Math.random() * 15;
    crop.waterLevel = Math.min(100, crop.waterLevel + waterAmount);
    crop.soilMoisture = Math.min(100, crop.soilMoisture + waterAmount * 1.2);
    crop.lastWatered = Date.now();
    
    // Growth boost from watering
    if (crop.soilMoisture > 40 && crop.soilMoisture < 80) {
      crop.growth = Math.min(100, crop.growth + 8);
    }
    
    // Health improvement
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
    
    // Visual feedback - restore plant color
    crop.mesh.children.forEach(child => {
      if (child.material && child.material.color) {
        child.material.color.multiplyScalar(1.1);
      }
    });
    
    console.log(`Applied treatment to ${crop.type}!`);
    console.log(`Health improved to: ${Math.floor(crop.health)}%`);
    console.log(`Disease level reduced to: ${Math.floor(crop.diseaseLevel)}%`);
  }

  fertilizeCrop(crop) {
    crop.nutrientLevel = Math.min(100, crop.nutrientLevel + 40);
    crop.growth = Math.min(100, crop.growth + 12);
    
    console.log(`Fertilized ${crop.type}!`);
    console.log(`Nutrient level: ${Math.floor(crop.nutrientLevel)}%`);
    console.log(`Growth boosted to: ${Math.floor(crop.growth)}%`);
  }

  inspectCrop(crop) {
    const daysSincePlanted = (Date.now() - crop.plantedDate) / (1000 * 60 * 60 * 24);
    const daysToMaturity = crop.cropInfo.growthTime - daysSincePlanted;
    
    console.log(`=== ${crop.type.toUpperCase()} INSPECTION ===`);
    console.log(`Growth Stage: ${crop.currentStage + 1}/${crop.maxStages}`);
    console.log(`Growth Progress: ${Math.floor(crop.growth)}%`);
    console.log(`Health: ${Math.floor(crop.health)}%`);
    console.log(`Water Level: ${Math.floor(crop.waterLevel)}%`);
    console.log(`Soil Moisture: ${Math.floor(crop.soilMoisture)}%`);
    console.log(`Nutrient Level: ${Math.floor(crop.nutrientLevel)}%`);
    console.log(`Disease Level: ${Math.floor(crop.diseaseLevel)}%`);
    console.log(`Days since planted: ${Math.floor(daysSincePlanted)}`);
    console.log(`Days to maturity: ${Math.max(0, Math.floor(daysToMaturity))}`);
    console.log(`Expected yield: ${crop.cropInfo.harvestYield}`);
    console.log(`Quality rating: ${this.getQualityRating(crop)}`);
  }

  getQualityRating(crop) {
    const avgCondition = (crop.health + crop.waterLevel + crop.nutrientLevel + (100 - crop.diseaseLevel)) / 4;
    
    if (avgCondition >= 90) return "Excellent";
    if (avgCondition >= 75) return "Good";
    if (avgCondition >= 60) return "Fair";
    if (avgCondition >= 40) return "Poor";
    return "Very Poor";
  }
}
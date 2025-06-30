import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.createFarmTerrain();
    this.createNormalSky();
    this.addEnvironmentalDetails();
  }

  createFarmTerrain() {
    // Create flat farmland terrain
    const farmSize = 60;
    
    // Main grass terrain
    const grassGeometry = new THREE.PlaneGeometry(farmSize * 2, farmSize * 2);
    const grassMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7CB342 // Natural grass green
    });
    
    const grassland = new THREE.Mesh(grassGeometry, grassMaterial);
    grassland.rotation.x = -Math.PI / 2;
    grassland.receiveShadow = true;
    this.scene.add(grassland);

    // Create dirt patches for farming
    this.createFarmingPlots();
    
    // Add farm structures
    this.createFarmStructures();
  }

  createFarmingPlots() {
    // Create tilled soil plots for farming
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 12; col++) {
        const x = (col - 6) * 3;
        const z = (row - 4) * 4;
        
        // Tilled soil block
        const soilGeometry = new THREE.BoxGeometry(2.8, 0.2, 2.8);
        const soilMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x8D6E63 // Natural dirt brown
        });
        const soil = new THREE.Mesh(soilGeometry, soilMaterial);
        
        soil.position.set(x, 0.1, z);
        soil.receiveShadow = true;
        soil.castShadow = true;
        this.scene.add(soil);

        // Water channels between plots
        if (col % 4 === 3) {
          const waterGeometry = new THREE.PlaneGeometry(0.5, 2.8);
          const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2196F3,
            transparent: true,
            opacity: 0.8
          });
          const water = new THREE.Mesh(waterGeometry, waterMaterial);
          water.rotation.x = -Math.PI / 2;
          water.position.set(x + 1.5, 0.05, z);
          this.scene.add(water);
        }
      }
    }
  }

  createFarmStructures() {
    // Simple farmhouse
    this.createFarmhouse();
    
    // Fence around farm
    this.createFarmFence();
    
    // Well
    this.createFarmWell();
    
    // Storage chest
    this.createStorageChest();
  }

  createFarmhouse() {
    const houseGroup = new THREE.Group();
    
    // House walls (stone texture)
    const wallGeometry = new THREE.BoxGeometry(8, 4, 8);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x757575 });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);
    
    // Roof (red farmhouse style)
    const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xD32F2F });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(1.5, 3, 0.2);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, 4.1);
    door.castShadow = true;
    houseGroup.add(door);
    
    // Windows
    for (let i = 0; i < 2; i++) {
      const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
      const windowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x81D4FA,
        transparent: true,
        opacity: 0.7
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(i === 0 ? -2.5 : 2.5, 2.5, 4.05);
      houseGroup.add(window);
    }
    
    houseGroup.position.set(-25, 0, -20);
    this.scene.add(houseGroup);
  }

  createFarmFence() {
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    
    // Create fence posts around the farm area
    const fencePositions = [
      // Top row
      ...Array.from({length: 21}, (_, i) => [-30 + i * 3, 0.5, -20]),
      // Bottom row
      ...Array.from({length: 21}, (_, i) => [-30 + i * 3, 0.5, 20]),
      // Left column
      ...Array.from({length: 13}, (_, i) => [-30, 0.5, -17 + i * 3]),
      // Right column
      ...Array.from({length: 13}, (_, i) => [30, 0.5, -17 + i * 3])
    ];
    
    fencePositions.forEach(([x, y, z]) => {
      const postGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(x, y, z);
      post.castShadow = true;
      this.scene.add(post);
      
      // Fence rail
      const railGeometry = new THREE.BoxGeometry(2.5, 0.2, 0.2);
      const rail = new THREE.Mesh(railGeometry, fenceMaterial);
      rail.position.set(x, y + 0.3, z);
      rail.castShadow = true;
      this.scene.add(rail);
    });
  }

  createFarmWell() {
    const wellGroup = new THREE.Group();
    
    // Well base (stone)
    const wellGeometry = new THREE.CylinderGeometry(1.5, 1.8, 2, 8);
    const wellMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
    const well = new THREE.Mesh(wellGeometry, wellMaterial);
    well.position.y = 1;
    well.castShadow = true;
    well.receiveShadow = true;
    wellGroup.add(well);
    
    // Water inside
    const waterGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 8);
    const waterMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2196F3,
      transparent: true,
      opacity: 0.8
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = 1.9;
    wellGroup.add(water);
    
    // Roof support posts
    for (let i = 0; i < 4; i++) {
      const postGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
      const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(
        Math.sin(i * Math.PI / 2) * 1.8,
        3.25,
        Math.cos(i * Math.PI / 2) * 1.8
      );
      post.castShadow = true;
      wellGroup.add(post);
    }
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 8);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xD32F2F });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5;
    roof.castShadow = true;
    wellGroup.add(roof);
    
    wellGroup.position.set(20, 0, 15);
    this.scene.add(wellGroup);
  }

  createStorageChest() {
    // Farm-style storage chest
    const chestGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
    const chestMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    
    chest.position.set(-20, 0.75, 15);
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.scene.add(chest);
    
    // Chest lid
    const lidGeometry = new THREE.BoxGeometry(2.1, 0.3, 1.6);
    const lid = new THREE.Mesh(lidGeometry, chestMaterial);
    lid.position.set(-20, 1.65, 15);
    lid.castShadow = true;
    this.scene.add(lid);
  }

  createNormalSky() {
    // Create natural blue sky for the farm
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    
    // Create sky gradient
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');   // Sky blue
    gradient.addColorStop(0.5, '#98D8E8'); // Light blue
    gradient.addColorStop(1, '#E0F6FF');   // Very light blue
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    // Add fluffy white clouds
    this.createNaturalClouds();
  }

  createNaturalClouds() {
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.9 
    });

    // Create natural fluffy clouds
    for (let i = 0; i < 15; i++) {
      const cloudGroup = new THREE.Group();
      
      // Create cloud made of cubes
      const numCubes = 8 + Math.floor(Math.random() * 12);
      for (let j = 0; j < numCubes; j++) {
        const cubeSize = 3 + Math.random() * 4;
        const cloudGeometry = new THREE.BoxGeometry(cubeSize, cubeSize * 0.6, cubeSize);
        const cube = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        cube.position.set(
          (Math.random() - 0.5) * 25,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 25
        );
        
        cloudGroup.add(cube);
      }
      
      cloudGroup.position.set(
        (Math.random() - 0.5) * 800,
        80 + Math.random() * 40,
        (Math.random() - 0.5) * 800
      );
      
      this.scene.add(cloudGroup);
    }
  }

  addEnvironmentalDetails() {
    // Add scattered stone blocks
    for (let i = 0; i < 20; i++) {
      const stoneGeometry = new THREE.BoxGeometry(
        0.5 + Math.random() * 0.5,
        0.3 + Math.random() * 0.3,
        0.5 + Math.random() * 0.5
      );
      const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      
      stone.position.set(
        (Math.random() - 0.5) * 100,
        0.2,
        (Math.random() - 0.5) * 100
      );
      stone.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
    }

    // Add grass patches
    for (let i = 0; i < 40; i++) {
      const grassGroup = new THREE.Group();
      
      for (let j = 0; j < 3 + Math.random() * 5; j++) {
        const grassGeometry = new THREE.PlaneGeometry(0.2, 0.8 + Math.random() * 0.4);
        const grassMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x4CAF50,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        
        grass.position.set(
          (Math.random() - 0.5) * 1.5,
          0.4,
          (Math.random() - 0.5) * 1.5
        );
        grass.rotation.y = Math.random() * Math.PI * 2;
        grass.rotation.z = (Math.random() - 0.5) * 0.3;
        grassGroup.add(grass);
      }
      
      grassGroup.position.set(
        (Math.random() - 0.5) * 120,
        0,
        (Math.random() - 0.5) * 120
      );
      this.scene.add(grassGroup);
    }

    // Add some flowers
    for (let i = 0; i < 15; i++) {
      const flowerGeometry = new THREE.PlaneGeometry(0.3, 0.3);
      const flowerColors = [0xFF5722, 0xE91E63, 0x9C27B0, 0xFFEB3B];
      const flowerMaterial = new THREE.MeshLambertMaterial({ 
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        side: THREE.DoubleSide
      });
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      
      flower.position.set(
        (Math.random() - 0.5) * 80,
        0.3,
        (Math.random() - 0.5) * 80
      );
      flower.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(flower);
    }
  }
}
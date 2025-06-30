import * as THREE from 'three';

export class EnhancedRootSystem {
  constructor(scene) {
    this.scene = scene;
    this.rootSystems = [];
    this.rootViewActive = false;
    this.soilLayers = [];
    
    this.createSoilLayers();
  }

  createSoilLayers() {
    // Create realistic soil cross-section
    const soilGeometry = new THREE.PlaneGeometry(200, 50);
    
    // Top soil layer
    const topSoilMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B4513,
      transparent: true,
      opacity: 0.8
    });
    const topSoil = new THREE.Mesh(soilGeometry, topSoilMaterial);
    topSoil.rotation.x = -Math.PI / 2;
    topSoil.position.set(0, -5, 0);
    topSoil.visible = false;
    this.scene.add(topSoil);
    this.soilLayers.push(topSoil);

    // Sub soil layer
    const subSoilMaterial = new THREE.MeshLambertMaterial({
      color: 0x654321,
      transparent: true,
      opacity: 0.7
    });
    const subSoil = new THREE.Mesh(soilGeometry, subSoilMaterial);
    subSoil.rotation.x = -Math.PI / 2;
    subSoil.position.set(0, -15, 0);
    subSoil.visible = false;
    this.scene.add(subSoil);
    this.soilLayers.push(subSoil);

    // Bedrock layer
    const bedrockMaterial = new THREE.MeshLambertMaterial({
      color: 0x2F4F4F,
      transparent: true,
      opacity: 0.6
    });
    const bedrock = new THREE.Mesh(soilGeometry, bedrockMaterial);
    bedrock.rotation.x = -Math.PI / 2;
    bedrock.position.set(0, -25, 0);
    bedrock.visible = false;
    this.scene.add(bedrock);
    this.soilLayers.push(bedrock);
  }

  createAdvancedRootSystem(cropType, growthProgress, position) {
    const rootGroup = new THREE.Group();
    const rootDepth = cropType.rootDepth * growthProgress;
    
    // Create main taproot with realistic branching
    this.createTaproot(rootGroup, rootDepth, cropType);
    
    // Create lateral root network
    this.createLateralRoots(rootGroup, rootDepth, cropType, growthProgress);
    
    // Create fine root hairs for nutrient absorption
    this.createRootHairs(rootGroup, rootDepth, growthProgress);
    
    // Add mycorrhizal network visualization
    this.createMycorrhizalNetwork(rootGroup, position, growthProgress);
    
    rootGroup.position.copy(position);
    rootGroup.position.y = 0;
    rootGroup.visible = this.rootViewActive;
    
    this.scene.add(rootGroup);
    this.rootSystems.push(rootGroup);
    
    return rootGroup;
  }

  createTaproot(rootGroup, depth, cropType) {
    // Main taproot with realistic tapering
    const segments = 20;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, -depth * 0.3, 0),
      new THREE.Vector3(-0.05, -depth * 0.6, 0),
      new THREE.Vector3(0, -depth, 0)
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.03, 8, false);
    const rootMaterial = new THREE.MeshLambertMaterial({
      color: 0xD2B48C,
      transparent: true,
      opacity: 0.9
    });
    
    const taproot = new THREE.Mesh(tubeGeometry, rootMaterial);
    taproot.castShadow = true;
    rootGroup.add(taproot);
  }

  createLateralRoots(rootGroup, depth, cropType, growthProgress) {
    const lateralCount = Math.floor(8 + growthProgress * 12);
    
    for (let i = 0; i < lateralCount; i++) {
      const angle = (i / lateralCount) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.8;
      const lateralDepth = depth * (0.3 + Math.random() * 0.4);
      
      // Create curved lateral root
      const startY = -depth * (0.2 + Math.random() * 0.6);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, startY, 0),
        new THREE.Vector3(
          Math.sin(angle) * radius * 0.5,
          startY - lateralDepth * 0.3,
          Math.cos(angle) * radius * 0.5
        ),
        new THREE.Vector3(
          Math.sin(angle) * radius,
          startY - lateralDepth,
          Math.cos(angle) * radius
        )
      ]);

      const tubeGeometry = new THREE.TubeGeometry(curve, 10, 0.015, 6, false);
      const lateralMaterial = new THREE.MeshLambertMaterial({
        color: 0xDEB887,
        transparent: true,
        opacity: 0.8
      });
      
      const lateral = new THREE.Mesh(tubeGeometry, lateralMaterial);
      lateral.castShadow = true;
      rootGroup.add(lateral);

      // Add secondary branches
      this.createSecondaryBranches(rootGroup, curve.getPointAt(1), angle, lateralDepth * 0.5);
    }
  }

  createSecondaryBranches(rootGroup, startPoint, baseAngle, maxLength) {
    const branchCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < branchCount; i++) {
      const branchAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
      const branchLength = maxLength * (0.3 + Math.random() * 0.4);
      
      const endPoint = new THREE.Vector3(
        startPoint.x + Math.sin(branchAngle) * branchLength,
        startPoint.y - branchLength * 0.5,
        startPoint.z + Math.cos(branchAngle) * branchLength
      );

      const curve = new THREE.CatmullRomCurve3([startPoint, endPoint]);
      const tubeGeometry = new THREE.TubeGeometry(curve, 5, 0.008, 4, false);
      const branchMaterial = new THREE.MeshLambertMaterial({
        color: 0xF5DEB3,
        transparent: true,
        opacity: 0.7
      });
      
      const branch = new THREE.Mesh(tubeGeometry, branchMaterial);
      rootGroup.add(branch);
    }
  }

  createRootHairs(rootGroup, depth, growthProgress) {
    const hairCount = Math.floor(50 + growthProgress * 100);
    
    for (let i = 0; i < hairCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      const hairDepth = depth * (0.1 + Math.random() * 0.8);
      
      const hairGeometry = new THREE.CylinderGeometry(0.001, 0.002, 0.05, 3);
      const hairMaterial = new THREE.MeshLambertMaterial({
        color: 0xFFFACD,
        transparent: true,
        opacity: 0.6
      });
      
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.set(
        Math.sin(angle) * radius,
        -hairDepth,
        Math.cos(angle) * radius
      );
      hair.rotation.set(
        (Math.random() - 0.5) * Math.PI * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI * 0.3
      );
      
      rootGroup.add(hair);
    }
  }

  createMycorrhizalNetwork(rootGroup, position, growthProgress) {
    // Create fungal network connections between nearby plants
    const networkMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      linewidth: 1
    });

    // Create some network connections
    for (let i = 0; i < 3; i++) {
      const connectionGeometry = new THREE.BufferGeometry();
      const points = [];
      
      // Create wavy connection line
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        const x = (Math.random() - 0.5) * 10 * t;
        const y = -1 - Math.random() * 2;
        const z = (Math.random() - 0.5) * 10 * t;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      connectionGeometry.setFromPoints(points);
      const connection = new THREE.Line(connectionGeometry, networkMaterial);
      rootGroup.add(connection);
    }
  }

  toggleRootView() {
    this.rootViewActive = !this.rootViewActive;
    
    // Toggle root systems visibility
    this.rootSystems.forEach(rootSystem => {
      rootSystem.visible = this.rootViewActive;
    });

    // Toggle soil layers visibility
    this.soilLayers.forEach(layer => {
      layer.visible = this.rootViewActive;
    });

    // Apply visual filter to scene
    if (this.rootViewActive) {
      document.body.classList.add('root-view-active');
      
      // Add x-ray effect to the scene
      this.scene.traverse((object) => {
        if (object.isMesh && !this.isRootOrSoil(object)) {
          if (object.material) {
            object.userData.originalOpacity = object.material.opacity || 1;
            object.material.transparent = true;
            object.material.opacity = 0.3;
          }
        }
      });
    } else {
      document.body.classList.remove('root-view-active');
      
      // Restore original materials
      this.scene.traverse((object) => {
        if (object.isMesh && object.userData.originalOpacity !== undefined) {
          object.material.opacity = object.userData.originalOpacity;
          if (object.userData.originalOpacity === 1) {
            object.material.transparent = false;
          }
          delete object.userData.originalOpacity;
        }
      });
    }

    return this.rootViewActive;
  }

  isRootOrSoil(object) {
    // Check if object is part of root system or soil
    return this.rootSystems.some(rootSystem => 
      rootSystem === object || rootSystem.children.includes(object)
    ) || this.soilLayers.includes(object);
  }

  update(deltaTime) {
    if (this.rootViewActive) {
      // Animate mycorrhizal networks
      const time = Date.now() * 0.001;
      
      this.rootSystems.forEach(rootSystem => {
        rootSystem.children.forEach(child => {
          if (child.isLine) {
            child.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
          }
        });
      });
    }
  }

  dispose() {
    // Clean up root systems
    this.rootSystems.forEach(rootSystem => {
      this.scene.remove(rootSystem);
      rootSystem.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });

    // Clean up soil layers
    this.soilLayers.forEach(layer => {
      this.scene.remove(layer);
      if (layer.geometry) layer.geometry.dispose();
      if (layer.material) layer.material.dispose();
    });

    this.rootSystems = [];
    this.soilLayers = [];
  }
}
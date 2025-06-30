import * as THREE from 'three';

export class HarvestAnimator {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.isAnimating = false;
    this.animationDuration = 3000; // 3 seconds
    this.animationStartTime = 0;
    this.targetCrop = null;
    this.onComplete = null;
    
    // Animation states
    this.phases = {
      APPROACH: 0,
      HARVEST: 1,
      COLLECT: 2,
      RETURN: 3
    };
    this.currentPhase = this.phases.APPROACH;
    
    // Store original player position
    this.originalPosition = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.harvestPosition = new THREE.Vector3();
  }

  startHarvestAnimation(crop, onComplete) {
    if (this.isAnimating) return false;
    
    this.isAnimating = true;
    this.targetCrop = crop;
    this.onComplete = onComplete;
    this.animationStartTime = Date.now();
    this.currentPhase = this.phases.APPROACH;
    
    // Store original position
    this.originalPosition.copy(this.player.position);
    
    // Calculate harvest position (close to crop)
    this.harvestPosition.copy(crop.position);
    this.harvestPosition.y = this.player.groundLevel;
    
    // Move player slightly closer to crop
    const direction = new THREE.Vector3()
      .subVectors(this.harvestPosition, this.originalPosition)
      .normalize();
    this.targetPosition.copy(this.harvestPosition)
      .add(direction.multiplyScalar(-2)); // 2 units away from crop
    
    console.log(`Starting harvest animation for ${crop.type}`);
    return true;
  }

  update(deltaTime) {
    if (!this.isAnimating) return;
    
    const elapsed = Date.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    
    switch (this.currentPhase) {
      case this.phases.APPROACH:
        this.updateApproachPhase(progress);
        if (progress > 0.3) {
          this.currentPhase = this.phases.HARVEST;
        }
        break;
        
      case this.phases.HARVEST:
        this.updateHarvestPhase(progress);
        if (progress > 0.7) {
          this.currentPhase = this.phases.COLLECT;
        }
        break;
        
      case this.phases.COLLECT:
        this.updateCollectPhase(progress);
        if (progress > 0.9) {
          this.currentPhase = this.phases.RETURN;
        }
        break;
        
      case this.phases.RETURN:
        this.updateReturnPhase(progress);
        break;
    }
    
    if (progress >= 1) {
      this.completeAnimation();
    }
  }

  updateApproachPhase(progress) {
    // Move player towards crop
    const t = this.easeInOutCubic(Math.min(progress / 0.3, 1));
    this.player.position.lerpVectors(this.originalPosition, this.targetPosition, t);
    
    // Face the crop
    const direction = new THREE.Vector3()
      .subVectors(this.harvestPosition, this.player.position)
      .normalize();
    this.player.yaw = Math.atan2(direction.x, direction.z);
  }

  updateHarvestPhase(progress) {
    // Harvesting animation - player bends down and reaches for crop
    const harvestProgress = (progress - 0.3) / 0.4; // 0.3 to 0.7
    const bendAmount = Math.sin(harvestProgress * Math.PI) * 0.3;
    
    // Lower player slightly to simulate bending
    this.player.position.y = this.player.groundLevel - bendAmount;
    
    // Add hand reaching animation (simulate with slight forward movement)
    const reachAmount = Math.sin(harvestProgress * Math.PI * 2) * 0.1;
    const reachDirection = new THREE.Vector3()
      .subVectors(this.harvestPosition, this.player.position)
      .normalize()
      .multiplyScalar(reachAmount);
    
    this.player.position.add(reachDirection);
    
    // Create harvest particles
    if (Math.random() < 0.3) {
      this.createHarvestParticles();
    }
  }

  updateCollectPhase(progress) {
    // Collection phase - player stands up
    const collectProgress = (progress - 0.7) / 0.2; // 0.7 to 0.9
    const standAmount = this.easeOutCubic(collectProgress) * 0.3;
    
    this.player.position.y = this.player.groundLevel - 0.3 + standAmount;
    
    // Create collection effect
    if (collectProgress > 0.5 && this.targetCrop) {
      this.createCollectionEffect();
    }
  }

  updateReturnPhase(progress) {
    // Return to normal stance
    this.player.position.y = this.player.groundLevel;
    
    // Small celebration animation
    const returnProgress = (progress - 0.9) / 0.1; // 0.9 to 1.0
    const celebrationBob = Math.sin(returnProgress * Math.PI * 4) * 0.05;
    this.player.position.y += celebrationBob;
  }

  createHarvestParticles() {
    if (!this.targetCrop) return;
    
    // Create leaf and debris particles
    for (let i = 0; i < 3; i++) {
      const particleGeometry = new THREE.PlaneGeometry(0.05, 0.05);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x228B22,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      particle.position.copy(this.targetCrop.position);
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
      
      this.scene.add(particle);
      
      // Animate particle
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );
      
      const animateParticle = () => {
        particle.position.add(velocity.clone().multiplyScalar(0.016));
        velocity.y -= 9.8 * 0.016; // gravity
        particle.material.opacity -= 0.02;
        
        if (particle.material.opacity > 0) {
          requestAnimationFrame(animateParticle);
        } else {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
      
      animateParticle();
    }
  }

  createCollectionEffect() {
    if (!this.targetCrop) return;
    
    // Create golden collection particles
    for (let i = 0; i < 8; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      particle.position.copy(this.targetCrop.position);
      particle.position.y += 0.5;
      
      this.scene.add(particle);
      
      // Animate towards player
      const targetPos = this.player.position.clone();
      targetPos.y += 1;
      
      const startPos = particle.position.clone();
      let animationProgress = 0;
      
      const animateCollection = () => {
        animationProgress += 0.05;
        const t = this.easeInCubic(animationProgress);
        
        particle.position.lerpVectors(startPos, targetPos, t);
        particle.scale.setScalar(1 - t * 0.5);
        
        if (animationProgress < 1) {
          requestAnimationFrame(animateCollection);
        } else {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
      
      setTimeout(() => animateCollection(), i * 50);
    }
  }

  completeAnimation() {
    this.isAnimating = false;
    this.player.position.y = this.player.groundLevel;
    
    if (this.onComplete) {
      this.onComplete();
    }
    
    console.log('Harvest animation completed');
  }

  // Easing functions
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInCubic(t) {
    return t * t * t;
  }

  isHarvesting() {
    return this.isAnimating;
  }

  stopAnimation() {
    if (this.isAnimating) {
      this.isAnimating = false;
      this.player.position.y = this.player.groundLevel;
    }
  }
}
import * as THREE from 'three';

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particlePool = [];
    
    this.createParticlePool();
  }

  createParticlePool() {
    // Create a pool of reusable particles
    for (let i = 0; i < 100; i++) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x8B4513,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.visible = false;
      this.scene.add(particle);
      this.particlePool.push({
        mesh: particle,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1
      });
    }
  }

  getParticle() {
    return this.particlePool.find(p => !p.mesh.visible);
  }

  createWalkingParticles(position) {
    for (let i = 0; i < 2; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      particle.mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.8,
        position.y - 0.8,
        position.z + (Math.random() - 0.5) * 0.8
      );
      
      particle.velocity.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );
      
      particle.life = 0;
      particle.maxLife = 0.5 + Math.random() * 0.5;
      particle.mesh.visible = true;
      particle.mesh.material.color.setHex(0x8B4513 + Math.floor(Math.random() * 0x222222));
      
      this.particles.push(particle);
    }
  }

  createActionParticles(position, action) {
    const colors = {
      harvest: 0xFFD700,
      water: 0x4169E1,
      fix: 0x32CD32
    };
    
    const color = colors[action] || 0xFFFFFF;
    
    for (let i = 0; i < 8; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      particle.mesh.position.set(
        position.x + (Math.random() - 0.5) * 2,
        position.y + 1 + Math.random(),
        position.z + (Math.random() - 0.5) * 2
      );
      
      particle.velocity.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 4
      );
      
      particle.life = 0;
      particle.maxLife = 1 + Math.random();
      particle.mesh.visible = true;
      particle.mesh.material.color.setHex(color);
      
      this.particles.push(particle);
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      
      // Apply gravity
      particle.velocity.y -= 9.8 * deltaTime;
      
      // Update life
      particle.life += deltaTime;
      
      // Fade out
      const alpha = 1 - (particle.life / particle.maxLife);
      particle.mesh.material.opacity = alpha * 0.8;
      
      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        particle.mesh.visible = false;
        this.particles.splice(i, 1);
      }
    }
  }
}
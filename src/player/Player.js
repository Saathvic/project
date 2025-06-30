import * as THREE from 'three';
import { CameraManager } from './CameraManager.js';
import { HarvestAnimator } from './HarvestAnimator.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.position = new THREE.Vector3(0, 2, 5);
    this.velocity = new THREE.Vector3();
    this.speed = 8.0;
    this.jumpPower = 12.0;
    this.gravity = -25.0;
    this.friction = 0.85;
    this.acceleration = 20.0;
    
    this.isGrounded = false;
    this.isMoving = false;
    this.groundLevel = 0.9;
    
    // Camera controls
    this.pitch = 0;
    this.yaw = 0;
    this.mouseSensitivity = 0.003;
    
    // Camera and animation managers
    this.cameraManager = new CameraManager(camera, this);
    this.harvestAnimator = new HarvestAnimator(scene, camera, this);
    
    this.setupCamera();
    this.createPlayerModel();
  }

  setupCamera() {
    this.camera.position.copy(this.position);
    this.camera.position.y += 1.6;
    this.camera.rotation.order = 'YXZ';
  }

  createPlayerModel() {
    const playerGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    const playerMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4169E1,
      transparent: true,
      opacity: 0
    });
    this.playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    this.playerMesh.position.copy(this.position);
    this.playerMesh.castShadow = true;
    this.scene.add(this.playerMesh);
  }

  update(inputManager, deltaTime) {
    // Limit deltaTime to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.016);
    
    // Don't allow movement during harvest animation
    if (!this.harvestAnimator.isHarvesting()) {
      this.handleMouseLook(inputManager);
      this.handleMovement(inputManager, deltaTime);
      this.handleJumping(inputManager);
      this.applyPhysics(deltaTime);
    }
    
    // Update camera and animations
    this.cameraManager.update(deltaTime);
    this.harvestAnimator.update(deltaTime);
    
    this.updateCamera();
  }

  handleMouseLook(inputManager) {
    if (inputManager.isPointerLocked() && !this.harvestAnimator.isHarvesting()) {
      const mouseDelta = inputManager.getMouseDelta();
      
      // Apply mouse movement
      this.yaw -= mouseDelta.x * this.mouseSensitivity;
      this.pitch -= mouseDelta.y * this.mouseSensitivity;
      
      // Clamp pitch to prevent over-rotation
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    }
  }

  handleMovement(inputManager, deltaTime) {
    const movement = inputManager.getMovementVector();
    this.isMoving = Math.abs(movement.x) > 0 || Math.abs(movement.z) > 0;
    
    if (this.isMoving) {
      // Create movement direction based on camera rotation
      const forward = new THREE.Vector3(0, 0, -1);
      const right = new THREE.Vector3(1, 0, 0);
      
      // Apply only Y rotation (yaw) for ground movement
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      
      const moveDirection = new THREE.Vector3();
      // Fixed: Changed from movement.z to -movement.z to fix inverted forward/backward
      moveDirection.addScaledVector(forward, -movement.z);
      moveDirection.addScaledVector(right, movement.x);
      moveDirection.normalize();
      
      // Apply movement with smooth acceleration
      const targetVelocity = moveDirection.multiplyScalar(this.speed);
      this.velocity.x += (targetVelocity.x - this.velocity.x) * this.acceleration * deltaTime;
      this.velocity.z += (targetVelocity.z - this.velocity.z) * this.acceleration * deltaTime;
    } else {
      // Apply friction when not moving
      this.velocity.x *= Math.pow(this.friction, deltaTime * 60);
      this.velocity.z *= Math.pow(this.friction, deltaTime * 60);
    }
  }

  handleJumping(inputManager) {
    if (inputManager.isJumping() && this.isGrounded && !this.harvestAnimator.isHarvesting()) {
      this.velocity.y = this.jumpPower;
      this.isGrounded = false;
    }
  }

  applyPhysics(deltaTime) {
    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Ground collision
    if (this.position.y <= this.groundLevel) {
      this.position.y = this.groundLevel;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    
    // Update mesh position
    this.playerMesh.position.copy(this.position);
  }

  updateCamera() {
    // Only update camera rotation in first person mode
    if (this.cameraManager.isFirstPerson) {
      // Apply rotation
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.y = this.yaw;
    }
  }

  // Harvest methods
  startHarvest(crop, onComplete) {
    // Switch to third person for harvest animation
    this.cameraManager.switchToThirdPerson();
    
    // Start harvest animation
    return this.harvestAnimator.startHarvestAnimation(crop, () => {
      // Switch back to first person when done
      this.cameraManager.switchToFirstPerson();
      
      if (onComplete) {
        onComplete();
      }
    });
  }

  isHarvesting() {
    return this.harvestAnimator.isHarvesting();
  }

  stopHarvest() {
    this.harvestAnimator.stopAnimation();
    this.cameraManager.switchToFirstPerson();
  }

  // Camera control methods
  switchToThirdPerson() {
    this.cameraManager.switchToThirdPerson();
  }

  switchToFirstPerson() {
    this.cameraManager.switchToFirstPerson();
  }

  isInThirdPerson() {
    return this.cameraManager.isInThirdPerson();
  }
}
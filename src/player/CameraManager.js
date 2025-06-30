import * as THREE from 'three';

export class CameraManager {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.isFirstPerson = true;
    this.thirdPersonDistance = 8;
    this.thirdPersonHeight = 3;
    this.transitionSpeed = 5;
    this.currentDistance = 0;
    this.currentHeight = 1.6;
    this.targetDistance = 0;
    this.targetHeight = 1.6;
    
    // Store original first-person position
    this.firstPersonOffset = { x: 0, y: 1.6, z: 0 };
  }

  switchToThirdPerson() {
    this.isFirstPerson = false;
    this.targetDistance = this.thirdPersonDistance;
    this.targetHeight = this.thirdPersonHeight;
  }

  switchToFirstPerson() {
    this.isFirstPerson = true;
    this.targetDistance = 0;
    this.targetHeight = 1.6;
  }

  update(deltaTime) {
    // Smooth transition between camera modes
    this.currentDistance += (this.targetDistance - this.currentDistance) * this.transitionSpeed * deltaTime;
    this.currentHeight += (this.targetHeight - this.currentHeight) * this.transitionSpeed * deltaTime;

    if (this.isFirstPerson) {
      // First-person camera (attached to player)
      this.camera.position.copy(this.player.position);
      this.camera.position.y += this.currentHeight;
    } else {
      // Third-person camera (behind and above player)
      const playerPosition = this.player.position.clone();
      
      // Calculate camera position behind player
      const cameraOffset = new THREE.Vector3(0, 0, this.currentDistance);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      
      this.camera.position.copy(playerPosition);
      this.camera.position.add(cameraOffset);
      this.camera.position.y += this.currentHeight;
      
      // Look at player
      const lookAtTarget = playerPosition.clone();
      lookAtTarget.y += 1.6;
      this.camera.lookAt(lookAtTarget);
    }
  }

  isInThirdPerson() {
    return !this.isFirstPerson;
  }
}
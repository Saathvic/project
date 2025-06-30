export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.pointerLocked = false;
    this.onInteract = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
      
      // Handle interaction
      if (event.code === 'KeyE' && this.onInteract) {
        this.onInteract();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });

    // Mouse movement
    document.addEventListener('mousemove', (event) => {
      if (this.pointerLocked) {
        this.mouseDelta.x = event.movementX || 0;
        this.mouseDelta.y = event.movementY || 0;
      }
    });

    // Pointer lock events
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === document.getElementById('gameCanvas');
      console.log('Pointer lock changed:', this.pointerLocked);
    });

    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
      this.pointerLocked = false;
    });

    // Canvas click to lock
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('click', () => {
        if (!this.pointerLocked) {
          canvas.requestPointerLock();
        }
      });
    }
  }

  getMovementVector() {
    const movement = { x: 0, z: 0 };

    // WASD controls
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      movement.z = -1;
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      movement.z = 1;
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      movement.x = -1;
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      movement.x = 1;
    }

    // Normalize diagonal movement
    const length = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
    if (length > 0) {
      movement.x /= length;
      movement.z /= length;
    }

    return movement;
  }

  isJumping() {
    return this.keys['Space'];
  }

  getMouseDelta() {
    const delta = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  isPointerLocked() {
    return this.pointerLocked;
  }

  requestPointerLock() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }
}
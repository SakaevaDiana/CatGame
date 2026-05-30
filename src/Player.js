import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class Player {
  constructor(scene, input, collision) {
    this.scene = scene;
    this.input = input;
    this.collision = collision;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    this.halfW = 0.25;
    this.halfD = 0.25;
    this.speed = 5;
    this.jumpSpeed = 7;
    this.gravity = -25;
    this.rotateSpeed = 3;
    this.friction = 0.85;

    this.velocity = new THREE.Vector3();
    this.isGrounded = true;

    this.model = null;
    this.mixer = null;
    this.anims = {};
    this.isMoving = false;
    this.modelReady = false;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._moveVec = new THREE.Vector3();

    this.loadModel();
  }

  async loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-cat.glb');
      this.model = gltf.scene;
      this.model.scale.set(0.8, 0.8, 0.8);
      this.model.rotation.y = Math.PI;
      this.model.position.y = 0;
      this.group.add(this.model);

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);
        for (const clip of gltf.animations) {
          const name = clip.name || 'anim_' + this.anims.length;
          const action = this.mixer.clipAction(clip);
          action.stop();
          this.anims[name] = action;
        }
      }
      this.modelReady = true;
    } catch (err) {
      console.warn('Failed to load cat GLTF, using placeholder:', err);
      this.createPlaceholder();
      this.modelReady = true;
    }
  }

  createPlaceholder() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xff9900 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.7), mat);
    body.position.y = 0.35;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
    head.position.set(0, 0.6, -0.45);
    g.add(head);

    const earMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    const earGeo = new THREE.ConeGeometry(0.12, 0.15, 4);
    for (const x of [-0.18, 0.18]) {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(x, 0.78, -0.4);
      ear.rotation.z = x < 0 ? 0.3 : -0.3;
      g.add(ear);
    }

    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xff6600 })
    );
    tail.position.set(0, 0.3, 0.45);
    tail.rotation.x = -0.6;
    g.add(tail);

    const legMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.18);
    const legPos = [[-0.2, 0.09, 0.2], [0.2, 0.09, 0.2], [-0.2, 0.09, -0.2], [0.2, 0.09, -0.2]];
    for (const [x, y, z] of legPos) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      g.add(leg);
    }

    this.model = g;
    this.group.add(this.model);
  }

  update(delta) {
    if (!this.modelReady) return;
    if (delta > 0.1) delta = 0.016;

    if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) {
      this.group.rotation.y += this.rotateSpeed * delta;
    }
    if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) {
      this.group.rotation.y -= this.rotateSpeed * delta;
    }

    this._forward.set(0, 0, -1).applyQuaternion(this.group.quaternion);
    this._right.set(1, 0, 0).applyQuaternion(this.group.quaternion);

    let mx = 0, mz = 0;
    if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp')) {
      mx += this._forward.x; mz += this._forward.z;
    }
    if (this.input.isDown('KeyS') || this.input.isDown('ArrowDown')) {
      mx -= this._forward.x; mz -= this._forward.z;
    }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.01) {
      this.velocity.x = (mx / len) * this.speed;
      this.velocity.z = (mz / len) * this.speed;
    } else {
      this.velocity.x *= this.friction;
      this.velocity.z *= this.friction;
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    if ((this.input.isDown('Space') || this.input.wasPressed('Space')) && this.isGrounded) {
      this.velocity.y = this.jumpSpeed;
      this.isGrounded = false;
    }

    this.velocity.y += this.gravity * delta;

    const dx = this.velocity.x * delta;
    const dz = this.velocity.z * delta;
    const res = this.collision.resolve(
      this.group.position.x, this.group.position.z,
      this.halfW, this.halfD, dx, dz,
      this.group.position.y
    );
    if (res.x === this.group.position.x) this.velocity.x = 0;
    if (res.z === this.group.position.z) this.velocity.z = 0;
    this.group.position.x = res.x;
    this.group.position.z = res.z;
    this.group.position.y += this.velocity.y * delta;

    if (this.group.position.y <= 0) {
      this.group.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    const movingNow = this.input.isDown('KeyW') || this.input.isDown('ArrowUp')
      || this.input.isDown('KeyS') || this.input.isDown('ArrowDown')
      || Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01;
    if (movingNow !== this.isMoving && this.mixer) {
      this.isMoving = movingNow;
      for (const action of Object.values(this.anims)) {
        this.isMoving ? action.play() : action.stop();
      }
    }
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  get position() { return this.group.position; }
  get rotation() { return this.group.quaternion; }
}

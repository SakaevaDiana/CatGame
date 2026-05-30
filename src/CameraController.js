import * as THREE from 'three';

export default class CameraController {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;

    this.distance = 6;
    this.height = 3.5;
    this.lookHeight = 1.0;
    this.smoothSpeed = 4.0;

    this._currentPos = new THREE.Vector3();
    this._currentLook = new THREE.Vector3();
    this._desiredPos = new THREE.Vector3();
    this._desiredLook = new THREE.Vector3();
    this._forward = new THREE.Vector3();

    this.update(0.016);
  }

  update(delta) {
    const pos = this.target.position;
    const quat = this.target.rotation;

    this._forward.set(0, 0, -1).applyQuaternion(quat);

    const behind = this._forward.clone().multiplyScalar(-this.distance);
    this._desiredPos.copy(pos).add(behind).add(new THREE.Vector3(0, this.height, 0));
    this._desiredLook.copy(pos).add(new THREE.Vector3(0, this.lookHeight, 0));

    const t = Math.min(1, this.smoothSpeed * delta);
    this._currentPos.lerp(this._desiredPos, t);
    this._currentLook.lerp(this._desiredLook, t);

    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._currentLook);
  }
}

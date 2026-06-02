import * as THREE from 'three';

export default class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.bubbleEl = null;
    this.droplet = null;
    this.dropletTime = 0;
    this.active = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this.earOffset = new THREE.Vector3(0.25, 0.65, 0.45);

    this.createBubble();
    this.createDroplet();
  }

  createBubble() {
    const container = document.createElement('div');
    container.className = 'speech-bubble';

    const text = document.createElement('div');
    text.className = 'speech-bubble-text';
    text.textContent = 'У меня никогда не было друзей, может я смогу найти их здесь..';

    const hint = document.createElement('div');
    hint.className = 'speech-bubble-hint';
    hint.textContent = 'Нажми любую кнопку чтобы продолжить';

    const tail = document.createElement('div');
    tail.className = 'speech-bubble-tail';

    container.appendChild(text);
    container.appendChild(hint);
    container.appendChild(tail);
    container.style.display = 'none';
    document.body.appendChild(container);
    this.bubbleEl = container;
  }

  createDroplet() {
    const group = new THREE.Group();

    const mat = new THREE.MeshBasicMaterial({
      color: 0x3399ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), mat);
    sphere.scale.set(0.8, 1.2, 0.8);
    sphere.position.y = 0.06;
    group.add(sphere);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), mat);
    cone.position.y = 0.16;
    group.add(cone);

    group.visible = false;
    this.droplet = group;
    this.game.scene.add(group);
  }

  show() {
    this.active = true;
    this.bubbleEl.style.display = 'block';
    this.droplet.visible = true;
    this.dropletTime = 0;

    this.droplet.children.forEach(c => {
      c.material.opacity = 1;
    });

    window.addEventListener('keydown', this._onKeyDown);
  }

  hide() {
    this.active = false;
    this.bubbleEl.style.display = 'none';
    this.droplet.visible = false;
    window.removeEventListener('keydown', this._onKeyDown);
    if (this.game.input) this.game.input.clearJustPressed();
  }

  _onKeyDown() {
    this.hide();
  }

  update(delta) {
    if (!this.active) return;

    const catPos = this.game.player.position;
    const worldPos = new THREE.Vector3(catPos.x, catPos.y + 1.4, catPos.z);
    worldPos.project(this.game.camera);

    const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

    this.bubbleEl.style.left = x + 'px';
    this.bubbleEl.style.top = (y - 20) + 'px';

    this.dropletTime += delta;

    const earWorld = new THREE.Vector3();
    earWorld.copy(this.earOffset);
    earWorld.applyQuaternion(this.game.player.rotation);
    earWorld.add(this.game.player.position);
    earWorld.y += 0.25 + Math.sin(this.dropletTime * 4) * 0.04;
    this.droplet.position.copy(earWorld);

    this.droplet.rotation.x = Math.sin(this.dropletTime * 3) * 0.1;
  }
}

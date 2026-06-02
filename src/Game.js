import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Player from './Player.js';
import InputManager from './InputManager.js';
import CameraController from './CameraController.js';
import CollisionSystem from './CollisionSystem.js';
import DialogueSystem from './DialogueSystem.js';
import QuestSystem from './QuestSystem.js';

const ENV = [
  { path: '/assets/models/nature/tree_oak.glb', scale: 7.0, coll: { w: 2.5, d: 2.5, h: 999 }, instances: [
    [-12, -8], [10, -10], [15, 12], [-15, 10], [-8, -15], [18, -5], [-18, 5],
    [-14, -12], [22, 3], [-22, -3], [5, -22], [-5, 22],
  ]},
  { path: '/assets/models/nature/tree_oak_dark.glb', scale: 7.0, coll: { w: 2.5, d: 2.5, h: 999 }, instances: [
    [12, -14], [5, 18], [-5, -18], [20, 0], [-20, 0], [0, 20], [0, -20],
  ]},
  { path: '/assets/models/nature/tree_pineRoundA.glb', scale: 6.0, coll: { w: 2.0, d: 2.0, h: 999 }, instances: [
    [25, 8], [25, -8], [-25, 8], [-25, -8], [8, 25], [-8, 25], [8, -25], [-8, -25],
  ]},
  { path: '/assets/models/nature/rock_largeA.glb', scale: 1.5, coll: { w: 1.2, d: 1.2, h: 0.8 }, instances: [
    [-5, -5], [7, 7], [-9, 9],
  ]},
  { path: '/assets/models/nature/rock_smallA.glb', scale: 2.0, coll: { w: 0.8, d: 0.8, h: 0.5 }, instances: [
    [11, -7], [-3, 12], [6, -4], [-7, -8],
  ]},
  { path: '/assets/models/nature/plant_bush.glb', scale: 2.0, coll: { w: 1.0, d: 1.0, h: 0.6 }, instances: [
    [-2, 5], [3, -6], [-4, -3], [8, 2],
  ]},
  { path: '/assets/models/nature/plant_bushSmall.glb', scale: 2.0, coll: { w: 0.8, d: 0.8, h: 0.4 }, instances: [
    [4, 4], [-6, -2], [1, -8], [-5, 7],
  ]},
  { path: '/assets/models/nature/flower_redA.glb', scale: 1.5, coll: null, instances: [
    [2, 2], [-3, -4], [5, -2], [-2, 6], [0, -5], [-6, 0],
  ]},
  { path: '/assets/models/nature/flower_yellowA.glb', scale: 1.5, coll: null, instances: [
    [1, -3], [-4, 5], [6, 1], [-1, -6], [3, 4],
  ]},
];

export default class Game {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.collision = new CollisionSystem();
    this.running = false;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

    this.input = new InputManager();
    this.player = new Player(this.scene, this.input, this.collision);
    this.camCtrl = new CameraController(this.camera, this.player);
    this.dialogue = new DialogueSystem(this);
    this.quest = new QuestSystem(this);

    this.setupLights();
    this.setupGround();

    window.addEventListener('resize', this._onResize.bind(this));
  }

  async loadEnvironment() {
    const loader = new GLTFLoader();
    const cache = {};

    const tasks = ENV.map(async (def) => {
      try {
        if (!cache[def.path]) {
          const gltf = await loader.loadAsync(def.path);
          cache[def.path] = gltf.scene;
        }
        const base = cache[def.path];
        for (const [x, z] of def.instances) {
          const clone = base.clone();
          clone.scale.setScalar(def.scale);
          clone.position.set(x, 0, z);
          clone.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
          this.scene.add(clone);
          if (def.coll) this.collision.addRect(x, z, def.coll.w, def.coll.d, def.coll.h);
        }
      } catch (err) {
        console.warn('Failed to load', def.path, err);
      }
    });

    await Promise.all(tasks);
  }

  start() {
    this.running = true;
    this.animate();
    setTimeout(() => this.dialogue.show(), 500);
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(20, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    this.scene.add(sun);

    this.scene.add(new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4));
  }

  setupGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const boundMat = new THREE.LineBasicMaterial({ color: 0x8B0000 });
    const pts = [
      [-32, 0, -32], [32, 0, -32], [32, 0, 32], [-32, 0, 32], [-32, 0, -32]
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    this.scene.add(new THREE.Line(geo, boundMat));
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    this.player.update(delta);
    this.camCtrl.update(delta);
    this.dialogue.update(delta);
    this.quest.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
}

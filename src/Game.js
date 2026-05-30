import * as THREE from 'three';
import Player from './Player.js';
import InputManager from './InputManager.js';
import CameraController from './CameraController.js';

export default class Game {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();

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
    this.player = new Player(this.scene, this.input);
    this.camCtrl = new CameraController(this.camera, this.player);

    this.setupLights();
    this.setupGround();
    this.setupEnvironment();

    window.addEventListener('resize', this._onResize.bind(this));

    this.animate();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(20, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.4);
    this.scene.add(hemi);
  }

  setupGround() {
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c3f,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(80, 40, 0x3a6c2f, 0x3a6c2f);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  setupEnvironment() {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x5a8a4f });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c2e });

    const positions = [
      [-12, -8], [10, -10], [15, 12], [-15, 10], [-8, -15],
      [18, -5], [-18, 5], [5, 18], [-5, -18], [12, -14],
      [-14, -12], [20, 0], [-20, 0], [0, 20], [0, -20],
    ];

    for (const [x, z] of positions) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.5), trunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      g.add(trunk);

      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 7), treeMat);
      crown.position.y = 2.0;
      crown.castShadow = true;
      g.add(crown);

      g.position.set(x, 0, z);
      this.scene.add(g);
    }

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    const rockPos = [[-5, -5], [7, 7], [-9, 9], [11, -7], [-3, 12]];
    for (const [x, z] of rockPos) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.4), rockMat);
      rock.position.set(x, 0.3, z);
      rock.scale.y = 0.5 + Math.random() * 0.3;
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    this.player.update(delta);
    this.camCtrl.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DOG_POS = { x: 7, z: -7 };
const BONE_POS = { x: -16, z: -14 };
const BEE_POS = { x: 3, z: 3 };
const FLOWER2_POS = { x: -12, z: 8 };
const FOX_POS = { x: -5, z: -10 };
const PIG_POS = { x: 12, z: 12 };
const HOG_POS = { x: -18, z: -5 };
const MEET_POS = { x: 0, z: 0 };

const RIDDLES = [
  {
    q: 'Рыжая плутовка, зайцев ищет ловко.',
    answers: ['Волк', 'Лиса', 'Рысь'],
    correct: 1,
    fb: ['я не уверена..', 'Точно это же я', 'я не уверена..']
  },
  {
    q: 'Горб иль два есть на спине, им доволен я вполне.',
    answers: ['Кенгуру', 'Лошадь', 'Верблюд'],
    correct: 2,
    fb: ['я не уверена..', 'я не уверена..', 'Точно это же Верблюд']
  },
  {
    q: 'Дом свой носит на спине, не войти тебе и мне.',
    answers: ['Улитка', 'Кенгуру', 'Ленивец'],
    correct: 0,
    fb: ['Точно это же Улитка', 'я не уверена..', 'я не уверена..']
  },
  {
    q: 'Любит она шишки и озорней мальчишки.',
    answers: ['Белка', 'Обезьяна', 'Куница'],
    correct: 0,
    fb: ['Точно это же Белка', 'я не уверена..', 'я не уверена..']
  },
  {
    q: 'Не хожу и не бегу, с сумкой прыгать я могу.',
    answers: ['Заяц', 'Кенгуру', 'Тушканчик'],
    correct: 1,
    fb: ['я не уверена..', 'Точно это же Кенгуру', 'я не уверена..']
  }
];

export default class QuestSystem {
  constructor(game) {
    this.game = game;
    this.friends = 0;

    this.dog = null;
    this.bone = null;
    this.dogReady = false;
    this.questState = 'INITIAL';

    this.bee = null;
    this.beeReady = false;
    this.questFlower = null;
    this.beeQuestState = 'idle';
    this.beeFollowTime = 0;
    this.beeFlyProgress = 0;

    this.fox = null;
    this.foxReady = false;
    this.foxQuestState = 'idle';
    this.foxQuizIndex = 0;

    this.pig = null;
    this.hog = null;
    this.pigReady = false;
    this.hogReady = false;
    this.pigQuestState = 'idle';
    this.hogQuestState = 'idle';
    this.matchmaking = false;
    this.matchPhase = null;
    this.matchTime = 0;
    this.matchOverlay = null;
    this.cutsceneBubble = null;

    this.quizPanel = null;
    this.quizActive = false;

    this.interactPrompt = null;
    this.questBubble = null;
    this.questBubbleActive = false;
    this._justDismissed = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onCutsceneKeyDown = this._onCutsceneKeyDown.bind(this);

    this.createBone();
    this.createFriendCounter();
    this.createInteractPrompt();
    this.createQuestBubble();
    this.loadDog();
    this.loadBee();
    this.loadFlower();
    this.loadFox();
    this.loadPig();
    this.loadHog();
    this.createCutsceneElements();
  }

  async loadDog() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-dog.glb');
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);
      model.rotation.y = Math.PI;
      model.position.set(DOG_POS.x, 0, DOG_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.dog = model;
      this.dogReady = true;
    } catch (err) {
      console.warn('Failed to load dog GLTF, using placeholder:', err);
      this.createPlaceholderDog();
      this.dogReady = true;
    }
    this.game.collision.addRect(DOG_POS.x, DOG_POS.z, 1, 1, 0.5);
  }

  async loadBee() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-bee.glb');
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5);
      model.rotation.y = Math.PI;
      model.position.set(BEE_POS.x, 0.3, BEE_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.bee = model;
      this.beeReady = true;
    } catch (err) {
      console.warn('Failed to load bee GLTF:', err);
    }
    this.game.collision.addRect(BEE_POS.x, BEE_POS.z, 0.8, 0.8, 0.5);
  }

  async loadFlower() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/flower.glb');
      const model = gltf.scene;
      model.scale.set(1.2, 1.2, 1.2);
      model.position.set(FLOWER2_POS.x, 0, FLOWER2_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.questFlower = model;
    } catch (err) {
      console.warn('Failed to load flower GLTF:', err);
    }
  }

  async loadFox() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-fox.glb');
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);
      model.rotation.y = Math.PI;
      model.position.set(FOX_POS.x, 0, FOX_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.fox = model;
      this.foxReady = true;
    } catch (err) {
      console.warn('Failed to load fox GLTF:', err);
    }
    this.game.collision.addRect(FOX_POS.x, FOX_POS.z, 1, 1, 0.5);
    this.createQuizPanel();
  }

  createQuizPanel() {
    const panel = document.createElement('div');
    panel.id = 'quiz-panel';
    panel.style.display = 'none';

    const header = document.createElement('div');
    header.className = 'quiz-header';
    panel.appendChild(header);

    const question = document.createElement('div');
    question.className = 'quiz-question';
    panel.appendChild(question);

    const answersDiv = document.createElement('div');
    answersDiv.className = 'quiz-answers';
    panel.appendChild(answersDiv);

    const feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';
    panel.appendChild(feedback);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'quiz-next';
    nextBtn.textContent = 'Продолжить';
    nextBtn.addEventListener('click', () => this.handleQuizNext());
    panel.appendChild(nextBtn);

    document.body.appendChild(panel);
    this.quizPanel = panel;
    this.quizHeader = header;
    this.quizQuestion = question;
    this.quizAnswers = answersDiv;
    this.quizFeedback = feedback;
    this.quizNextBtn = nextBtn;
  }

  startQuiz() {
    this.foxQuizIndex = 0;
    this.quizActive = true;
    this.showQuizQuestion();
  }

  showQuizQuestion() {
    const r = RIDDLES[this.foxQuizIndex];
    this.quizHeader.textContent = `Загадка ${this.foxQuizIndex + 1}/${RIDDLES.length}`;
    this.quizQuestion.textContent = r.q;
    this.quizAnswers.innerHTML = '';
    this.quizFeedback.textContent = '';
    this.quizFeedback.style.display = 'none';
    this.quizNextBtn.style.display = 'none';
    this.quizPanel.style.display = 'block';

    r.answers.forEach((a, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer-btn';
      btn.textContent = a;
      btn.dataset.index = i;
      btn.addEventListener('click', () => this.handleQuizAnswer(i));
      this.quizAnswers.appendChild(btn);
    });
  }

  handleQuizAnswer(index) {
    const r = RIDDLES[this.foxQuizIndex];
    const btns = this.quizAnswers.querySelectorAll('.quiz-answer-btn');
    btns.forEach(b => b.style.pointerEvents = 'none');

    if (index === r.correct) {
      btns[index].classList.add('correct');
      this.quizFeedback.textContent = 'Лиса: ' + r.fb[index];
      this.quizFeedback.className = 'quiz-feedback correct';
      this.quizNextBtn.dataset.action = 'next';
    } else {
      btns[index].classList.add('wrong');
      this.quizFeedback.textContent = 'Лиса: ' + r.fb[index];
      this.quizFeedback.className = 'quiz-feedback wrong';
      this.quizNextBtn.dataset.action = 'retry';
    }
    this.quizFeedback.style.display = 'block';
    this.quizNextBtn.style.display = 'block';
  }

  handleQuizNext() {
    const action = this.quizNextBtn.dataset.action;
    if (action === 'next') {
      this.foxQuizIndex++;
      if (this.foxQuizIndex >= RIDDLES.length) {
        this.finishQuiz();
      } else {
        this.showQuizQuestion();
      }
    } else {
      this.showQuizQuestion();
    }
  }

  finishQuiz() {
    this.quizPanel.style.display = 'none';
    this.quizActive = false;
    this.foxQuestState = 'friend';
    this.friends++;
    this.friendCounterEl.innerHTML = '<b>Друзья:</b> ' + this.friends + '/6';
    this.showQuestBubble('Ты такой умный! Может станем друзьями?');
  }

  async loadPig() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-pig.glb');
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);
      model.rotation.y = 0;
      model.position.set(PIG_POS.x, 0, PIG_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.pig = model;
      this.pigReady = true;
    } catch (err) { console.warn('Failed to load pig GLTF:', err); }
    this.game.collision.addRect(PIG_POS.x, PIG_POS.z, 1, 1, 0.5);
  }

  async loadHog() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/assets/models/animal-hog.glb');
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);
      model.rotation.y = 0;
      model.position.set(HOG_POS.x, 0, HOG_POS.z);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.game.scene.add(model);
      this.hog = model;
      this.hogReady = true;
    } catch (err) { console.warn('Failed to load hog GLTF:', err); }
    this.game.collision.addRect(HOG_POS.x, HOG_POS.z, 1, 1, 0.5);
  }

  createCutsceneElements() {
    const overlay = document.createElement('div');
    overlay.id = 'match-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    this.matchOverlay = overlay;

    const bubble = document.createElement('div');
    bubble.className = 'quest-bubble';
    bubble.id = 'cutscene-bubble';
    const text = document.createElement('div');
    text.className = 'quest-bubble-text';
    const tail = document.createElement('div');
    tail.className = 'quest-bubble-tail';
    bubble.appendChild(text);
    bubble.appendChild(tail);
    bubble.style.display = 'none';
    document.body.appendChild(bubble);
    this.cutsceneBubble = bubble;
  }

  startMatchmaking() {
    this.matchmaking = true;
    this.matchPhase = 'fade_in';
    this.matchTime = 0;
    this.matchOverlay.style.display = 'block';
    this.matchOverlay.style.opacity = '0';
  }

  updateMatchmaking(delta) {
    if (!this.matchmaking) return;

    this.matchTime += delta;

    if (this.matchPhase === 'fade_in') {
      const t = Math.min(this.matchTime / 1, 1);
      this.matchOverlay.style.opacity = t;
      if (t >= 1) {
        this.matchPhase = 'moving';
        this.matchTime = 0;
        this.pig.position.set(PIG_POS.x, 0, PIG_POS.z);
        this.hog.position.set(HOG_POS.x, 0, HOG_POS.z);
      }
    } else if (this.matchPhase === 'moving') {
      const t = Math.min(this.matchTime / 2, 1);
      this.pig.position.lerpVectors(
        new THREE.Vector3(PIG_POS.x, 0, PIG_POS.z),
        new THREE.Vector3(MEET_POS.x - 0.6, 0, MEET_POS.z),
        t
      );
      this.hog.position.lerpVectors(
        new THREE.Vector3(HOG_POS.x, 0, HOG_POS.z),
        new THREE.Vector3(MEET_POS.x + 0.6, 0, MEET_POS.z),
        t
      );
      this.pig.rotation.y = Math.PI / 2;
      this.hog.rotation.y = -Math.PI / 2;
      if (t >= 1) {
        this.matchPhase = 'fade_out';
        this.matchTime = 0;
      }
    } else if (this.matchPhase === 'fade_out') {
      const t = Math.min(this.matchTime / 1, 1);
      this.matchOverlay.style.opacity = 1 - t;
      if (t >= 1) {
        this.matchOverlay.style.display = 'none';
        this.matchPhase = 'talking';
        this.matchTime = 0;
        const bubble = this.cutsceneBubble;
        const bt = bubble.querySelector('.quest-bubble-text');
        bt.textContent = 'Спасибо, что познакомил нас!';
        bubble.style.display = 'block';
        this.game.input.clearJustPressed();
        window.addEventListener('keydown', this._onCutsceneKeyDown);
      }
    } else if (this.matchPhase === 'talking') {
      const mid = new THREE.Vector3(MEET_POS.x, 0, MEET_POS.z);
      const vec = new THREE.Vector3(mid.x, mid.y + 1.5, mid.z);
      vec.project(this.game.camera);
      const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
      this.cutsceneBubble.style.left = x + 'px';
      this.cutsceneBubble.style.top = (y - 20) + 'px';
    }
  }

  _onCutsceneKeyDown(e) {
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      this.finishMatchmaking();
    }
  }

  finishMatchmaking() {
    window.removeEventListener('keydown', this._onCutsceneKeyDown);
    this.cutsceneBubble.style.display = 'none';
    this.matchmaking = false;
    this.pigQuestState = 'matchmade';
    this.hogQuestState = 'matchmade';
    this.friends++;
    this.friendCounterEl.innerHTML = '<b>Друзья:</b> ' + this.friends + '/6';
  }

  createPlaceholderDog() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc97a4d });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.65), bodyMat);
    body.position.y = 0.3;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bodyMat);
    head.position.set(0, 0.5, 0.45); head.scale.set(1, 0.9, 0.85);
    g.add(head);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), darkMat);
    snout.position.set(0, 0.47, 0.6); snout.scale.set(0.8, 0.7, 0.6);
    g.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    nose.position.set(0, 0.47, 0.66);
    g.add(nose);
    for (const x of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
      eye.position.set(x, 0.55, 0.55);
      g.add(eye);
    }
    const earGeo = new THREE.ConeGeometry(0.08, 0.12, 6);
    for (const x of [-0.17, 0.17]) {
      const ear = new THREE.Mesh(earGeo, darkMat);
      ear.position.set(x, 0.65, 0.42);
      ear.rotation.z = x < 0 ? -0.4 : 0.4; ear.rotation.x = -0.2;
      g.add(ear);
    }
    const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.16);
    for (const [x, y, z] of [[-0.18, 0.08, 0.2], [0.18, 0.08, 0.2], [-0.18, 0.08, -0.2], [0.18, 0.08, -0.2]]) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(x, y, z);
      g.add(leg);
    }
    const tailGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.35, -0.45); tail.rotation.x = 0.5;
    g.add(tail);
    g.position.set(DOG_POS.x, 0, DOG_POS.z);
    this.game.scene.add(g);
    this.dog = g;
  }

  createBone() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.4 });
    const knobGeo = new THREE.SphereGeometry(0.12, 10, 10);
    const leftKnob = new THREE.Mesh(knobGeo, mat);
    leftKnob.position.set(-0.3, 0, 0); leftKnob.scale.set(1, 0.75, 0.75);
    group.add(leftKnob);
    const rightKnob = new THREE.Mesh(knobGeo, mat);
    rightKnob.position.set(0.3, 0, 0); rightKnob.scale.set(1, 0.75, 0.75);
    group.add(rightKnob);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 6), mat);
    shaft.rotation.z = Math.PI / 2;
    group.add(shaft);
    group.position.set(BONE_POS.x, 0.25, BONE_POS.z);
    group.rotation.y = 0.5;
    this.game.scene.add(group);
    this.bone = group;
  }

  createFriendCounter() {
    const el = document.createElement('div');
    el.id = 'friend-counter';
    document.body.appendChild(el);
    this.friendCounterEl = el;
    const hint = document.createElement('div');
    hint.id = 'e-hint';
    hint.textContent = 'E — взаимодействие';
    document.body.appendChild(hint);
  }

  createInteractPrompt() {
    const el = document.createElement('div');
    el.id = 'interact-prompt';
    el.style.display = 'none';
    document.body.appendChild(el);
    this.interactPrompt = el;
  }

  createQuestBubble() {
    const container = document.createElement('div');
    container.className = 'quest-bubble';
    const text = document.createElement('div');
    text.className = 'quest-bubble-text';
    const tail = document.createElement('div');
    tail.className = 'quest-bubble-tail';
    container.appendChild(text);
    container.appendChild(tail);
    container.style.display = 'none';
    document.body.appendChild(container);
    this.questBubble = container;
  }

  showQuestBubble(text) {
    this.questBubble.querySelector('.quest-bubble-text').textContent = text;
    this.questBubble.style.display = 'block';
    this.questBubbleActive = true;
    this.game.input.clearJustPressed();
    window.addEventListener('keydown', this._onKeyDown);
  }

  hideQuestBubble() {
    this.questBubble.style.display = 'none';
    this.questBubbleActive = false;
    this._justDismissed = true;
    window.removeEventListener('keydown', this._onKeyDown);
  }

  showInteractPrompt(html, worldPos) {
    this.interactPrompt.innerHTML = html;
    this.interactPrompt.style.display = 'block';
    const vec = new THREE.Vector3(worldPos.x, worldPos.y + 0.8, worldPos.z);
    vec.project(this.game.camera);
    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
    this.interactPrompt.style.left = x + 'px';
    this.interactPrompt.style.top = y + 'px';
  }

  hideInteractPrompt() {
    this.interactPrompt.style.display = 'none';
  }

  updateQuestBubblePosition(worldPos) {
    if (!this.questBubbleActive) return;
    const p = worldPos || new THREE.Vector3(0, 0, 0);
    const vec = new THREE.Vector3(p.x, p.y + 1.5, p.z);
    vec.project(this.game.camera);
    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
    this.questBubble.style.left = x + 'px';
    this.questBubble.style.top = (y - 20) + 'px';
  }

  _onKeyDown(e) {
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      this.hideQuestBubble();
    }
  }

  update(delta) {
    if (!this.dogReady) return;

    const px = this.game.player.position.x;
    const pz = this.game.player.position.z;

    const dogPos = this.dog.position;
    const distToDog = Math.sqrt((px - dogPos.x) ** 2 + (pz - dogPos.z) ** 2);
    const distToBone = this.bone && this.bone.visible
      ? Math.sqrt((px - BONE_POS.x) ** 2 + (pz - BONE_POS.z) ** 2) : 999;
    const distToBee = this.bee && this.beeReady && this.beeQuestState === 'idle'
      ? Math.sqrt((px - BEE_POS.x) ** 2 + (pz - BEE_POS.z) ** 2) : 999;
    const distToFlower = this.questFlower && this.questFlower.visible
      ? Math.sqrt((px - FLOWER2_POS.x) ** 2 + (pz - FLOWER2_POS.z) ** 2) : 999;

    const interactionDist = 3;

    if (this.game.dialogue.active) {
      this.hideInteractPrompt();
      return;
    }

    if (this._justDismissed) {
      this._justDismissed = false;
      if (this.beeQuestState === 'talking') {
        this.beeQuestState = 'following';
        if (this.bee) this.bee.rotation.y = this.game.player.rotation.y;
      }
      if (this.foxQuestState === 'intro') {
        this.foxQuestState = 'active';
        this.startQuiz();
      }
      if (this.pigQuestState === 'intro') this.pigQuestState = 'talked';
      if (this.hogQuestState === 'intro') this.hogQuestState = 'talked';
    }

    if (this.questBubbleActive) {
      this.hideInteractPrompt();
      let bubbleTarget;
      if (this.beeQuestState === 'talking' || this.beeQuestState === 'following' || this.beeQuestState === 'bee_friend') {
        bubbleTarget = this.bee ? this.bee.position : null;
      } else if (this.foxQuestState === 'intro' || this.foxQuestState === 'friend') {
        bubbleTarget = this.fox ? this.fox.position : null;
      } else if (this.hogQuestState === 'intro') {
        bubbleTarget = this.hog ? this.hog.position : null;
      } else if (this.pigQuestState === 'intro') {
        bubbleTarget = this.pig ? this.pig.position : null;
      } else {
        bubbleTarget = this.dog ? this.dog.position : null;
      }
      if (bubbleTarget) this.updateQuestBubblePosition(bubbleTarget);
      return;
    }

    if (this.quizActive) {
      this.hideInteractPrompt();
      return;
    }

    this.updateBeeFollowing(delta);
    this.updateMatchmaking(delta);

    if (this.matchmaking) {
      this.hideInteractPrompt();
      return;
    }

    if (this.beeQuestState === 'flying_to_flower') {
      this.updateBeeFlyToFlower(delta);
      this.hideInteractPrompt();
      if (this.questBubbleActive) return;
      this.updateQuestBubblePosition(this.bee ? this.bee.position : null);
      return;
    }

    if (this.questState === 'INITIAL') {
      if (distToDog < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', dogPos);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Я спрятал косточку и забыл где, вот бы кто-нибудь помог мне ее найти..');
          this.questState = 'SEARCHING_BONE';
        }
      } else {
        this.hideInteractPrompt();
      }
    } else if (this.questState === 'SEARCHING_BONE') {
      if (distToBone < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поднять косточку', this.bone.position);
        if (this.game.input.wasPressed('KeyE')) {
          this.bone.visible = false;
          this.showQuestBubble('Вы нашли косточку!');
          this.questState = 'HAS_BONE';
        }
      } else {
        this.hideInteractPrompt();
      }
    } else if (this.questState === 'HAS_BONE') {
      if (distToDog < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы отдать косточку', dogPos);
        if (this.game.input.wasPressed('KeyE')) {
          this.friends++;
          this.friendCounterEl.innerHTML = '<b>Друзья:</b> ' + this.friends + '/6';
          this.showQuestBubble('Ого! Ты нашел мою косточку, спасибо! Меня, кстати, зовут Регги, давай дружить!');
          this.questState = 'FRIEND_MADE';
        }
      } else {
        this.hideInteractPrompt();
      }
    } else if (this.questState === 'FRIEND_MADE') {
      if (distToDog < interactionDist && !this.questBubbleActive) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', dogPos);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Гав! Я твой друг!');
        }
      } else {
        this.hideInteractPrompt();
      }
    }

    if (this.beeReady && this.beeQuestState === 'idle' && distToBee < interactionDist && !this.questBubbleActive) {
      this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', this.bee.position);
      if (this.game.input.wasPressed('KeyE')) {
        this.showQuestBubble('Я никак не могу найти цветочек! Мне очень нужен цветочек! Поможешь мне найти его?');
        this.beeQuestState = 'talking';
      }
    } else if (this.beeReady && this.beeQuestState === 'idle') {
      this.hideInteractPrompt();
    }

    if (this.beeQuestState === 'following' && distToFlower < interactionDist && !this.questBubbleActive) {
      this.showInteractPrompt('Нажми <b>E</b> чтобы осмотреть цветок', this.questFlower.position);
      if (this.game.input.wasPressed('KeyE')) {
        this.startBeeFlyToFlower();
      }
    } else if (this.beeQuestState === 'following') {
      this.hideInteractPrompt();
    }

    if (this.foxReady && this.foxQuestState === 'idle' && this.fox) {
      const fx = this.fox.position;
      const distToFox = Math.sqrt((px - fx.x) ** 2 + (pz - fx.z) ** 2);
      if (distToFox < interactionDist && !this.questBubbleActive && !this.quizActive) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', fx);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Друзья загадали мне загадки, а я никак не могу их отгадать. Может ты сможешь?');
          this.foxQuestState = 'intro';
        }
      } else {
        this.hideInteractPrompt();
      }
    }

    if (this.foxQuestState === 'friend' && this.fox) {
      const fx = this.fox.position;
      const distToFox = Math.sqrt((px - fx.x) ** 2 + (pz - fx.z) ** 2);
      if (distToFox < interactionDist && !this.questBubbleActive && !this.quizActive) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', fx);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Спасибо, что помог с загадками!');
        }
      } else {
        this.hideInteractPrompt();
      }
    }

    const bothTalked = this.pigQuestState === 'talked' && this.hogQuestState === 'talked';
    let nearMatchable = false;

    if (this.pig && this.pigReady && this.pigQuestState === 'idle' && !this.questBubbleActive && !this.quizActive) {
      const d = Math.sqrt((px - PIG_POS.x) ** 2 + (pz - PIG_POS.z) ** 2);
      if (d < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', this.pig.position);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Мне так одиноко и грустно, хочется с кем-нибудь познакомиться..');
          this.pigQuestState = 'intro';
        }
        nearMatchable = true;
      }
    } else if (this.pig && this.pigReady && bothTalked && !this.questBubbleActive && !this.quizActive) {
      const d = Math.sqrt((px - PIG_POS.x) ** 2 + (pz - PIG_POS.z) ** 2);
      if (d < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы познакомить свинку и кабанчика', this.pig.position);
        if (this.game.input.wasPressed('KeyE')) this.startMatchmaking();
        nearMatchable = true;
      }
    }

    if (this.hog && this.hogReady && this.hogQuestState === 'idle' && !this.questBubbleActive && !this.quizActive) {
      const d = Math.sqrt((px - HOG_POS.x) ** 2 + (pz - HOG_POS.z) ** 2);
      if (d < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', this.hog.position);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Я уже так долго не могу найти никого подходящего мне, наверное я всегда буду одинок...');
          this.hogQuestState = 'intro';
        }
        nearMatchable = true;
      }
    } else if (this.hog && this.hogReady && bothTalked && !this.questBubbleActive && !this.quizActive) {
      const d = Math.sqrt((px - HOG_POS.x) ** 2 + (pz - HOG_POS.z) ** 2);
      if (d < interactionDist) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы познакомить свинку и кабанчика', this.hog.position);
        if (this.game.input.wasPressed('KeyE')) this.startMatchmaking();
        nearMatchable = true;
      }
    }

    if (!nearMatchable) this.hideInteractPrompt();

    if (this.beeQuestState === 'bee_friend' && this.bee) {
      const beeWorldPos = this.bee.position;
      const distToBeeFriend = Math.sqrt((px - beeWorldPos.x) ** 2 + (pz - beeWorldPos.z) ** 2);
      if (distToBeeFriend < interactionDist && !this.questBubbleActive) {
        this.showInteractPrompt('Нажми <b>E</b> чтобы поговорить', beeWorldPos);
        if (this.game.input.wasPressed('KeyE')) {
          this.showQuestBubble('Ж-ж-ж! Спасибо, что ты мой друг!');
        }
      } else {
        this.hideInteractPrompt();
      }
    }
  }

  updateBeeFollowing(delta) {
    if (!this.bee || this.beeQuestState !== 'following') return;

    this.beeFollowTime += delta;
    const target = this.game.player.position;
    const offset = new THREE.Vector3(-1, 1.2, -1);
    offset.applyQuaternion(this.game.player.rotation);
    const desired = new THREE.Vector3().copy(target).add(offset);

    this.bee.position.lerp(desired, delta * 3);
    this.bee.position.y = target.y + 1.2 + Math.sin(this.beeFollowTime * 3) * 0.15;
    let diff = this.game.player.rotation.y - this.bee.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.bee.rotation.y += diff * delta * 4;
    this.bee.rotation.z = Math.sin(this.beeFollowTime * 5) * 0.12;
  }

  startBeeFlyToFlower() {
    if (!this.bee || !this.questFlower) return;
    this.beeQuestState = 'flying_to_flower';
    this.beeFlyProgress = 0;
    this.beeStartPos = this.bee.position.clone();
  }

  updateBeeFlyToFlower(delta) {
    if (!this.bee) return;
    this.beeFlyProgress += delta * 0.5;
    if (this.beeFlyProgress >= 1) {
      this.beeFlyProgress = 1;
      this.bee.position.copy(this.beeStartPos).lerp(this.questFlower.position, 1);
      this.bee.position.y += 0.3;
      this.friends++;
      this.friendCounterEl.innerHTML = '<b>Друзья:</b> ' + this.friends + '/6';
      this.beeQuestState = 'bee_friend';
      this.showQuestBubble('Спасибо, что помог! Ты очень добрый, давай станем друзьями?');
      return;
    }
    const t = this.beeFlyProgress;
    const pos = new THREE.Vector3().copy(this.beeStartPos).lerp(this.questFlower.position, t);
    pos.y += 0.3 + Math.sin(t * Math.PI) * 0.5;
    this.bee.position.copy(pos);
  }
}

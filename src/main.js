import Game from './Game.js';

async function start() {
  const game = new Game(document.getElementById('game-container'));
  await game.loadEnvironment();
  document.getElementById('loading').style.display = 'none';
  game.start();
}
start();

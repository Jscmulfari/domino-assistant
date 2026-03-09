import assert from 'node:assert/strict';
import {
  SIDES,
  createGame,
  createTile,
  createPlayers,
  getHandWinner,
  getLegalMoves,
  passTurn,
  playTile,
  validateHands,
  findOpeningPlayer,
} from '../src/domino-engine.js';

const players = createPlayers();
const hands = [
  { playerId: 0, tiles: [createTile(6, 6), createTile(6, 5), createTile(4, 4), createTile(2, 3), createTile(1, 1), createTile(0, 2), createTile(3, 5)] },
  { playerId: 1, tiles: [createTile(5, 5), createTile(1, 6), createTile(1, 2), createTile(0, 0), createTile(2, 2), createTile(0, 3), createTile(4, 5)] },
  { playerId: 2, tiles: [createTile(0, 6), createTile(3, 3), createTile(2, 6), createTile(1, 4), createTile(0, 1), createTile(2, 4), createTile(1, 5)] },
  { playerId: 3, tiles: [createTile(0, 4), createTile(0, 5), createTile(1, 3), createTile(2, 5), createTile(3, 4), createTile(4, 6), createTile(3, 6)] },
];

validateHands(hands);
assert.equal(findOpeningPlayer(hands), 0);

const game = createGame({ players, hands });
assert.equal(game.currentPlayerId, 0);
assert.deepEqual(getLegalMoves(game, 0).map((move) => move.tile.key), ['6-6']);
assert.deepEqual(getLegalMoves(game, 1), []);

playTile(game, { playerId: 0, tile: createTile(6, 6) });
assert.deepEqual(game.ends, { left: 6, right: 6 });
assert.equal(game.currentPlayerId, 1);

playTile(game, { playerId: 1, tile: createTile(1, 6), side: SIDES.RIGHT });
assert.deepEqual(game.ends, { left: 6, right: 1 });
assert.equal(game.currentPlayerId, 2);

playTile(game, { playerId: 2, tile: createTile(0, 6), side: SIDES.LEFT });
assert.deepEqual(game.ends, { left: 0, right: 1 });
assert.equal(game.currentPlayerId, 3);

const p3Moves = getLegalMoves(game, 3).map((move) => `${move.tile.key}:${move.side}`).sort();
assert.deepEqual(p3Moves, ['0-4:left', '0-5:left', '1-3:right']);
playTile(game, { playerId: 3, tile: createTile(0, 4), side: SIDES.LEFT });
assert.deepEqual(game.ends, { left: 4, right: 1 });

const p0Moves = getLegalMoves(game, 0).map((move) => `${move.tile.key}:${move.side}`).sort();
assert.deepEqual(p0Moves, ['1-1:right', '4-4:left']);
playTile(game, { playerId: 0, tile: createTile(1, 1), side: SIDES.RIGHT });
assert.equal(game.currentPlayerId, 1);
assert.throws(() => passTurn(game, 1), /cannot pass/i);

const passGame = createGame({ players, hands });
passGame.board = [{ tile: createTile(4, 6), left: 4, right: 6, side: 'start', playerId: 3 }];
passGame.ends = { left: 4, right: 6 };
passGame.currentPlayerId = 1;
passGame.hands.find((hand) => hand.playerId === 1).tiles = [
  createTile(0, 0),
  createTile(0, 1),
  createTile(0, 2),
  createTile(1, 1),
  createTile(1, 2),
  createTile(2, 2),
  createTile(2, 3),
];
assert.deepEqual(getLegalMoves(passGame, 1), []);
passTurn(passGame, 1);
assert.equal(passGame.currentPlayerId, 2);
assert.equal(passGame.moveHistory.at(-1).type, 'pass');

const winningGame = createGame({ players, hands });
const winnerHand = winningGame.hands.find((hand) => hand.playerId === 0);
winnerHand.tiles = [createTile(6, 6)];
playTile(winningGame, { playerId: 0, tile: createTile(6, 6) });
assert.equal(winningGame.status, 'finished');
assert.deepEqual(getHandWinner(winningGame), { type: 'hand', playerId: 0, team: 0 });

console.log('domino-engine-demo: ok');

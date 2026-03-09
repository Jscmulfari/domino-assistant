const MAX_PIP = 6;
const PLAYER_COUNT = 4;
const HAND_SIZE = 7;
const OPENING_TILE = createTile(6, 6);

export const SIDES = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
});

export function createTile(a, b) {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return Object.freeze({
    a: low,
    b: high,
    key: `${low}-${high}`,
  });
}

export function createDoubleSixSet() {
  const tiles = [];
  for (let a = 0; a <= MAX_PIP; a += 1) {
    for (let b = a; b <= MAX_PIP; b += 1) {
      tiles.push(createTile(a, b));
    }
  }
  return tiles;
}

export function createPlayers() {
  return [
    { id: 0, name: 'player-1', team: 0, seat: 0 },
    { id: 1, name: 'player-2', team: 1, seat: 1 },
    { id: 2, name: 'player-3', team: 0, seat: 2 },
    { id: 3, name: 'player-4', team: 1, seat: 3 },
  ];
}

export function shuffleTiles(tiles, random = Math.random) {
  const copy = [...tiles];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealHands({ shuffledTiles, players = createPlayers() }) {
  if (!Array.isArray(shuffledTiles) || shuffledTiles.length !== PLAYER_COUNT * HAND_SIZE) {
    throw new Error('A full 28-tile shuffled set is required to deal hands.');
  }

  const hands = players.map((player, index) => ({
    playerId: player.id,
    tiles: shuffledTiles.slice(index * HAND_SIZE, (index + 1) * HAND_SIZE),
  }));

  validateHands(hands);
  return hands;
}

export function validateHands(hands) {
  if (!Array.isArray(hands) || hands.length !== PLAYER_COUNT) {
    throw new Error('Exactly 4 hands are required.');
  }

  const allTiles = [];
  for (const hand of hands) {
    if (!Array.isArray(hand.tiles) || hand.tiles.length !== HAND_SIZE) {
      throw new Error('Each player must have exactly 7 tiles.');
    }
    allTiles.push(...hand.tiles.map(normalizeTile));
  }

  if (allTiles.length !== PLAYER_COUNT * HAND_SIZE) {
    throw new Error('A hand distribution must contain exactly 28 tiles.');
  }

  const keys = allTiles.map((tile) => tile.key);
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    throw new Error('Duplicate tiles found in hand distribution.');
  }

  const fullSet = new Set(createDoubleSixSet().map((tile) => tile.key));
  for (const key of unique) {
    if (!fullSet.has(key)) {
      throw new Error(`Invalid tile found in hand distribution: ${key}`);
    }
  }

  return true;
}

export function findOpeningPlayer(hands) {
  validateHands(hands);
  const opener = hands.find((hand) => hand.tiles.some((tile) => normalizeTile(tile).key === OPENING_TILE.key));
  if (!opener) {
    throw new Error('Opening tile 6-6 was not found in any hand.');
  }
  return opener.playerId;
}

export function createGame({ players = createPlayers(), hands, startingPlayerId } = {}) {
  validateHands(hands);

  const normalizedHands = hands.map((hand) => ({
    playerId: hand.playerId,
    tiles: hand.tiles.map(normalizeTile),
  }));

  const opener = startingPlayerId ?? findOpeningPlayer(normalizedHands);

  return {
    players,
    hands: normalizedHands,
    board: [],
    ends: null,
    currentPlayerId: opener,
    openingPlayerId: opener,
    passesInRow: 0,
    moveHistory: [],
    winner: null,
    status: 'in_progress',
  };
}

export function getHand(game, playerId) {
  const hand = game.hands.find((entry) => entry.playerId === playerId);
  if (!hand) {
    throw new Error(`Hand not found for player ${playerId}`);
  }
  return hand;
}

export function getLegalMoves(game, playerId = game.currentPlayerId) {
  if (game.status !== 'in_progress') {
    return [];
  }

  const hand = getHand(game, playerId);
  const tiles = hand.tiles.map(normalizeTile);

  if (game.board.length === 0) {
    return tiles
      .filter((tile) => tile.key === OPENING_TILE.key)
      .map((tile) => ({ tile, side: null, orientation: [tile.a, tile.b] }));
  }

  const { left, right } = game.ends;
  const moves = [];

  for (const tile of tiles) {
    if (tile.a === left || tile.b === left) {
      moves.push({
        tile,
        side: SIDES.LEFT,
        orientation: tile.b === left ? [tile.a, tile.b] : [tile.b, tile.a],
      });
    }

    if (tile.a === right || tile.b === right) {
      moves.push({
        tile,
        side: SIDES.RIGHT,
        orientation: tile.a === right ? [tile.a, tile.b] : [tile.b, tile.a],
      });
    }
  }

  return dedupeMoves(moves);
}

export function canPass(game, playerId = game.currentPlayerId) {
  return getLegalMoves(game, playerId).length === 0;
}

export function playTile(game, { playerId = game.currentPlayerId, tile, side } = {}) {
  assertGameActive(game);
  assertCurrentPlayer(game, playerId);

  const normalizedTile = normalizeTile(tile);
  const legalMove = getLegalMoves(game, playerId).find((move) => (
    move.tile.key === normalizedTile.key && move.side === (move.side === null ? null : side)
  ));

  if (!legalMove) {
    throw new Error(`Illegal move for player ${playerId}: ${normalizedTile.key}${side ? ` on ${side}` : ''}`);
  }

  const hand = getHand(game, playerId);
  hand.tiles = hand.tiles.filter((entry) => entry.key !== normalizedTile.key);

  if (game.board.length === 0) {
    game.board.push({
      tile: normalizedTile,
      left: legalMove.orientation[0],
      right: legalMove.orientation[1],
      side: 'start',
      playerId,
    });
    game.ends = { left: legalMove.orientation[0], right: legalMove.orientation[1] };
  } else if (side === SIDES.LEFT) {
    game.board.unshift({
      tile: normalizedTile,
      left: legalMove.orientation[0],
      right: legalMove.orientation[1],
      side,
      playerId,
    });
    game.ends.left = legalMove.orientation[0];
  } else if (side === SIDES.RIGHT) {
    game.board.push({
      tile: normalizedTile,
      left: legalMove.orientation[0],
      right: legalMove.orientation[1],
      side,
      playerId,
    });
    game.ends.right = legalMove.orientation[1];
  } else {
    throw new Error('A side is required after the opening move.');
  }

  game.moveHistory.push({ type: 'play', playerId, tile: normalizedTile, side: side ?? 'start' });
  game.passesInRow = 0;

  if (hand.tiles.length === 0) {
    game.winner = {
      type: 'hand',
      playerId,
      team: game.players.find((player) => player.id === playerId)?.team ?? null,
    };
    game.status = 'finished';
    return game;
  }

  game.currentPlayerId = getNextPlayerId(game, playerId);
  return game;
}

export function passTurn(game, playerId = game.currentPlayerId) {
  assertGameActive(game);
  assertCurrentPlayer(game, playerId);

  if (!canPass(game, playerId)) {
    throw new Error(`Player ${playerId} cannot pass while legal moves exist.`);
  }

  game.moveHistory.push({ type: 'pass', playerId });
  game.passesInRow += 1;
  game.currentPlayerId = getNextPlayerId(game, playerId);
  return game;
}

export function getNextPlayerId(game, playerId = game.currentPlayerId) {
  return (playerId + 1) % PLAYER_COUNT;
}

export function getHandWinner(game) {
  return game.winner;
}

function normalizeTile(tile) {
  if (!tile || !Number.isInteger(tile.a ?? tile[0]) || !Number.isInteger(tile.b ?? tile[1])) {
    throw new Error('Tile must provide two integer pip values.');
  }
  return createTile(tile.a ?? tile[0], tile.b ?? tile[1]);
}

function dedupeMoves(moves) {
  const seen = new Set();
  return moves.filter((move) => {
    const key = `${move.tile.key}:${move.side}:${move.orientation.join('-')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assertCurrentPlayer(game, playerId) {
  if (game.currentPlayerId !== playerId) {
    throw new Error(`It is not player ${playerId}'s turn.`);
  }
}

function assertGameActive(game) {
  if (game.status !== 'in_progress') {
    throw new Error('Game is already finished.');
  }
}

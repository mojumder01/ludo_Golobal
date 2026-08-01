import {
  STEPS_TO_FINISH,
  isOnSharedRing,
  ringIndexForProgress,
  isSafeRingIndex,
} from './constants.js';

const TOKENS_PER_PLAYER = 4;

export function createInitialState(colors, mode = {}) {
  return {
    players: colors.map((color) => ({
      color,
      tokens: Array(TOKENS_PER_PLAYER).fill(-1),
      isAI: !!mode.aiColors?.includes(color),
      lastRoll: null,
    })),
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolled: false,
    movableTokens: [],
    consecutiveSixes: 0,
    winner: null,
    finishOrder: [],
    lastEvent: null,
    rollId: 0,
    eventId: 0,
  };
}

function computeMovableTokens(player, dice, allPlayers) {
  const movable = [];
  player.tokens.forEach((progress, tokenIndex) => {
    if (progress === STEPS_TO_FINISH) return; // already home
    if (progress === -1) {
      if (dice === 6) movable.push(tokenIndex);
      return;
    }
    const newProgress = progress + dice;
    if (newProgress > STEPS_TO_FINISH) return; // overshoot, illegal

    if (isOnSharedRing(newProgress)) {
      const ringIndex = ringIndexForProgress(player.color, newProgress);
      const blocked = allPlayers.some((opponent) => {
        if (opponent.color === player.color) return false;
        const stackCount = opponent.tokens.filter(
          (p) => isOnSharedRing(p) && ringIndexForProgress(opponent.color, p) === ringIndex
        ).length;
        return stackCount >= 2;
      });
      if (blocked) return;
    }
    movable.push(tokenIndex);
  });
  return movable;
}

function advanceTurn(state) {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    diceValue: null,
    diceRolled: false,
    movableTokens: [],
    consecutiveSixes: 0,
  };
}

export function rollDice(state) {
  if (state.diceRolled || state.winner) return state;
  const dice = 1 + Math.floor(Math.random() * 6);
  const consecutiveSixes = dice === 6 ? state.consecutiveSixes + 1 : 0;

  const rollId = state.rollId + 1;
  const players = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, lastRoll: dice } : p
  );

  const eventId = state.eventId + 1;

  if (consecutiveSixes === 3) {
    return advanceTurn({
      ...state,
      players,
      diceValue: dice,
      rollId,
      eventId,
      lastEvent: { type: 'forfeit-triple-six', color: state.players[state.currentPlayerIndex].color },
    });
  }

  const player = state.players[state.currentPlayerIndex];
  const movable = computeMovableTokens(player, dice, state.players);

  if (movable.length === 0) {
    return advanceTurn({
      ...state,
      players,
      diceValue: dice,
      consecutiveSixes,
      rollId,
      eventId,
      lastEvent: { type: 'no-moves', color: player.color, dice },
    });
  }

  return {
    ...state,
    players,
    diceValue: dice,
    consecutiveSixes,
    rollId,
    eventId,
    diceRolled: true,
    movableTokens: movable,
    lastEvent: null,
  };
}

export function moveToken(state, tokenIndex) {
  if (!state.diceRolled || !state.movableTokens.includes(tokenIndex)) return state;

  const dice = state.diceValue;
  const playerIdx = state.currentPlayerIndex;
  const players = state.players.map((p) => ({ ...p, tokens: [...p.tokens] }));
  const player = players[playerIdx];
  const progress = player.tokens[tokenIndex];
  const newProgress = progress === -1 ? 0 : progress + dice;
  player.tokens[tokenIndex] = newProgress;

  let captured = false;
  let capturedColor = null;
  if (newProgress !== STEPS_TO_FINISH && isOnSharedRing(newProgress)) {
    const ringIndex = ringIndexForProgress(player.color, newProgress);
    if (!isSafeRingIndex(ringIndex)) {
      players.forEach((opponent) => {
        if (opponent.color === player.color) return;
        opponent.tokens = opponent.tokens.map((p) => {
          if (isOnSharedRing(p) && ringIndexForProgress(opponent.color, p) === ringIndex) {
            captured = true;
            capturedColor = opponent.color;
            return -1;
          }
          return p;
        });
      });
    }
  }

  const finished = newProgress === STEPS_TO_FINISH;
  const allHome = player.tokens.every((p) => p === STEPS_TO_FINISH);

  let finishOrder = state.finishOrder;
  let winner = state.winner;
  if (allHome && !finishOrder.includes(player.color)) {
    finishOrder = [...finishOrder, player.color];
    if (!winner) winner = player.color;
  }

  const extraTurn = dice === 6 || captured || finished;

  const lastEvent = captured
    ? { type: 'capture', color: player.color, victim: capturedColor, extraTurn }
    : finished
    ? { type: 'token-home', color: player.color, extraTurn }
    : extraTurn
    ? { type: 'six-again', color: player.color }
    : null;

  const nextState = {
    ...state,
    players,
    finishOrder,
    winner,
    diceRolled: false,
    diceValue: null,
    movableTokens: [],
    lastEvent,
    eventId: state.eventId + 1,
  };

  if (winner) return nextState;

  return extraTurn ? nextState : advanceTurn(nextState);
}

export function currentPlayer(state) {
  return state.players[state.currentPlayerIndex];
}

import { moveToken } from './engine.js';
import {
  isSafeRingIndex,
  isOnSharedRing,
  ringIndexForProgress,
  STEPS_TO_FINISH,
} from './constants.js';

// Whether an opponent could land on this ring cell on their very next
// roll (1-6), or exit their base straight onto it with a 6. Safe cells
// are never threatened since captures can't happen there.
function isThreatened(ringIndex, myColor, allPlayers) {
  if (isSafeRingIndex(ringIndex)) return false;
  return allPlayers.some((opponent) => {
    if (opponent.color === myColor) return false;
    return opponent.tokens.some((progress) => {
      if (progress === STEPS_TO_FINISH) return false;
      if (progress === -1) {
        return ringIndexForProgress(opponent.color, 0) === ringIndex;
      }
      if (!isOnSharedRing(progress)) return false;
      for (let d = 1; d <= 6; d++) {
        const next = progress + d;
        if (!isOnSharedRing(next)) continue;
        if (ringIndexForProgress(opponent.color, next) === ringIndex) return true;
      }
      return false;
    });
  });
}

// Heuristic bot: capture > escape danger > avoid new danger > land on a
// safe cell > get a token home > deploy a new token early > advance the
// furthest token. Scores every legal move and picks the best.
export function chooseAIMove(state) {
  const playerIndex = state.currentPlayerIndex;
  const me = state.players[playerIndex];
  const activeCount = me.tokens.filter((p) => p !== -1 && p !== STEPS_TO_FINISH).length;

  const candidates = state.movableTokens.map((tokenIndex) => {
    const beforeProgress = me.tokens[tokenIndex];
    const result = moveToken(state, tokenIndex);
    const afterProgress = result.players[playerIndex].tokens[tokenIndex];
    const captured = result.lastEvent?.type === 'capture';
    const finished = result.lastEvent?.type === 'token-home';

    let score = 0;
    if (captured) score += 1000;
    if (finished) score += 500;

    if (isOnSharedRing(beforeProgress)) {
      const beforeRing = ringIndexForProgress(me.color, beforeProgress);
      if (isThreatened(beforeRing, me.color, state.players)) {
        const stillOnRing = isOnSharedRing(afterProgress);
        const stillThreatened = stillOnRing && isThreatened(ringIndexForProgress(me.color, afterProgress), me.color, state.players);
        if (!stillThreatened) score += 300; // escaped danger
      }
    }

    if (!captured && isOnSharedRing(afterProgress)) {
      const afterRing = ringIndexForProgress(me.color, afterProgress);
      if (isThreatened(afterRing, me.color, state.players)) score -= 150;
      else if (isSafeRingIndex(afterRing)) score += 80;
    }

    if (beforeProgress === -1 && activeCount < 2) score += 60; // deploy encouragement early game

    score += afterProgress * 0.5; // gentle tiebreak toward advancing further

    return { tokenIndex, score };
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].tokenIndex;
}

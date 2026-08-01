import { moveToken } from './engine.js';

// Simple heuristic bot: prefer capturing, then finishing a token, then
// advancing whichever token is furthest along.
export function chooseAIMove(state) {
  const playerIndex = state.currentPlayerIndex;
  const candidates = state.movableTokens.map((tokenIndex) => {
    const result = moveToken(state, tokenIndex);
    return {
      tokenIndex,
      captured: result.lastEvent?.type === 'capture',
      finished: result.lastEvent?.type === 'token-home',
      progress: result.players[playerIndex].tokens[tokenIndex],
    };
  });

  candidates.sort((a, b) => {
    if (a.captured !== b.captured) return a.captured ? -1 : 1;
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    return b.progress - a.progress;
  });

  return candidates[0].tokenIndex;
}

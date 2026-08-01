import {
  COLORS,
  RING_PATH,
  HOME_COLUMNS,
  BASE_ORIGIN,
  STEPS_TO_FINISH,
  isSafeRingIndex,
  cellForProgress,
} from '../game/constants';
import Token from './Token';

const ringCells = RING_PATH.map(([row, col], ringIndex) => ({
  row,
  col,
  ringIndex,
  safe: isSafeRingIndex(ringIndex),
}));

const homeCells = COLORS.flatMap((color) =>
  HOME_COLUMNS[color].map(([row, col], homeIndex) => ({ row, col, color, homeIndex }))
);

// Small pixel nudges so multiple finished tokens of the same color don't
// perfectly overlap when stacked in the centre.
const STACK_NUDGE = [
  [0, 0],
  [10, -6],
  [-10, 6],
  [6, 10],
];

export default function Board({ gameState, onTokenClick }) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const cellMap = new Map();
  const finishedByColor = { red: [], green: [], yellow: [], blue: [] };

  gameState.players.forEach((player) => {
    player.tokens.forEach((progress, tokenIndex) => {
      const movable =
        player.color === currentPlayer.color &&
        gameState.diceRolled &&
        gameState.movableTokens.includes(tokenIndex);

      if (progress === -1) return; // rendered inside the base quadrant
      if (progress === STEPS_TO_FINISH) {
        finishedByColor[player.color].push({ tokenIndex, movable });
        return;
      }
      const [row, col] = cellForProgress(player.color, progress);
      const key = `${row},${col}`;
      if (!cellMap.has(key)) cellMap.set(key, []);
      cellMap.get(key).push({ color: player.color, tokenIndex, movable });
    });
  });

  return (
    <div className="board">
      {COLORS.map((color) => {
        const [row, col] = BASE_ORIGIN[color];
        const player = gameState.players.find((p) => p.color === color);
        return (
          <div
            key={color}
            className={`base base--${color}`}
            style={{ gridRow: `${row + 1} / span 6`, gridColumn: `${col + 1} / span 6` }}
          >
            <div className="base__panel">
              {[0, 1, 2, 3].map((tokenIndex) => {
                const inBase = player && player.tokens[tokenIndex] === -1;
                if (!inBase) return <div key={tokenIndex} className="base__slot" />;
                const movable =
                  player.color === currentPlayer.color &&
                  gameState.diceRolled &&
                  gameState.movableTokens.includes(tokenIndex);
                return (
                  <div key={tokenIndex} className="base__slot">
                    <Token
                      color={color}
                      movable={movable}
                      onClick={() => onTokenClick(color, tokenIndex)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="center-block" style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3' }}>
        {COLORS.map((color) =>
          finishedByColor[color].map(({ tokenIndex, movable }, i) => (
            <Token
              key={`${color}-${tokenIndex}`}
              color={color}
              movable={movable}
              onClick={() => onTokenClick(color, tokenIndex)}
              offset={STACK_NUDGE[i % STACK_NUDGE.length]}
            />
          ))
        )}
      </div>

      {ringCells.map(({ row, col, safe }) => {
        const tokens = cellMap.get(`${row},${col}`) || [];
        return (
          <div
            key={`ring-${row}-${col}`}
            className={`board__cell${safe ? ' board__cell--safe' : ''}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            {safe && <span className="board__star">★</span>}
            <div className="board__tokens">
              {tokens.map((t) => (
                <Token
                  key={`${t.color}-${t.tokenIndex}`}
                  color={t.color}
                  movable={t.movable}
                  onClick={() => onTokenClick(t.color, t.tokenIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {homeCells.map(({ row, col, color }) => {
        const tokens = cellMap.get(`${row},${col}`) || [];
        return (
          <div
            key={`home-${row}-${col}`}
            className={`board__cell board__cell--home board__cell--home-${color}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            <div className="board__tokens">
              {tokens.map((t) => (
                <Token
                  key={`${t.color}-${t.tokenIndex}`}
                  color={t.color}
                  movable={t.movable}
                  onClick={() => onTokenClick(t.color, t.tokenIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

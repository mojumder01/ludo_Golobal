import {
  COLORS,
  COLOR_HEX,
  GRID_SIZE,
  RING_PATH,
  HOME_COLUMNS,
  BASE_ORIGIN,
  STEPS_TO_FINISH,
  CENTER_CELL,
  isSafeRingIndex,
  cellForProgress,
  baseSlotCell,
} from '../game/constants';
import Token from './Token';
import Dice from './Dice';

const ringCells = RING_PATH.map(([row, col], ringIndex) => ({
  row,
  col,
  ringIndex,
  safe: isSafeRingIndex(ringIndex),
}));

const homeCells = COLORS.flatMap((color) =>
  HOME_COLUMNS[color].map(([row, col], homeIndex) => ({ row, col, color, homeIndex }))
);

// Small pixel nudges so multiple tokens sharing a cell (base slot, safe
// square, or the centre) don't perfectly overlap.
const STACK_NUDGE = [
  [0, 0],
  [9, -6],
  [-9, 6],
  [6, 9],
];

function tokenTargetCell(color, progress, tokenIndex) {
  if (progress === -1) return baseSlotCell(color, tokenIndex);
  if (progress === STEPS_TO_FINISH) return CENTER_CELL;
  return cellForProgress(color, progress);
}

export default function Board({ gameState, onTokenClick, onRoll, rollAnim }) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const turnAccent = COLOR_HEX[currentPlayer.color];

  const nudgeCounts = new Map();
  const tokens = [];

  gameState.players.forEach((player) => {
    player.tokens.forEach((progress, tokenIndex) => {
      const movable =
        player.color === currentPlayer.color &&
        gameState.diceRolled &&
        gameState.movableTokens.includes(tokenIndex);

      const [row, col] = tokenTargetCell(player.color, progress, tokenIndex);
      const key = `${row},${col}`;
      const nudgeIndex = nudgeCounts.get(key) || 0;
      nudgeCounts.set(key, nudgeIndex + 1);

      tokens.push({
        key: `${player.color}-${tokenIndex}`,
        color: player.color,
        movable,
        top: ((row + 0.5) / GRID_SIZE) * 100,
        left: ((col + 0.5) / GRID_SIZE) * 100,
        nudge: STACK_NUDGE[nudgeIndex % STACK_NUDGE.length],
        onClick: () => onTokenClick(player.color, tokenIndex),
      });
    });
  });

  const pulseType = ['capture', 'token-home'].includes(gameState.lastEvent?.type)
    ? gameState.lastEvent.type
    : null;

  return (
    <div className="board" style={{ '--turn-glow': turnAccent }}>
      {COLORS.map((color) => {
        const [row, col] = BASE_ORIGIN[color];
        const player = gameState.players.find((p) => p.color === color);
        const isCurrent = player && player.color === currentPlayer.color;
        const animatingHere = isCurrent && rollAnim?.animating && rollAnim.playerIndex === gameState.currentPlayerIndex;
        const diceValue = animatingHere ? rollAnim.face : isCurrent ? gameState.diceValue : player?.lastRoll;
        const canRollHere =
          isCurrent && !player.isAI && !gameState.diceRolled && !rollAnim?.animating && !gameState.winner;
        return (
          <div
            key={color}
            className={`base base--${color}`}
            style={{ gridRow: `${row + 1} / span 6`, gridColumn: `${col + 1} / span 6` }}
          >
            {player && (
              <div className={`base__dice${isCurrent ? ' base__dice--current' : ''}`}>
                <Dice
                  value={diceValue}
                  rollId={gameState.rollId}
                  size="sm"
                  accentColor={COLOR_HEX[color]}
                  canRoll={canRollHere}
                  spinning={animatingHere}
                  onRoll={onRoll}
                />
              </div>
            )}
            <div className="base__panel">
              {[0, 1, 2, 3].map((tokenIndex) => (
                <div key={tokenIndex} className="base__slot" />
              ))}
            </div>
          </div>
        );
      })}

      <div className="center-block" style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3' }}>
        {pulseType && (
          <span key={gameState.eventId} className={`center-block__flash center-block__flash--${pulseType}`} />
        )}
      </div>

      {ringCells.map(({ row, col, safe }) => (
        <div
          key={`ring-${row}-${col}`}
          className={`board__cell${safe ? ' board__cell--safe' : ''}`}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        >
          {safe && <span className="board__star">★</span>}
        </div>
      ))}

      {homeCells.map(({ row, col, color }) => (
        <div
          key={`home-${row}-${col}`}
          className={`board__cell board__cell--home board__cell--home-${color}`}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        />
      ))}

      <div className="board__tokens-layer">
        {tokens.map((t) => (
          <Token
            key={t.key}
            color={t.color}
            movable={t.movable}
            onClick={t.onClick}
            top={t.top}
            left={t.left}
            nudge={t.nudge}
          />
        ))}
      </div>
    </div>
  );
}

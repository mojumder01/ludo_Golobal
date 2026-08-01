const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

export default function Dice({ value, canRoll, onRoll, rollId, accentColor }) {
  const pips = PIP_LAYOUTS[value] || [];
  return (
    <button
      type="button"
      className={`dice${canRoll ? ' dice--active' : ''}`}
      style={accentColor ? { '--dice-accent': accentColor } : undefined}
      onClick={onRoll}
      disabled={!canRoll}
    >
      <span key={rollId} className="dice__face">
        {value
          ? pips.map(([top, left], i) => (
              <span key={i} className="dice__pip" style={{ top: `${top}%`, left: `${left}%` }} />
            ))
          : null}
      </span>
    </button>
  );
}

import { useState } from 'react';
import { COLORS, COLOR_HEX } from '../game/constants';

const COLOR_LABEL = { red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue' };

export default function Setup({ onStart }) {
  const [slots, setSlots] = useState({
    red: 'human',
    green: 'ai',
    yellow: 'human',
    blue: 'off',
  });

  const activeColors = COLORS.filter((c) => slots[c] !== 'off');
  const canStart = activeColors.length >= 2;

  function cycle(color) {
    const order = ['off', 'human', 'ai'];
    setSlots((s) => ({ ...s, [color]: order[(order.indexOf(s[color]) + 1) % order.length] }));
  }

  function start() {
    onStart(
      activeColors,
      activeColors.filter((c) => slots[c] === 'ai')
    );
  }

  return (
    <div className="setup">
      <h1 className="setup__title">Ludo</h1>
      <p className="setup__subtitle">Pick 2–4 players. Tap a color to cycle Off → Human → Computer.</p>

      <div className="setup__grid">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`setup__slot setup__slot--${slots[color]}`}
            style={{ '--slot-accent': COLOR_HEX[color] }}
            onClick={() => cycle(color)}
          >
            <span className="setup__swatch" />
            <span className="setup__color-name">{COLOR_LABEL[color]}</span>
            <span className="setup__mode">
              {slots[color] === 'off' ? 'Off' : slots[color] === 'human' ? 'Human' : 'Computer'}
            </span>
          </button>
        ))}
      </div>

      <button type="button" className="btn btn--primary" disabled={!canStart} onClick={start}>
        Start game
      </button>
      {!canStart && <p className="setup__hint">Choose at least 2 players.</p>}
    </div>
  );
}

import { COLOR_HEX } from '../game/constants';
import Dice from './Dice';

const COLOR_LABEL = { red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue' };

function eventMessage(event) {
  if (!event) return null;
  switch (event.type) {
    case 'capture':
      return `💥 ${COLOR_LABEL[event.color]} captured a ${COLOR_LABEL[event.victim]} token! ${
        event.extraTurn ? '+ extra turn!' : ''
      }`;
    case 'token-home':
      return `🏠 ${COLOR_LABEL[event.color]} got a token home! ${event.extraTurn ? '+ extra turn!' : ''}`;
    case 'six-again':
      return `🎲 ${COLOR_LABEL[event.color]} rolled a 6 — go again!`;
    case 'forfeit-triple-six':
      return `${COLOR_LABEL[event.color]} rolled three 6s in a row — turn forfeited.`;
    case 'no-moves':
      return `${COLOR_LABEL[event.color]} rolled a ${event.dice} but has no legal move.`;
    default:
      return null;
  }
}

export default function Sidebar({ gameState, onRoll, onRestart, rollAnim }) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const message = eventMessage(gameState.lastEvent);
  const animatingHere = rollAnim?.animating && rollAnim.playerIndex === gameState.currentPlayerIndex;
  const diceValue = animatingHere ? rollAnim.face : gameState.diceValue;

  return (
    <aside className="sidebar">
      {gameState.winner && (
        <div className="banner banner--winner">
          🏆 {COLOR_LABEL[gameState.winner]} wins!
          <button type="button" className="btn" onClick={onRestart}>
            New game
          </button>
        </div>
      )}

      {!gameState.winner && (
        <div className="turn-panel" style={{ '--turn-accent': COLOR_HEX[player.color] }}>
          <div className="turn-panel__label">
            {player.isAI ? `${COLOR_LABEL[player.color]} (Computer) is playing` : `${COLOR_LABEL[player.color]}'s turn`}
          </div>
          <Dice
            value={diceValue}
            rollId={gameState.rollId}
            accentColor={COLOR_HEX[player.color]}
            canRoll={!player.isAI && !gameState.diceRolled && !rollAnim?.animating}
            spinning={animatingHere}
            onRoll={onRoll}
          />
          {gameState.diceRolled && !player.isAI && !animatingHere && (
            <p className="turn-panel__hint">Tap a glowing token to move it.</p>
          )}
        </div>
      )}

      {message && <div className="banner banner--event">{message}</div>}

      <ul className="player-list">
        {gameState.players.map((p, i) => {
          const homeCount = p.tokens.filter((t) => t === 56).length;
          const baseCount = p.tokens.filter((t) => t === -1).length;
          return (
            <li
              key={p.color}
              className={`player-list__item${i === gameState.currentPlayerIndex ? ' player-list__item--active' : ''}`}
            >
              <span className={`player-list__swatch player-list__swatch--${p.color}`} />
              <span className="player-list__name">
                {COLOR_LABEL[p.color]} {p.isAI && <em>· CPU</em>}
              </span>
              <span className="player-list__stats">
                {homeCount}/4 home · {baseCount} in base
              </span>
            </li>
          );
        })}
      </ul>

      {!gameState.winner && (
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          Restart
        </button>
      )}
    </aside>
  );
}

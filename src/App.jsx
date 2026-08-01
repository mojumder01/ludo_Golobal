import { useEffect, useRef, useState } from 'react';
import Board from './components/Board';
import Sidebar from './components/Sidebar';
import Setup from './components/Setup';
import { createInitialState, rollDice, moveToken, currentPlayer } from './game/engine';
import { chooseAIMove } from './game/ai';
import { playDiceTick, playRollNormal, playRollSix, playCapture, playHome, playWin } from './game/sound';
import './index.css';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A short "counting up" sequence of dice faces ending on the real result,
// with ticks that slow down toward the landing — not a sudden jump.
function buildTickSequence(target) {
  const seq = [];
  let face = 1;
  for (let i = 0; i < 8; i++) {
    seq.push(face);
    face = face === 6 ? 1 : face + 1;
  }
  seq.push(target);
  return seq;
}

const TICK_DELAYS = [55, 55, 65, 75, 90, 110, 135, 165, 230];

function playEventSound(event, becameWinner) {
  if (becameWinner) {
    playWin();
    return;
  }
  if (!event) return;
  if (event.type === 'capture') playCapture();
  else if (event.type === 'token-home') playHome();
}

export default function App() {
  const [state, setState] = useState(null);
  const [rollAnim, setRollAnim] = useState({ animating: false, face: null, playerIndex: null });
  const stateRef = useRef(state);
  const rollingRef = useRef(false);
  stateRef.current = state;

  function startGame(colors, aiColors) {
    setState(createInitialState(colors, { aiColors }));
  }

  async function performRoll() {
    const baseState = stateRef.current;
    if (!baseState || baseState.winner || baseState.diceRolled || rollingRef.current) return;
    rollingRef.current = true;

    const playerIndex = baseState.currentPlayerIndex;
    const result = rollDice(baseState);
    const rolledValue = result.players[playerIndex].lastRoll;
    const sequence = buildTickSequence(rolledValue);

    for (let i = 0; i < sequence.length; i++) {
      setRollAnim({ animating: true, face: sequence[i], playerIndex });
      if (i < sequence.length - 1) playDiceTick(i);
      await delay(TICK_DELAYS[i] ?? 120);
    }

    setRollAnim({ animating: false, face: null, playerIndex: null });
    setState(result);
    if (rolledValue === 6) playRollSix();
    else playRollNormal();

    rollingRef.current = false;
  }

  function handleTokenClick(color, tokenIndex) {
    setState((s) => {
      if (!s) return s;
      const player = currentPlayer(s);
      if (player.color !== color || player.isAI) return s;
      const wasWinner = !!s.winner;
      const result = moveToken(s, tokenIndex);
      playEventSound(result.lastEvent, !wasWinner && !!result.winner);
      return result;
    });
  }

  function handleRestart() {
    setState(null);
    setRollAnim({ animating: false, face: null, playerIndex: null });
    rollingRef.current = false;
  }

  useEffect(() => {
    if (!state || state.winner) return;
    const player = currentPlayer(state);
    if (!player.isAI) return;

    const timer = setTimeout(() => {
      if (!state.diceRolled) {
        performRoll();
        return;
      }
      setState((s) => {
        if (!s || s.winner) return s;
        const p = currentPlayer(s);
        if (!p.isAI || !s.diceRolled) return s;
        const wasWinner = !!s.winner;
        const result = moveToken(s, chooseAIMove(s));
        playEventSound(result.lastEvent, !wasWinner && !!result.winner);
        return result;
      });
    }, 700);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state) {
    return (
      <div className="app app--setup">
        <Setup onStart={startGame} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app__layout">
        <Board gameState={state} onTokenClick={handleTokenClick} onRoll={performRoll} rollAnim={rollAnim} />
        <Sidebar gameState={state} onRoll={performRoll} onRestart={handleRestart} rollAnim={rollAnim} />
      </div>
    </div>
  );
}

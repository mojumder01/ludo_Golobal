import { useEffect, useState } from 'react';
import Board from './components/Board';
import Sidebar from './components/Sidebar';
import Setup from './components/Setup';
import { createInitialState, rollDice, moveToken, currentPlayer } from './game/engine';
import { chooseAIMove } from './game/ai';
import './index.css';

export default function App() {
  const [state, setState] = useState(null);

  function startGame(colors, aiColors) {
    setState(createInitialState(colors, { aiColors }));
  }

  function handleRoll() {
    setState((s) => rollDice(s));
  }

  function handleTokenClick(color, tokenIndex) {
    setState((s) => {
      if (!s) return s;
      const player = currentPlayer(s);
      if (player.color !== color || player.isAI) return s;
      return moveToken(s, tokenIndex);
    });
  }

  function handleRestart() {
    setState(null);
  }

  useEffect(() => {
    if (!state || state.winner) return;
    const player = currentPlayer(state);
    if (!player.isAI) return;

    const timer = setTimeout(() => {
      setState((s) => {
        if (!s || s.winner) return s;
        const p = currentPlayer(s);
        if (!p.isAI) return s;
        if (!s.diceRolled) return rollDice(s);
        return moveToken(s, chooseAIMove(s));
      });
    }, 700);

    return () => clearTimeout(timer);
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
        <Board gameState={state} onTokenClick={handleTokenClick} />
        <Sidebar gameState={state} onRoll={handleRoll} onRestart={handleRestart} />
      </div>
    </div>
  );
}

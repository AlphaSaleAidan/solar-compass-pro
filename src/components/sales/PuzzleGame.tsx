import { useState, useEffect } from 'react';
import { PUZZLE_GIFTS } from '@/data/mockData';

const PuzzleGame = () => {
  const [pieces, setPieces] = useState([false, false, false, false]);
  const [timeLeft, setTimeLeft] = useState(72 * 3600); // 72 hours in seconds
  const [currentGiftIndex] = useState(Math.floor(Math.random() * PUZZLE_GIFTS.length));
  const currentGift = PUZZLE_GIFTS[currentGiftIndex];

  // Simulate having some pieces
  useEffect(() => {
    setPieces([true, true, false, false]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const completedCount = pieces.filter(Boolean).length;

  return (
    <div className="bg-bg2 border border-border rounded-xl p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-black text-white">🧩 Deal Puzzle Challenge</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Close 4 deals to win the prize!</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Resets in</div>
          <div className="text-sm font-black text-asp-yellow tabular-nums">{hours}h {mins}m {secs}s</div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <div className="grid grid-cols-2 gap-1 w-32 h-32 mx-auto">
          {pieces.map((filled, i) => (
            <div
              key={i}
              className={`rounded-lg flex items-center justify-center text-2xl font-black transition-all duration-300 ${
                filled
                  ? 'bg-primary/20 border-2 border-primary text-primary shadow-[0_0_12px_rgba(0,212,200,0.3)]'
                  : 'bg-bg3 border-2 border-border text-muted-foreground/30'
              }`}
            >
              {filled ? '⚡' : '?'}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">{completedCount}/4 pieces collected</div>
        <div className="mt-2 px-3 py-1.5 bg-asp-yellow/10 border border-asp-yellow/25 rounded-lg inline-flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <span className="text-xs font-bold text-asp-yellow">{currentGift}</span>
        </div>
      </div>
    </div>
  );
};

export default PuzzleGame;

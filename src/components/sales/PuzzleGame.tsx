import { useState, useEffect } from 'react';
import { Puzzle, Gift, Clock } from 'lucide-react';
import { PUZZLE_GIFTS } from '@/data/mockData';

const PuzzleGame = () => {
  const [pieces, setPieces] = useState([false, false, false, false]);
  const [timeLeft, setTimeLeft] = useState(72 * 3600);
  const [currentGiftIndex] = useState(Math.floor(Math.random() * PUZZLE_GIFTS.length));
  const currentGift = PUZZLE_GIFTS[currentGiftIndex];

  useEffect(() => { setPieces([true, true, false, false]); }, []);
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const completedCount = pieces.filter(Boolean).length;

  // Texas outline path (simplified)
  const texasPath = "M 50 5 L 65 5 L 70 10 L 75 8 L 82 12 L 85 10 L 92 14 L 95 12 L 98 18 L 95 25 L 97 30 L 95 38 L 90 42 L 88 50 L 82 55 L 78 62 L 72 68 L 68 75 L 60 82 L 55 88 L 48 92 L 42 95 L 38 90 L 35 92 L 30 88 L 25 85 L 22 80 L 18 72 L 15 65 L 12 55 L 10 48 L 8 40 L 10 35 L 8 28 L 12 22 L 15 18 L 20 15 L 28 12 L 35 10 L 42 8 Z";

  // Divide Texas into 4 quadrants with clip paths
  const quadrants = [
    { clipPath: 'polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)', label: 'NW' },
    { clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)', label: 'NE' },
    { clipPath: 'polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)', label: 'SW' },
    { clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)', label: 'SE' },
  ];

  return (
    <div className="bg-bg2 border border-border rounded-xl p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            <h3 className="text-base font-black text-foreground">Deal Puzzle Challenge</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Close 4 deals to win the prize!</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Resets in
          </div>
          <div className="text-sm font-black text-asp-yellow tabular-nums">{hours}h {mins}m {secs}s</div>
        </div>
      </div>

      {/* Texas-shaped puzzle */}
      <div className="flex justify-center mb-3">
        <div className="relative w-40 h-40">
          {/* Base Texas outline (unfilled) */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <path d={texasPath} className="fill-bg3 stroke-border" strokeWidth="1" />
          </svg>

          {/* Filled quadrants */}
          {quadrants.map((q, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700"
              style={{ clipPath: q.clipPath, opacity: pieces[i] ? 1 : 0 }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id={`texas-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <path d={texasPath} fill={`url(#texas-grad-${i})`} stroke="hsl(var(--primary))" strokeWidth="1.5" />
              </svg>
            </div>
          ))}

          {/* Divider lines */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3,3" />
          </svg>

          {/* Question marks for unfilled pieces */}
          {quadrants.map((q, i) => !pieces[i] && (
            <div
              key={`q-${i}`}
              className="absolute text-muted-foreground/30 font-black text-lg flex items-center justify-center"
              style={{
                left: i % 2 === 0 ? '15%' : '60%',
                top: i < 2 ? '15%' : '60%',
                width: '25%',
                height: '25%',
              }}
            >
              ?
            </div>
          ))}

          {/* Stars for filled pieces */}
          {quadrants.map((q, i) => pieces[i] && (
            <div
              key={`s-${i}`}
              className="absolute text-primary flex items-center justify-center"
              style={{
                left: i % 2 === 0 ? '15%' : '60%',
                top: i < 2 ? '15%' : '60%',
                width: '25%',
                height: '25%',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">{completedCount}/4 pieces collected</div>
        <div className="mt-2 px-3 py-1.5 bg-asp-yellow/10 border border-asp-yellow/25 rounded-lg inline-flex items-center gap-2">
          <Gift className="w-4 h-4 text-asp-yellow" />
          <span className="text-xs font-bold text-asp-yellow">{currentGift}</span>
        </div>
      </div>
    </div>
  );
};

export default PuzzleGame;

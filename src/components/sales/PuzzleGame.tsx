import { useState, useEffect } from 'react';
import { Puzzle, Gift, Clock } from 'lucide-react';
import { PUZZLE_GIFTS } from '@/data/mockData';
import texasOutline from '@/assets/texas-outline.png';

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

  const gap = 3; // px gap between pieces

  // Quadrant clip paths with gap
  const quadrantStyles = [
    { clipPath: `inset(0 calc(50% + ${gap}px) calc(50% + ${gap}px) 0)` },
    { clipPath: `inset(0 0 calc(50% + ${gap}px) calc(50% + ${gap}px))` },
    { clipPath: `inset(calc(50% + ${gap}px) calc(50% + ${gap}px) 0 0)` },
    { clipPath: `inset(calc(50% + ${gap}px) 0 0 calc(50% + ${gap}px))` },
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
        <div className="relative w-44 h-44">
          {/* Dim base outline (always visible) */}
          <img
            src={texasOutline}
            alt="Texas outline"
            className="absolute inset-0 w-full h-full object-contain opacity-15"
          />

          {/* 4 puzzle pieces */}
          {quadrantStyles.map((style, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700"
              style={{
                ...style,
                opacity: pieces[i] ? 1 : 0.15,
              }}
            >
              <img
                src={texasOutline}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  filter: pieces[i]
                    ? 'brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(1500%) hue-rotate(200deg) brightness(1.2) drop-shadow(0 0 3px hsl(var(--primary))) drop-shadow(0 0 1px hsl(var(--primary)))'
                    : 'brightness(0.2) opacity(0.4)',
                }}
              />
            </div>
          ))}

          {/* Stars for filled pieces */}
          {quadrantStyles.map((_, i) => pieces[i] && (
            <div
              key={`s-${i}`}
              className="absolute text-primary flex items-center justify-center pointer-events-none"
              style={{
                left: i % 2 === 0 ? '10%' : '55%',
                top: i < 2 ? '10%' : '55%',
                width: '30%',
                height: '30%',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-primary drop-shadow-sm">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
              </svg>
            </div>
          ))}

          {/* Question marks for unfilled pieces */}
          {quadrantStyles.map((_, i) => !pieces[i] && (
            <div
              key={`q-${i}`}
              className="absolute text-muted-foreground/30 font-black text-lg flex items-center justify-center pointer-events-none"
              style={{
                left: i % 2 === 0 ? '10%' : '55%',
                top: i < 2 ? '10%' : '55%',
                width: '30%',
                height: '30%',
              }}
            >
              ?
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

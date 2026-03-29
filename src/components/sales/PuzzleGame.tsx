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

  // Clean Texas outline matching reference image — panhandle top-left, smooth curves
  const texasPath = "M 28 2 L 28 5 L 28 10 L 28 15 L 28 20 L 28 25 L 28 30 L 28 33 L 5 33 L 5 36 L 7 39 L 10 42 L 12 46 L 11 50 L 14 54 L 18 52 L 22 56 L 19 61 L 24 66 L 28 63 L 31 68 L 27 73 L 33 78 L 38 76 L 43 81 L 48 87 L 54 93 L 58 97 L 62 94 L 64 89 L 61 84 L 65 79 L 70 73 L 75 67 L 80 60 L 84 54 L 88 48 L 92 42 L 95 36 L 97 30 L 97 24 L 95 18 L 91 13 L 86 9 L 80 5 L 74 3 L 68 2 L 62 4 L 56 2 L 50 2 L 44 4 L 38 2 L 32 2 Z";

  // 4 separate piece paths — each is a quarter of Texas with a gap between them
  // We'll render 4 separate SVGs, each clipped to a quadrant with inset for gap
  const gapPx = 3; // gap in SVG units (percentage of viewBox)
  const quadrantClips = [
    // Top-left (panhandle area)
    `polygon(0% 0%, calc(50% - ${gapPx}px) 0%, calc(50% - ${gapPx}px) calc(50% - ${gapPx}px), 0% calc(50% - ${gapPx}px))`,
    // Top-right
    `polygon(calc(50% + ${gapPx}px) 0%, 100% 0%, 100% calc(50% - ${gapPx}px), calc(50% + ${gapPx}px) calc(50% - ${gapPx}px))`,
    // Bottom-left (Rio Grande)
    `polygon(0% calc(50% + ${gapPx}px), calc(50% - ${gapPx}px) calc(50% + ${gapPx}px), calc(50% - ${gapPx}px) 100%, 0% 100%)`,
    // Bottom-right (Gulf Coast)
    `polygon(calc(50% + ${gapPx}px) calc(50% + ${gapPx}px), 100% calc(50% + ${gapPx}px), 100% 100%, calc(50% + ${gapPx}px) 100%)`,
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
          {/* Full Texas outline stroke (always visible) */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <path d={texasPath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>

          {/* 4 puzzle pieces with gaps */}
          {quadrantClips.map((clip, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700"
              style={{ clipPath: clip, opacity: pieces[i] ? 1 : 0 }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id={`texas-piece-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d={texasPath} fill={`url(#texas-piece-${i})`} stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          ))}

          {/* Gap lines — thicker dark lines creating the puzzle split */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <clipPath id="texas-clip">
              <path d={texasPath} />
            </clipPath>
            <g clipPath="url(#texas-clip)">
              <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(var(--background))" strokeWidth="4" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--background))" strokeWidth="4" />
            </g>
          </svg>

          {/* Question marks for unfilled pieces */}
          {quadrantClips.map((_, i) => !pieces[i] && (
            <div
              key={`q-${i}`}
              className="absolute text-muted-foreground/40 font-black text-lg flex items-center justify-center"
              style={{
                left: i % 2 === 0 ? '12%' : '58%',
                top: i < 2 ? '12%' : '58%',
                width: '28%',
                height: '28%',
              }}
            >
              ?
            </div>
          ))}

          {/* Stars for filled pieces */}
          {quadrantClips.map((_, i) => pieces[i] && (
            <div
              key={`s-${i}`}
              className="absolute text-primary flex items-center justify-center"
              style={{
                left: i % 2 === 0 ? '12%' : '58%',
                top: i < 2 ? '12%' : '58%',
                width: '28%',
                height: '28%',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-primary">
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

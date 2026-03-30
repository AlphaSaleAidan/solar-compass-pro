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

  // Puzzle piece SVG paths — properly interlocking 2x2 grid
  // Each piece occupies a 50x50 base cell. Tabs extend 8px outward, blanks indent 8px inward.
  // Tab/blank centered at the midpoint (25) of each edge, width 14 (from 18 to 32).
  const T = 8; // tab depth
  const piecePaths = [
    // Top-left: flat top, flat left, tab RIGHT, tab BOTTOM
    `M0 0 H50 V18 C50 18, ${50+T} 18, ${50+T} 25 C${50+T} 32, 50 32, 50 32 V50 H32 C32 50, 32 ${50+T}, 25 ${50+T} C18 ${50+T}, 18 50, 18 50 H0 Z`,
    // Top-right: flat top, blank LEFT (matches TL tab), flat right, tab BOTTOM
    `M0 0 H50 V50 H32 C32 50, 32 ${50+T}, 25 ${50+T} C18 ${50+T}, 18 50, 18 50 H0 V32 C0 32, ${-T} 32, ${-T} 25 C${-T} 18, 0 18, 0 18 V0 Z`,
    // Bottom-left: blank TOP (matches TL tab), flat left, tab RIGHT, flat bottom
    `M0 0 H18 C18 0, 18 ${-T}, 25 ${-T} C32 ${-T}, 32 0, 32 0 H50 V18 C50 18, ${50+T} 18, ${50+T} 25 C${50+T} 32, 50 32, 50 32 V50 H0 Z`,
    // Bottom-right: blank TOP (matches TR tab), blank LEFT (matches BL tab), flat right, flat bottom
    `M0 0 H18 C18 0, 18 ${-T}, 25 ${-T} C32 ${-T}, 32 0, 32 0 H50 V50 H0 V32 C0 32, ${-T} 32, ${-T} 25 C${-T} 18, 0 18, 0 18 V0 Z`,
  ];

  // Position offsets — pieces with blanks need to align with neighboring tabs
  const positions = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: 50 },
    { x: 50, y: 50 },
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

      {/* Interlocking puzzle */}
      <div className="flex justify-center mb-3">
        <svg viewBox="-2 -2 108 108" className="w-40 h-40">
          <defs>
            <linearGradient id="piece-filled" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {piecePaths.map((path, i) => (
            <g key={i} transform={`translate(${positions[i].x}, ${positions[i].y})`}>
              <path
                d={path}
                fill={pieces[i] ? 'url(#piece-filled)' : 'hsl(var(--muted) / 0.15)'}
                stroke={pieces[i] ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth="1.5"
                className="transition-all duration-700"
              />
              {pieces[i] ? (
                <svg x="17" y="17" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
                    fill="hsl(var(--primary))"
                  />
                </svg>
              ) : (
                <text
                  x="25" y="30"
                  textAnchor="middle"
                  className="fill-muted-foreground/30 text-lg font-black"
                  fontSize="18"
                >
                  ?
                </text>
              )}
            </g>
          ))}
        </svg>
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

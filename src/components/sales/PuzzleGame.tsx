import { useState, useEffect } from 'react';
import { Puzzle, Gift, Clock, Trophy } from 'lucide-react';
import { PUZZLE_GIFTS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, PUZZLE_PRIZES, getSecondsUntilReset } from '@/hooks/useGamification';

const PuzzleGame = () => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const gamification = useGamification();

  // Demo state
  const [demoPieces, setDemoPieces] = useState([false, false, false, false]);
  const [timeLeft, setTimeLeft] = useState(() => getSecondsUntilReset());
  const [currentGiftIndex] = useState(() => Math.floor(Math.random() * PUZZLE_GIFTS.length));

  useEffect(() => {
    if (isDemo) setDemoPieces([true, true, false, false]);
  }, [isDemo]);

  // Live countdown to next 3-day cycle reset
  useEffect(() => {
    setTimeLeft(getSecondsUntilReset());
    const timer = setInterval(() => setTimeLeft(getSecondsUntilReset()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  // Determine pieces based on demo vs production
  const pieces = isDemo
    ? demoPieces
    : [
        gamification.state.puzzle_pieces >= 1,
        gamification.state.puzzle_pieces >= 2,
        gamification.state.puzzle_pieces >= 3,
        gamification.state.puzzle_pieces >= 4,
      ];

  const completedCount = pieces.filter(Boolean).length;
  const currentPrize = isDemo
    ? PUZZLE_GIFTS[currentGiftIndex]
    : gamification.currentPuzzlePrize.name;

  const T = 8;
  const piecePaths = [
    `M0 0 H50 V18 C50 18, ${50+T} 18, ${50+T} 25 C${50+T} 32, 50 32, 50 32 V50 H32 C32 50, 32 ${50+T}, 25 ${50+T} C18 ${50+T}, 18 50, 18 50 H0 Z`,
    `M0 0 H50 V50 H32 C32 50, 32 ${50+T}, 25 ${50+T} C18 ${50+T}, 18 50, 18 50 H0 V32 C0 32, ${-T} 32, ${-T} 25 C${-T} 18, 0 18, 0 18 V0 Z`,
    `M0 0 H18 C18 0, 18 ${-T}, 25 ${-T} C32 ${-T}, 32 0, 32 0 H50 V18 C50 18, ${50+T} 18, ${50+T} 25 C${50+T} 32, 50 32, 50 32 V50 H0 Z`,
    `M0 0 H18 C18 0, 18 ${-T}, 25 ${-T} C32 ${-T}, 32 0, 32 0 H50 V50 H0 V32 C0 32, ${-T} 32, ${-T} 25 C${-T} 18, 0 18, 0 18 V0 Z`,
  ];

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
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Close 4 deals to win the prize!
            {!isDemo && gamification.state.puzzle_cycle > 0 && (
              <span className="ml-1 text-primary font-bold">Cycle #{gamification.state.puzzle_cycle + 1}</span>
            )}
          </p>
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
        <svg viewBox="-10 -10 120 120" className="w-40 h-40">
          <defs>
            <linearGradient id="piece-filled" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {piecePaths.map((path, i) => (
            <g key={i} transform={`translate(${positions[i].x}, ${positions[i].y})`}>
              <path
                d={path}
                fill={pieces[i] ? 'url(#piece-filled)' : 'hsl(217 91% 60% / 0.08)'}
                stroke={pieces[i] ? 'hsl(217 91% 60%)' : 'hsl(217 91% 60% / 0.25)'}
                strokeWidth="1.5"
                className="transition-all duration-700"
              />
              {pieces[i] ? (
                <svg x="17" y="17" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
                    fill="hsl(217 91% 60%)"
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
          <span className="text-xs font-bold text-asp-yellow">{currentPrize}</span>
        </div>
        {!isDemo && gamification.state.puzzle_cycle > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-primary">
            <Trophy className="w-3 h-3" />
            <span>{gamification.state.puzzle_cycle} puzzle{gamification.state.puzzle_cycle !== 1 ? 's' : ''} completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame;

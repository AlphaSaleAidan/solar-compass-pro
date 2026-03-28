import { useState, useEffect } from 'react';
import { Puzzle, Gift, Zap, Clock } from 'lucide-react';
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

  // Puzzle piece SVG path for actual puzzle shape
  const puzzlePiecePath = (hasRight: boolean, hasBottom: boolean, hasLeft: boolean, hasTop: boolean) => {
    // Simple puzzle piece with tabs/blanks
    return `
      M 4 ${hasTop ? '0' : '0'}
      ${hasTop ? 'L 14 0 Q 17 -6 20 0 L 36 0' : 'L 36 0'}
      L 36 ${hasRight ? '14' : '0'}
      ${hasRight ? 'Q 42 17 36 20' : ''}
      L 36 36
      L ${hasBottom ? '22' : '36'} 36
      ${hasBottom ? 'Q 19 42 16 36 L 4 36' : 'L 4 36'}
      L 4 ${hasLeft ? '22' : '36'}
      ${hasLeft ? 'Q -2 19 4 16' : ''}
      Z
    `;
  };

  const pieceConfigs = [
    { right: true, bottom: true, left: false, top: false },
    { right: false, bottom: true, left: true, top: false },
    { right: true, bottom: false, left: false, top: true },
    { right: false, bottom: false, left: true, top: true },
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

      <div className="flex items-center gap-1 mb-3">
        <div className="grid grid-cols-2 gap-0 w-36 h-36 mx-auto">
          {pieces.map((filled, i) => {
            const cfg = pieceConfigs[i];
            return (
              <div key={i} className="relative w-[72px] h-[72px] flex items-center justify-center">
                <svg viewBox="-4 -8 48 52" className="w-full h-full">
                  <path
                    d={puzzlePiecePath(cfg.right, cfg.bottom, cfg.left, cfg.top)}
                    className={`transition-all duration-500 ${
                      filled
                        ? 'fill-primary/25 stroke-primary'
                        : 'fill-bg3 stroke-border'
                    }`}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {filled && (
                    <g transform="translate(14, 12)">
                      <path d="M4 0L5.5 5H11L6.5 8L8 13L4 10L0 13L1.5 8L-3 5H3Z" className="fill-primary" transform="scale(0.7)" />
                    </g>
                  )}
                  {!filled && (
                    <text x="18" y="20" textAnchor="middle" className="fill-muted-foreground/40 text-[14px] font-black">?</text>
                  )}
                </svg>
              </div>
            );
          })}
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

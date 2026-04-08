import { useState, useRef, useEffect, useCallback } from 'react';
import { SellProject } from '@/data/mockData';
import { Video, Mic, MicOff, ChevronRight, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react';

interface WelcomeCallProps {
  project: SellProject;
  onComplete: (answers: WelcomeCallAnswer[]) => void;
  onClose: () => void;
}

export interface WelcomeCallAnswer {
  questionIndex: number;
  question: string;
  answer: string;
  correct?: boolean;
}

const MONTHLY_PAYMENT = '$189'; // Mock Aurora data
const ANNUAL_PRODUCTION = '12,400'; // Mock Aurora kWh

const QUESTIONS = [
  {
    text: 'Do you understand that you are paying $0 for your upfront cost?',
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: `Do you understand that your initial monthly payment is ${MONTHLY_PAYMENT}?`,
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: 'Do you understand that your system is warrantied by the financier?',
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: 'Did you sign the agreement?',
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: 'Is there significant damage to the roof?',
    type: 'yesno' as const,
    correctAnswer: 'no',
  },
  {
    text: 'Do you understand that this agreement is for 25 years?',
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: 'Do you understand your agreement will never go up more than the following annually?',
    type: 'multichoice' as const,
    options: ['2.99%', '3.99%', '5.99%'],
    correctAnswer: '2.99%',
  },
  {
    text: 'Do you understand that the agreement is fully transferable?',
    type: 'yesno' as const,
    correctAnswer: 'yes',
  },
  {
    text: 'Were any false promises made to you?',
    type: 'yesno' as const,
    correctAnswer: 'no',
  },
  {
    text: `We are producing ${ANNUAL_PRODUCTION} kWh annually here at the property. Please enter your annual expected usage to make sure we can help you.`,
    type: 'text' as const,
  },
];

const WelcomeCall = ({ project, onComplete, onClose }: WelcomeCallProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<WelcomeCallAnswer[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera for front-facing view
  useEffect(() => {
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsRecording(true);
      } catch {
        console.log('Camera not available - continuing without video');
      }
    };
    startCam();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Mock AI voice reading question
  useEffect(() => {
    if (currentQ < QUESTIONS.length && !showComplete) {
      setSpeaking(true);
      const timer = setTimeout(() => setSpeaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQ, showComplete]);

  const handleAnswer = useCallback((answer: string) => {
    const q = QUESTIONS[currentQ];
    const newAnswer: WelcomeCallAnswer = {
      questionIndex: currentQ,
      question: q.text,
      answer,
      correct: q.type === 'text' ? undefined : answer.toLowerCase() === q.correctAnswer?.toLowerCase(),
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentQ + 1 >= QUESTIONS.length) {
      setShowComplete(true);
    } else {
      setCurrentQ(prev => prev + 1);
    }
    setTextInput('');
  }, [currentQ, answers]);

  const handleFinish = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onComplete(answers);
  };

  const q = QUESTIONS[currentQ];
  const wrongAnswers = answers.filter(a => a.correct === false);

  if (showComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[hsl(210,20%,8%)] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-[hsl(150,60%,50%)] mx-auto" />
            <h2 className="text-xl font-black text-white">Welcome Call Complete</h2>
            <p className="text-sm text-white/50">{project.firstName} {project.lastName}</p>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-white/40 font-bold tracking-wider uppercase">Answer Summary</div>
            {answers.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 bg-white/[0.03] rounded-lg">
                {a.correct === undefined ? (
                  <span className="text-primary mt-0.5"></span>
                ) : a.correct ? (
                  <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[hsl(0,70%,55%)] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-white/60">Q{i + 1}: {a.question.substring(0, 60)}...</div>
                  <div className="text-white font-bold">{a.answer}</div>
                </div>
              </div>
            ))}
          </div>

          {wrongAnswers.length > 0 && (
            <div className="p-3 bg-[hsl(0,70%,55%)]/10 border border-[hsl(0,70%,55%)]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[hsl(0,70%,55%)] text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {wrongAnswers.length} incorrect answer(s) — flagged for review
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-white/60 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black"
            >
              Save & Upload Recording
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-[hsl(0,70%,55%)] animate-pulse' : 'bg-white/20'}`} />
          <span className="text-white font-bold text-sm">Welcome Call — {project.firstName} {project.lastName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs">Q {currentQ + 1} / {QUESTIONS.length}</span>
          <button onClick={onClose} className="px-3 py-1.5 bg-[hsl(0,70%,50%)] rounded-lg text-white text-xs font-bold">
            End Call
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Camera preview */}
        <div className="lg:w-1/3 relative rounded-xl overflow-hidden bg-[hsl(210,20%,8%)] border border-white/10">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center bg-[hsl(210,20%,8%)]">
              <div className="text-center text-white/30">
                <Camera className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs">Camera unavailable</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${isRecording ? 'bg-[hsl(0,70%,50%)]/80 text-white' : 'bg-white/10 text-white/40'}`}>
              <Video className="w-3 h-3" /> {isRecording ? 'REC' : 'OFF'}
            </div>
          </div>
        </div>

        {/* Question area */}
        <div className="lg:w-2/3 flex flex-col justify-center">
          {/* AI Voice indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full bg-primary/20 border-2 ${speaking ? 'border-primary animate-pulse' : 'border-white/10'} flex items-center justify-center`}>
              {speaking ? <Mic className="w-5 h-5 text-primary" /> : <MicOff className="w-5 h-5 text-white/30" />}
            </div>
            <div>
              <div className="text-xs text-white/40 font-bold">ASP AI Assistant</div>
              <div className="text-[10px] text-white/20">{speaking ? 'Speaking...' : 'Waiting for response'}</div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="text-xs text-primary font-bold mb-2">Question {currentQ + 1}</div>
            <h2 className="text-xl font-black text-white leading-relaxed">{q.text}</h2>
          </div>

          {/* Answer options */}
          <div className="space-y-3">
            {q.type === 'yesno' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAnswer('Yes')}
                  className="flex-1 py-4 bg-[hsl(150,60%,50%)]/10 border border-[hsl(150,60%,50%)]/30 rounded-xl text-[hsl(150,60%,50%)] text-sm font-black hover:bg-[hsl(150,60%,50%)]/20 transition-all active:scale-[0.98]"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer('No')}
                  className="flex-1 py-4 bg-[hsl(0,70%,55%)]/10 border border-[hsl(0,70%,55%)]/30 rounded-xl text-[hsl(0,70%,55%)] text-sm font-black hover:bg-[hsl(0,70%,55%)]/20 transition-all active:scale-[0.98]"
                >
                  No
                </button>
              </div>
            )}

            {q.type === 'multichoice' && q.options?.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="w-full py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/[0.08] hover:border-primary/30 transition-all active:scale-[0.98] text-left px-5"
              >
                {opt}
              </button>
            ))}

            {q.type === 'text' && (
              <div className="flex gap-3">
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Enter annual expected usage (kWh)..."
                  className="flex-1 px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={() => textInput.trim() && handleAnswer(textInput.trim())}
                  disabled={!textInput.trim()}
                  className="px-6 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCall;

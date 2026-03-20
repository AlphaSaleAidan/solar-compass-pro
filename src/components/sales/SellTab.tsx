import { useState, useEffect, useRef } from 'react';
import { INSTALLED_HOMES } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SellTab = () => {
  const [address, setAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [mapCity, setMapCity] = useState<'houston' | 'corpus'>('houston');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [newProject, setNewProject] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    highBill: '', lowBill: '', allElectric: true,
  });
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  const hour = new Date().getHours();
  const isDaytime = hour >= 9 && hour < 21;

  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.download = `site-survey-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const filteredHomes = INSTALLED_HOMES.filter(h =>
    mapCity === 'houston' ? h.address.includes('Houston') : h.address.includes('Corpus Christi')
  );

  return (
    <div className="relative min-h-[calc(100vh-58px)] overflow-hidden">
      {/* Animated rainforest background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 ${isDaytime ? 'bg-gradient-to-br from-emerald-900/90 via-green-800/85 to-teal-900/90' : 'bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-emerald-950/95'}`} />
        {/* Animated leaves */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl opacity-20 animate-pulse"
              style={{
                left: `${(i * 8.5) % 100}%`,
                top: `${(i * 13.7) % 100}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + (i % 3)}s`,
                transform: `rotate(${i * 30}deg)`,
              }}
            >
              🌿
            </div>
          ))}
          {isDaytime ? (
            <>
              {[...Array(6)].map((_, i) => (
                <div
                  key={`sun-${i}`}
                  className="absolute w-1 rounded-full bg-yellow-300/20 animate-pulse"
                  style={{
                    left: `${15 + i * 14}%`,
                    top: 0,
                    height: `${40 + i * 10}%`,
                    animationDelay: `${i * 0.6}s`,
                    animationDuration: `${4 + i}s`,
                  }}
                />
              ))}
              <div className="absolute top-4 right-16 text-6xl opacity-30 animate-pulse">☀️</div>
            </>
          ) : (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={`rain-${i}`}
                  className="absolute w-px bg-blue-300/30"
                  style={{
                    left: `${(i * 5.2) % 100}%`,
                    top: `-10%`,
                    height: '120%',
                    animation: `rainDrop ${1.5 + (i % 3) * 0.5}s linear infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Quick action bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-3">
        <a
          href="https://app.aurorasolar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs font-bold hover:bg-white/20 transition-all duration-150 active:scale-[0.97]"
        >
          ☀️ Aurora Solar
        </a>
        <Dialog open={showMap} onOpenChange={setShowMap}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs font-bold hover:bg-white/20 transition-all duration-150 active:scale-[0.97]">
              🗺️ Installed Homes Map
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-bg2 border-border">
            <DialogHeader>
              <DialogTitle className="text-white font-black">🗺️ Installed Homes Map</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMapCity('houston')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${mapCity === 'houston' ? 'bg-primary text-primary-foreground' : 'bg-bg3 text-muted-foreground border border-border'}`}
                >
                  Houston ({INSTALLED_HOMES.filter(h => h.address.includes('Houston')).length} homes)
                </button>
                <button
                  onClick={() => setMapCity('corpus')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${mapCity === 'corpus' ? 'bg-primary text-primary-foreground' : 'bg-bg3 text-muted-foreground border border-border'}`}
                >
                  Corpus Christi ({INSTALLED_HOMES.filter(h => h.address.includes('Corpus')).length} homes)
                </button>
              </div>
              <div className="bg-bg3 rounded-xl p-4 max-h-[400px] overflow-y-auto space-y-2">
                {filteredHomes.map((home, i) => (
                  <div key={i} className="bg-bg4 rounded-lg p-3 border border-border hover:border-primary/40 transition-all duration-150">
                    <div className="text-sm font-bold text-white">{home.customer}</div>
                    <div className="text-xs text-muted-foreground">{home.address}</div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>⚡ {home.systemSize}</span>
                      <span>📅 {home.installDate}</span>
                      <span>📍 {home.lat.toFixed(4)}, {home.lng.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs font-bold hover:bg-white/20 transition-all duration-150 active:scale-[0.97]"
        >
          📷 Site Survey Camera
        </button>
      </div>

      {/* Camera view */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <span className="text-white font-bold text-sm">📷 Site Survey Camera</span>
            <div className="flex gap-2">
              <button onClick={capturePhoto} className="px-4 py-2 bg-primary rounded-lg text-primary-foreground text-xs font-bold active:scale-[0.97]">
                📸 Capture
              </button>
              <button onClick={stopCamera} className="px-4 py-2 bg-asp-red rounded-lg text-white text-xs font-bold active:scale-[0.97]">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full" />
          </div>
          <div className="p-4 bg-black/80 text-center">
            <p className="text-white/60 text-xs">Point camera at roof to measure rafter spacing. Use grid overlay for pitch estimation.</p>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6">
        {!showNewProjectForm ? (
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              Create New Project
            </h1>
            <div className="max-w-lg mx-auto">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Site Address here..."
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl text-white placeholder:text-white/40 text-center text-lg font-semibold outline-none focus:border-primary focus:bg-white/15 transition-all duration-200"
              />
            </div>
            <button
              onClick={() => { if (address.trim()) setShowNewProjectForm(true); }}
              disabled={!address.trim()}
              className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-black text-sm tracking-wide hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] shadow-lg shadow-primary/25"
            >
              Start Project →
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-black/40 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-white">📋 New Project Details</h2>
              <button onClick={() => setShowNewProjectForm(false)} className="text-white/40 hover:text-white text-sm">✕</button>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-xs text-white/60">
              <strong className="text-primary">📍 Address:</strong> {address}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'First Name', key: 'firstName', type: 'text' },
                { label: 'Last Name', key: 'lastName', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'High Bill ($)', key: 'highBill', type: 'number' },
                { label: 'Low Bill ($)', key: 'lowBill', type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-white/50 font-bold tracking-wider uppercase block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={newProject[field.key as keyof typeof newProject] as string}
                    onChange={(e) => setNewProject({ ...newProject, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/50 font-bold">All Electric?</label>
              <button
                onClick={() => setNewProject({ ...newProject, allElectric: !newProject.allElectric })}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all duration-150 active:scale-[0.97] ${newProject.allElectric ? 'bg-asp-green/15 text-asp-green border-asp-green/30' : 'bg-bg3 text-muted-foreground border-border'}`}
              >
                {newProject.allElectric ? 'Yes' : 'No'}
              </button>
            </div>

            {/* Customer Checklist */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-white/50 font-bold tracking-wider uppercase mb-2">Customer Checklist</div>
              <div className="space-y-1.5 text-xs text-white/60">
                <div>☐ 1st — Credit Passes</div>
                <div>☐ 2nd — Finance Docs Signed</div>
                <div>☐ 3rd — Welcome Call Completed</div>
                <div>☐ 4th — Site Survey Done</div>
                <div>☐ 5th — ASP Onboarding</div>
              </div>
            </div>

            <button
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm tracking-wide hover:bg-primary/90 transition-all duration-150 active:scale-[0.97] shadow-lg shadow-primary/25"
            >
              🚀 Create Project & Sync to Aurora
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rainDrop {
          0% { transform: translateY(-10%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SellTab;

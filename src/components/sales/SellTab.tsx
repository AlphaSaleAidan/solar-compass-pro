import { useState, useEffect, useRef } from 'react';
import { INSTALLED_HOMES, SELL_PROJECTS, SellProject, CreditStatus, APPOINTMENTS } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InstalledHomesMap from '@/components/sales/InstalledHomesMap';
import SellProjectCard from '@/components/sales/SellProjectCard';

interface SellTabProps {
  convertedAppointment?: typeof APPOINTMENTS[0] | null;
  onConvertHandled?: () => void;
}

const SellTab = ({ convertedAppointment, onConvertHandled }: SellTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'projects'>('create');
  const [projectFilter, setProjectFilter] = useState<CreditStatus | 'all'>('all');
  const [projects, setProjects] = useState<SellProject[]>(SELL_PROJECTS);
  const [address, setAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [newProject, setNewProject] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    highBill: '', lowBill: '', allElectric: true,
  });
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  // Auto-fill from converted appointment
  useEffect(() => {
    if (convertedAppointment) {
      const nameParts = convertedAppointment.name.split(' ');
      setNewProject({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: convertedAppointment.email,
        phone: convertedAppointment.phone,
        highBill: String(convertedAppointment.highBill),
        lowBill: String(convertedAppointment.lowBill),
        allElectric: convertedAppointment.allElectric,
      });
      setAddress(convertedAppointment.address);
      setShowNewProjectForm(true);
      setActiveSubTab('create');
      onConvertHandled?.();
    }
  }, [convertedAppointment]);

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

  const handleCreateProject = () => {
    if (!newProject.firstName.trim() || !address.trim()) return;
    const newP: SellProject = {
      id: `SP-${String(projects.length + 1).padStart(3, '0')}`,
      firstName: newProject.firstName,
      lastName: newProject.lastName,
      email: newProject.email,
      phone: newProject.phone,
      address,
      highBill: Number(newProject.highBill) || 0,
      lowBill: Number(newProject.lowBill) || 0,
      allElectric: newProject.allElectric,
      creditStatus: 'new',
      createdAt: new Date().toISOString().split('T')[0],
      checklist: { creditPassed: false, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
      documents: [
        { name: 'ASP Agreement', sent: false, signed: false },
        { name: 'Installer Contract', sent: false, signed: false },
        { name: 'Loan Authorization', sent: false, signed: false },
        { name: 'Welcome Call Email', sent: false, signed: false },
      ],
      surveyPhotos: [],
    };
    setProjects(prev => [newP, ...prev]);
    setShowNewProjectForm(false);
    setAddress('');
    setNewProject({ firstName: '', lastName: '', email: '', phone: '', highBill: '', lowBill: '', allElectric: true });
    setActiveSubTab('projects');
    setProjectFilter('new');
  };

  const filteredProjects = projectFilter === 'all'
    ? projects
    : projects.filter(p => p.creditStatus === projectFilter);

  const statusCounts = {
    all: projects.length,
    new: projects.filter(p => p.creditStatus === 'new').length,
    credit_passed: projects.filter(p => p.creditStatus === 'credit_passed').length,
    credit_fail: projects.filter(p => p.creditStatus === 'credit_fail').length,
  };

  return (
    <div className="relative min-h-[calc(100vh-58px)] overflow-hidden">
      {/* Underwater ocean background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,80%,12%)] via-[hsl(195,75%,18%)] to-[hsl(210,70%,8%)]" />
        {/* Sunrays from above */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={`ray-${i}`}
              className="absolute top-0 opacity-[0.07]"
              style={{
                left: `${8 + i * 12}%`,
                width: `${3 + (i % 3)}%`,
                height: '100%',
                background: `linear-gradient(180deg, hsla(185, 60%, 70%, 0.6) 0%, hsla(195, 70%, 50%, 0.15) 50%, transparent 85%)`,
                transform: `rotate(${-4 + i * 1.2}deg)`,
                transformOrigin: 'top center',
                animation: `rayShimmer ${6 + i * 0.8}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
          {/* Caustic light patterns */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`caustic-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${(i * 7.3) % 95}%`,
                top: `${(i * 11.2 + 20) % 80}%`,
                width: `${30 + (i % 5) * 15}px`,
                height: `${30 + (i % 5) * 15}px`,
                background: `radial-gradient(circle, hsla(185, 60%, 65%, 0.12) 0%, transparent 70%)`,
                animation: `causticFloat ${4 + (i % 4) * 1.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
          {/* Floating particles / bubbles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`bubble-${i}`}
              className="absolute rounded-full border border-white/10 bg-white/[0.03]"
              style={{
                left: `${(i * 8.5) % 100}%`,
                bottom: `-5%`,
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                animation: `bubbleRise ${8 + (i % 5) * 2}s linear infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick action bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
        <a
          href="https://app.aurorasolar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]"
        >
          ☀️ Aurora Solar
        </a>
        <Dialog open={showMap} onOpenChange={setShowMap}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]">
              🗺️ Installed Homes Map
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] bg-[hsl(210,20%,10%)] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white font-black">🗺️ Installed Homes Map</DialogTitle>
            </DialogHeader>
            <InstalledHomesMap homes={INSTALLED_HOMES} />
          </DialogContent>
        </Dialog>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]"
        >
          📷 Site Survey Camera
        </button>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${
              activeSubTab === 'create'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            ✦ Create
          </button>
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${
              activeSubTab === 'projects'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            📁 Projects ({projects.length})
          </button>
        </div>
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
              <button onClick={stopCamera} className="px-4 py-2 bg-[hsl(0,70%,50%)] rounded-lg text-white text-xs font-bold active:scale-[0.97]">
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
      <div className="relative z-10">
        {activeSubTab === 'create' ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6">
            {!showNewProjectForm ? (
              <div className="text-center space-y-6">
                <h1 className="text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 30px hsla(195, 70%, 50%, 0.4)' }}>
                  Create New Project
                </h1>
                <div className="max-w-lg mx-auto">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter Site Address here..."
                    className="w-full px-6 py-4 bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder:text-white/30 text-center text-lg font-semibold outline-none focus:border-primary focus:bg-white/10 transition-all duration-200"
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
              <div className="w-full max-w-xl bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-black text-white">📋 New Project Details</h2>
                  <button onClick={() => setShowNewProjectForm(false)} className="text-white/40 hover:text-white text-sm">✕</button>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-3 text-xs text-white/60">
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
                      <label className="text-[10px] text-white/40 font-bold tracking-wider uppercase block mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={newProject[field.key as keyof typeof newProject] as string}
                        onChange={(e) => setNewProject({ ...newProject, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-white/40 font-bold">All Electric?</label>
                  <button
                    onClick={() => setNewProject({ ...newProject, allElectric: !newProject.allElectric })}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all duration-150 active:scale-[0.97] ${
                      newProject.allElectric
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-white/[0.04] text-white/40 border-white/10'
                    }`}
                  >
                    {newProject.allElectric ? 'Yes' : 'No'}
                  </button>
                </div>

                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-[10px] text-white/40 font-bold tracking-wider uppercase mb-2">Customer Checklist</div>
                  <div className="space-y-1.5 text-xs text-white/50">
                    <div>☐ 1st — Credit Passes</div>
                    <div>☐ 2nd — Finance Docs Signed</div>
                    <div>☐ 3rd — Welcome Call Completed</div>
                    <div>☐ 4th — Site Survey Done</div>
                    <div>☐ 5th — ASP Onboarding</div>
                  </div>
                </div>

                <button
                  onClick={handleCreateProject}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm tracking-wide hover:bg-primary/90 transition-all duration-150 active:scale-[0.97] shadow-lg shadow-primary/25"
                >
                  🚀 Create Project & Sync to Aurora
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Projects subtab */
          <div className="p-6 space-y-4">
            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All', color: 'white' },
                { key: 'new', label: 'New', color: 'hsl(var(--primary))' },
                { key: 'credit_passed', label: 'Credit Passed', color: 'hsl(150, 60%, 50%)' },
                { key: 'credit_fail', label: 'Credit Fail', color: 'hsl(0, 70%, 55%)' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setProjectFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${
                    projectFilter === f.key
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                >
                  {f.label} ({statusCounts[f.key]})
                </button>
              ))}
            </div>

            {/* Project list */}
            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-sm font-bold">
                  No projects in this category
                </div>
              ) : (
                filteredProjects.map(p => (
                  <SellProjectCard
                    key={p.id}
                    project={p}
                    onStartCamera={startCamera}
                    onUpdateProject={(updated) => setProjects(prev => prev.map(pr => pr.id === updated.id ? updated : pr))}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rayShimmer {
          0% { opacity: 0.04; transform: rotate(var(--base-rotate, 0deg)) scaleX(1); }
          100% { opacity: 0.1; transform: rotate(var(--base-rotate, 0deg)) scaleX(1.3); }
        }
        @keyframes causticFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 0.08; }
          100% { transform: translate(15px, -10px) scale(1.4); opacity: 0.15; }
        }
        @keyframes bubbleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          80% { opacity: 0.2; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SellTab;

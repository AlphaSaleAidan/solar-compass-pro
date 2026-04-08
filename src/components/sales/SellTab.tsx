import { useState, useEffect, useRef } from 'react';
import { INSTALLED_HOMES, type SellProject, type CreditStatus } from '@/data/mockData';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InstalledHomesMap from '@/components/sales/InstalledHomesMap';
import SellProjectCard from '@/components/sales/SellProjectCard';
import { Crown, Map, Camera, Plus, FolderOpen, Sun, Battery, Phone, Mail, User, DollarSign, FileText } from 'lucide-react';

interface SellTabProps {
  initialProjectData?: { name: string; email: string; phone: string; address: string } | null;
}

const SellTab = ({ initialProjectData }: SellTabProps) => {
  const { sellProjects, updateSellProject, addSellProject } = useDataSource();
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'projects'>('create');
  const [projectFilter, setProjectFilter] = useState<CreditStatus | 'all'>('all');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    inputRef: addressInputRef,
    error: addressAutocompleteError,
    errorMessage: addressAutocompleteErrorMessage,
  } = useGooglePlaces((parsed) => {
    setAddress(parsed.fullAddress);
  });

  // Handle incoming project data from calendar conversion
  useEffect(() => {
    if (initialProjectData) {
      const names = initialProjectData.name.split(' ');
      setNewProject({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: initialProjectData.email,
        phone: initialProjectData.phone,
        highBill: '', lowBill: '', allElectric: true,
      });
      setAddress(initialProjectData.address);
      setShowNewProjectForm(true);
      setActiveSubTab('create');
    }
  }, [initialProjectData]);

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
    // Validate with Zod schemas
    const errors: Record<string, string> = {};
    if (!newProject.firstName.trim()) errors.firstName = 'First name is required';
    if (!newProject.lastName.trim()) errors.lastName = 'Last name is required';
    if (!address.trim()) errors.address = 'Address is required';
    if (newProject.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProject.email)) errors.email = 'Invalid email';
    if (newProject.phone && !/^[\d\s\-().+]*$/.test(newProject.phone)) errors.phone = 'Invalid phone format';
    const highBill = Number(newProject.highBill) || 0;
    const lowBill = Number(newProject.lowBill) || 0;
    if (highBill <= 0) errors.highBill = 'High bill is required';
    if (lowBill > highBill) errors.lowBill = 'Must be less than high bill';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
    const newP: SellProject = {
      id: `SP-${String(sellProjects.length + 1).padStart(3, '0')}`,
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

    addSellProject(newP);
    setShowNewProjectForm(false);
    setAddress('');
    setNewProject({ firstName: '', lastName: '', email: '', phone: '', highBill: '', lowBill: '', allElectric: true });
    setActiveSubTab('projects');
    setProjectFilter('new');
  };

  const filteredProjects = projectFilter === 'all'
    ? sellProjects
    : sellProjects.filter(p => p.creditStatus === projectFilter);

  const statusCounts = {
    all: sellProjects.length,
    new: sellProjects.filter(p => p.creditStatus === 'new').length,
    credit_passed: sellProjects.filter(p => p.creditStatus === 'credit_passed').length,
    credit_fail: sellProjects.filter(p => p.creditStatus === 'credit_fail').length,
  };

  // Sold deals data (simulated from credit_passed projects)
  const soldDeals = sellProjects.filter(p => p.creditStatus === 'credit_passed').map(p => ({
    ...p,
    systemSize: `${(8 + Math.random() * 5).toFixed(1)} kW`,
    ppw: (4.0 + Math.random() * 0.5).toFixed(2),
    financier: ['GoodLeap', 'Sunlight Financial', 'Mosaic'][Math.floor(Math.random() * 3)],
    battery: 'Duracell 20kW',
    terms: '25 year @ 2.99%',
  }));

  return (
    <div className="relative min-h-[calc(100vh-58px)] overflow-hidden">
      {/* No local background — global CinematicBackground (3D blue sphere + planets) shows through */}

      {/* Quick action bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
        <a
          href="https://app.aurorasolar.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]"
        >
          <Sun className="w-3.5 h-3.5" /> Aurora Solar
        </a>
        <Dialog open={showMap} onOpenChange={setShowMap}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]">
              <Map className="w-3.5 h-3.5" /> Installed Homes Map
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] bg-[hsl(210,20%,10%)] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white font-black flex items-center gap-2"><Map className="w-4 h-4" /> Installed Homes Map</DialogTitle>
            </DialogHeader>
            {showMap && <InstalledHomesMap homes={INSTALLED_HOMES} />}
          </DialogContent>
        </Dialog>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-lg text-white/80 text-xs font-bold hover:bg-white/10 transition-all duration-150 active:scale-[0.97]"
        >
          <Camera className="w-3.5 h-3.5" /> Site Survey Camera
        </button>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setActiveSubTab('projects')}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-1.5 bg-[hsl(var(--teal))] text-white"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Projects ({sellProjects.length})
          </button>
        </div>
      </div>

      {/* Camera view */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <span className="text-white font-bold text-sm flex items-center gap-2"><Camera className="w-4 h-4" /> Site Survey Camera</span>
            <div className="flex gap-2">
              <button onClick={capturePhoto} className="px-4 py-2 bg-primary rounded-lg text-primary-foreground text-xs font-bold active:scale-[0.97]">
                Capture
              </button>
              <button onClick={stopCamera} className="px-4 py-2 bg-[hsl(0,70%,50%)] rounded-lg text-white text-xs font-bold active:scale-[0.97]">
                Close
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
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter Site Address here..."
                    className="w-full px-6 py-4 bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder:text-white/30 text-center text-lg font-semibold outline-none focus:border-primary focus:bg-white/10 transition-all duration-200"
                  />
                  {addressAutocompleteError && (
                    <p className="mt-2 text-xs text-white/60">
                      Address autocomplete is temporarily unavailable. You can still type the full address manually.
                      {addressAutocompleteErrorMessage?.includes('Invalid Google Maps API key format') && ' Please update your Google Maps API key.'}
                    </p>
                  )}
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
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" /> New Project Details
                  </h2>
                  <button onClick={() => setShowNewProjectForm(false)} className="text-white/40 hover:text-white text-sm">✕</button>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-3 text-xs text-white/60 flex items-center gap-2">
                  <Map className="w-3.5 h-3.5 text-primary" />
                  <strong className="text-primary">Address:</strong> {address}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Name', key: 'firstName', type: 'text', required: true },
                    { label: 'Last Name', key: 'lastName', type: 'text', required: true },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone', type: 'tel' },
                    { label: 'High Bill ($)', key: 'highBill', type: 'number', required: true },
                    { label: 'Low Bill ($)', key: 'lowBill', type: 'number' },
                  ].map((field) => {
                    const val = newProject[field.key as keyof typeof newProject] as string;
                    const err = fieldErrors[field.key];
                    return (
                      <div key={field.key}>
                        <label className="text-[10px] text-white/40 font-bold tracking-wider uppercase block mb-1">
                          {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                        </label>
                        <input
                          type={field.type}
                          value={val}
                          onChange={(e) => {
                            setNewProject({ ...newProject, [field.key]: e.target.value });
                            if (fieldErrors[field.key]) setFieldErrors(prev => { const n = { ...prev }; delete n[field.key]; return n; });
                          }}
                          className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-sm text-white outline-none transition-colors ${
                            err ? 'border-red-400/60 focus:border-red-400' : 'border-white/10 focus:border-primary'
                          }`}
                        />
                        {err && <p className="text-[9px] text-red-400 mt-0.5">{err}</p>}
                      </div>
                    );
                  })}
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

                {/* Documents section including Welcome Call */}
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-[10px] text-white/40 font-bold tracking-wider uppercase mb-2">Documents</div>
                  <div className="space-y-1.5 text-xs text-white/50">
                    <div className="flex items-center gap-2"><FileText className="w-3 h-3" /> ASP Agreement</div>
                    <div className="flex items-center gap-2"><FileText className="w-3 h-3" /> Installer Contract</div>
                    <div className="flex items-center gap-2"><FileText className="w-3 h-3" /> Loan Authorization</div>
                    <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-primary" /> Welcome Call Email (via DocuSign)</div>
                  </div>
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
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm tracking-wide hover:bg-primary/90 transition-all duration-150 active:scale-[0.97] shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" /> Create Project & Sync to Aurora
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
                { key: 'all', label: 'All' },
                { key: 'new', label: 'New' },
                { key: 'credit_passed', label: 'Credit Passed' },
                { key: 'credit_fail', label: 'Credit Fail' },
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
                    onUpdateProject={(updated) => updateSellProject(updated)}
                  />
                ))
              )}
            </div>

            {/* Sold Deals Summary */}
            {soldDeals.length > 0 && (
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-asp-green" />
                  <h3 className="text-sm font-black text-white">Sold Deals Summary</h3>
                </div>
                <div className="space-y-2">
                  {soldDeals.map(deal => (
                    <div key={deal.id} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-bold text-white">{deal.firstName} {deal.lastName}</span>
                        </div>
                        <span className="text-[10px] text-asp-green font-bold px-2 py-0.5 bg-asp-green/10 rounded border border-asp-green/20">SOLD</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">System</div>
                          <div className="text-white font-bold">{deal.systemSize}</div>
                        </div>
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">PPW</div>
                          <div className="text-white font-bold">${deal.ppw}</div>
                        </div>
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">Financier</div>
                          <div className="text-white font-bold">{deal.financier}</div>
                        </div>
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">Battery</div>
                          <div className="text-white font-bold flex items-center gap-1"><Battery className="w-3 h-3" />{deal.battery}</div>
                        </div>
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">Terms</div>
                          <div className="text-white font-bold">{deal.terms}</div>
                        </div>
                        <div>
                          <div className="text-white/40 font-bold uppercase text-[9px]">Contact</div>
                          <div className="text-white font-bold flex items-center gap-1"><Phone className="w-3 h-3" />{deal.phone}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Old ocean CSS animations removed — now using global 3D scene */}
    </div>
  );
};

export default SellTab;

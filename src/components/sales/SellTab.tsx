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
...
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
                      {addressAutocompleteErrorMessage?.includes('Invalid Google Maps API key format') && ' Please update your Google Maps API key format.'}
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

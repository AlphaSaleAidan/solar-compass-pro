import { useState } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import type { SellProject } from '@/data/mockData';
import { Zap, CheckCircle, ShieldCheck, XCircle, AlertTriangle, ChevronDown, ChevronUp, Sun, User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { resolveAuroraData } from '@/lib/auroraDataResolver';

const QCReview = () => {
  const { sellProjects, updateSellProject } = useDataSource();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dirtyNotes, setDirtyNotes] = useState<Record<string, string>>({});

  // Action ASAP: Projects that have been converted to sale but NOT yet QC approved
  const pendingQC = sellProjects.filter(
    p => p.convertedToSale && !p.qcInitialApproved && p.approvalStatus === 'pending'
  );

  // Recently reviewed
  const recentlyReviewed = sellProjects.filter(
    p => p.convertedToSale && p.qcInitialApproved
  ).slice(0, 5);

  const handleApproveInitialQC = (project: SellProject) => {
    // Approve the initial QC — triggers docs to be sent
    updateSellProject({
      ...project,
      qcInitialApproved: true,
      approvalStatus: undefined, // Reset so it's not "pending" for final anymore
      // Auto-populate documents for signing
      documents: [
        { name: 'ASP TPO Agreement', sent: true, signed: false },
        { name: 'Installer Contract', sent: true, signed: false },
      ],
    });
    toast.success(`QC Approved — ASP documents sent to ${project.firstName} ${project.lastName}`);
  };

  const handleRejectInitialQC = (project: SellProject) => {
    const notes = dirtyNotes[project.id] || 'QC review failed — corrections required';
    updateSellProject({
      ...project,
      approvalStatus: 'dirty',
      approvalNotes: notes,
      convertedToSale: false, // Reset back so rep can fix and re-convert
    });
    toast.error(`Deal returned to ${project.firstName} ${project.lastName} — marked dirty`);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" /> Action ASAP
      </h2>
      <p className="text-xs text-muted-foreground -mt-3">
        Incoming deals from Sales Reps requiring immediate QC review before documents are sent to homeowners.
      </p>

      {/* Pending QC queue */}
      <div className="space-y-3">
        {pendingQC.map((p) => {
          const isExpanded = expandedId === p.id;
          const resolved = p.auroraData ? resolveAuroraData(p.auroraData) : null;

          return (
            <div
              key={p.id}
              className="bg-bg2 border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="px-2 py-0.5 bg-[hsl(45,80%,55%)]/15 text-[hsl(45,80%,55%)] border border-[hsl(45,80%,55%)]/30 rounded-full text-[10px] font-extrabold uppercase">
                      Verify
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{p.id}</div>
                </div>
                <div className="text-white/30 text-sm">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Contact & Address */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> <span className="text-foreground">{p.email}</span></div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> <span className="text-foreground">{p.phone}</span></div>
                    <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3 h-3 text-muted-foreground" /> <span className="text-foreground">{p.address}</span></div>
                  </div>

                  {/* Aurora System Data */}
                  {resolved && (
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Aurora System Data</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">System:</span> <span className="text-foreground font-bold">{resolved.systemSize || '—'}</span></div>
                        <div><span className="text-muted-foreground">Battery:</span> <span className="text-foreground font-bold">{resolved.battery || '—'}</span></div>
                        <div><span className="text-muted-foreground">Financier:</span> <span className="text-primary font-bold">{resolved.financier || '—'}</span></div>
                        <div><span className="text-muted-foreground">Monthly:</span> <span className="text-foreground font-bold">{resolved.monthlyPayment || '—'}</span></div>
                      </div>
                      {resolved.adders && resolved.adders.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Adders:</span>{' '}
                          <span className="text-foreground">{resolved.adders.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bill info */}
                  <div className="bg-background/50 rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Utility Info</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground">High Bill:</span> <span className="text-foreground font-bold">${p.highBill}</span></div>
                      <div><span className="text-muted-foreground">Low Bill:</span> <span className="text-foreground font-bold">${p.lowBill}</span></div>
                      <div><span className="text-muted-foreground">All Electric:</span> <span className="text-foreground font-bold">{p.allElectric ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  {/* Dirty notes input */}
                  <div>
                    <textarea
                      placeholder="If rejecting, describe issues here..."
                      value={dirtyNotes[p.id] || ''}
                      onChange={(e) => setDirtyNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveInitialQC(p)}
                      className="flex-1 py-2.5 bg-[hsl(150,60%,50%)] text-black rounded-lg text-xs font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Approve & Send Docs
                    </button>
                    <button
                      onClick={() => handleRejectInitialQC(p)}
                      className="flex-1 py-2.5 bg-[hsl(0,70%,55%)]/15 text-[hsl(0,70%,55%)] border border-[hsl(0,70%,55%)]/30 rounded-lg text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Mark Dirty
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {pendingQC.length === 0 && (
          <div className="bg-bg2 border border-border rounded-xl p-12 text-center">
            <CheckCircle className="w-10 h-10 text-[hsl(150,60%,50%)] mx-auto" />
            <p className="text-muted-foreground mt-3">No incoming deals — you're all caught up!</p>
          </div>
        )}
      </div>

      {/* Recently reviewed */}
      {recentlyReviewed.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-white/60 mb-3">Recently Approved</h3>
          <div className="space-y-2">
            {recentlyReviewed.map(p => (
              <div key={p.id} className="bg-bg2/50 border border-border/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{p.firstName} {p.lastName}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{p.address}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[hsl(150,60%,50%)]/15 text-[hsl(150,60%,50%)]">
                  ✓ Docs Sent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QCReview;

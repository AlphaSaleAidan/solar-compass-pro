import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SellProject } from '@/data/mockData';
import { resolveAuroraData, verifyAuroraData, type ResolvedAuroraData, type DataVerificationResult } from '@/lib/auroraDataResolver';
import { Sun, Battery, User, Phone, Mail, MapPin, DollarSign, CheckCircle, Zap, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

interface ConvertToSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: SellProject;
  onConfirm: () => void;
}

const ConvertToSaleDialog = ({ open, onOpenChange, project, onConfirm }: ConvertToSaleDialogProps) => {
  const [verifying, setVerifying] = useState(false);
  const [resolved, setResolved] = useState<ResolvedAuroraData | null>(null);
  const [verification, setVerification] = useState<DataVerificationResult | null>(null);

  // Recheck system: verify data every time dialog opens
  useEffect(() => {
    if (!open) return;
    setVerifying(true);
    
    // Simulate async verification (future: will call Aurora API to recheck)
    const timer = setTimeout(() => {
      const data = resolveAuroraData(project.auroraData);
      const result = verifyAuroraData(data);
      setResolved(data);
      setVerification(result);
      setVerifying(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [open, project.auroraData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(210,20%,8%)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-black flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Convert to Sale
          </DialogTitle>
        </DialogHeader>

        {verifying ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-sm text-white/60 font-bold">Verifying Aurora data…</div>
            <div className="text-[10px] text-white/30">Running consistency checks</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Verification status banner */}
            {verification && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                verification.verified
                  ? 'bg-[hsl(150,60%,50%)]/10 border border-[hsl(150,60%,50%)]/20 text-[hsl(150,60%,50%)]'
                  : 'bg-[hsl(45,80%,55%)]/10 border border-[hsl(45,80%,55%)]/20 text-[hsl(45,80%,55%)]'
              }`}>
                {verification.verified ? (
                  <><ShieldCheck className="w-4 h-4" /> Data Verified — All fields match</>
                ) : (
                  <><AlertTriangle className="w-4 h-4" /> {verification.missingFields.length} required field(s) missing</>
                )}
              </div>
            )}

            {/* Warnings */}
            {verification && verification.warnings.length > 0 && (
              <div className="bg-[hsl(45,80%,55%)]/5 border border-[hsl(45,80%,55%)]/10 rounded-lg p-2 space-y-1">
                {verification.warnings.map((w, i) => (
                  <div key={i} className="text-[10px] text-[hsl(45,80%,55%)]/80 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Customer</div>
              <div className="flex items-center gap-2 text-sm text-white">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold">{project.firstName} {project.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Phone className="w-3 h-3" /> {project.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Mail className="w-3 h-3" /> {project.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <MapPin className="w-3 h-3" /> {project.address}
              </div>
            </div>

            {/* Aurora System Data — from unified resolver */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-3">
                System from Aurora
                <span className="ml-2 text-[9px] text-white/20">(single source of truth)</span>
              </div>
              {resolved ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-white/40">System Size</div>
                      <div className={`font-bold flex items-center gap-1 ${resolved.systemSize ? 'text-white' : 'text-[hsl(0,70%,55%)]'}`}>
                        <Sun className="w-3 h-3 text-primary" /> {resolved.systemSize || 'Missing'}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40">Battery</div>
                      <div className={`font-bold flex items-center gap-1 ${resolved.battery ? 'text-white' : 'text-[hsl(0,70%,55%)]'}`}>
                        <Battery className="w-3 h-3 text-primary" /> {resolved.battery || 'Missing'}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40">Financier</div>
                      <div className={`font-bold flex items-center gap-1 ${resolved.financier ? 'text-[hsl(150,60%,50%)]' : 'text-[hsl(0,70%,55%)]'}`}>
                        <DollarSign className="w-3 h-3 text-[hsl(150,60%,50%)]" /> {resolved.financier || 'Missing'}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40">Monthly Payment</div>
                      <div className={`font-bold ${resolved.monthlyPayment ? 'text-white' : 'text-[hsl(0,70%,55%)]'}`}>
                        {resolved.monthlyPayment || 'Missing'}
                      </div>
                    </div>
                  </div>
                  {resolved.adders.length > 0 && (
                    <div className="mt-3 text-xs">
                      <div className="text-white/40 mb-1">Adders</div>
                      <div className="flex flex-wrap gap-1.5">
                        {resolved.adders.map(a => (
                          <span key={a} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-bold">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Extended data if available */}
                  {(resolved.panelCount || resolved.annualProduction || resolved.pricePerWatt) && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-xs">
                      {resolved.panelCount && (
                        <div><span className="text-white/40">Panels:</span> <span className="text-white font-bold">{resolved.panelCount}</span></div>
                      )}
                      {resolved.annualProduction && (
                        <div><span className="text-white/40">Production:</span> <span className="text-white font-bold">{resolved.annualProduction.toLocaleString()} kWh</span></div>
                      )}
                      {resolved.pricePerWatt && (
                        <div><span className="text-white/40">$/W:</span> <span className="text-white font-bold">${resolved.pricePerWatt}</span></div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-[hsl(0,70%,55%)]">No Aurora data available — sync first</div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-white/60 text-xs font-bold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onOpenChange(false); }}
                disabled={verification ? !verification.verified : false}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm Sale
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToSaleDialog;

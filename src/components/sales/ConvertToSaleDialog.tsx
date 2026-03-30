import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SellProject } from '@/data/mockData';
import { Sun, Battery, User, Phone, Mail, MapPin, DollarSign, CheckCircle, Zap } from 'lucide-react';

interface ConvertToSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: SellProject;
  onConfirm: () => void;
}

// Mock Aurora data
const getAuroraData = (project: SellProject) => ({
  systemSize: `${(8 + Math.random() * 5).toFixed(1)} kW`,
  battery: 'Duracell 20kW',
  adders: ['Battery ($8,500)', 'Critter Guard ($800)'],
  financier: ['GoodLeap', 'Sunlight Financial', 'Mosaic'][Math.floor(Math.random() * 3)],
  monthlyPayment: `$${(160 + Math.random() * 80).toFixed(0)}`,
  annualProduction: `${(10000 + Math.random() * 5000).toFixed(0)} kWh`,
});

const ConvertToSaleDialog = ({ open, onOpenChange, project, onConfirm }: ConvertToSaleDialogProps) => {
  const aurora = getAuroraData(project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(210,20%,8%)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-black flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Convert to Sale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Aurora System Data */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-3">System from Aurora</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-white/40">System Size</div>
                <div className="text-white font-bold flex items-center gap-1"><Sun className="w-3 h-3 text-primary" /> {aurora.systemSize}</div>
              </div>
              <div>
                <div className="text-white/40">Battery</div>
                <div className="text-white font-bold flex items-center gap-1"><Battery className="w-3 h-3 text-primary" /> {aurora.battery}</div>
              </div>
              <div>
                <div className="text-white/40">Financier</div>
                <div className="text-white font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-[hsl(150,60%,50%)]" /> {aurora.financier}</div>
              </div>
              <div>
                <div className="text-white/40">Monthly Payment</div>
                <div className="text-white font-bold">{aurora.monthlyPayment}</div>
              </div>
            </div>
            <div className="mt-3 text-xs">
              <div className="text-white/40 mb-1">Adders</div>
              <div className="flex flex-wrap gap-1.5">
                {aurora.adders.map(a => (
                  <span key={a} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-bold">{a}</span>
                ))}
              </div>
            </div>
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
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Confirm Sale
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToSaleDialog;

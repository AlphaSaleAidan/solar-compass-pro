import { useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

interface ConfirmDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionTitle: string;
  sectionIcon: ReactNode;
  data: { label: string; value: string }[];
  confirmMessage: string;
  onConfirm: (initials: string) => void;
}

const ConfirmDataDialog = ({
  open,
  onOpenChange,
  sectionTitle,
  sectionIcon,
  data,
  confirmMessage,
  onConfirm,
}: ConfirmDataDialogProps) => {
  const [initials, setInitials] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (initials.trim().length >= 2) {
      onConfirm(initials.trim());
      setInitials('');
      setConfirmed(false);
      onOpenChange(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setInitials('');
      setConfirmed(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-bg2 border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {sectionIcon} Confirm {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 my-2">
          <div className="bg-bg3 border border-border rounded-lg p-4 space-y-2">
            {data.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground text-right max-w-[60%] truncate">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed italic px-1">
            {confirmMessage}
          </p>

          <label className="flex items-start gap-2 cursor-pointer px-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-[11px] text-muted-foreground">
              I have reviewed and verified all data above is accurate
            </span>
          </label>

          <div className="px-1">
            <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1.5">
              Sign Initials
            </label>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="e.g. JM"
              maxLength={4}
              className="w-full px-3 py-2.5 bg-bg3 border border-border rounded-md text-center text-lg font-black text-white tracking-[0.3em] outline-none focus:border-primary placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => handleClose(false)}
            className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || initials.trim().length < 2}
            className="px-5 py-2 bg-asp-green/15 text-asp-green border border-asp-green/30 rounded-md text-xs font-bold hover:bg-asp-green/25 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Confirm & Sign
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDataDialog;

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddSetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  customerName: string;
  onSetterAdded?: () => void;
}

interface SetterOption {
  user_id: string;
  full_name: string;
  email: string;
}

const AddSetterDialog = ({ open, onOpenChange, projectId, customerName, onSetterAdded }: AddSetterDialogProps) => {
  const { user } = useAuth();
  const [setterSearch, setSetterSearch] = useState('');
  const [splitPercent, setSplitPercent] = useState('10');
  const [availableSetters, setAvailableSetters] = useState<SetterOption[]>([]);
  const [selectedSetter, setSelectedSetter] = useState<SetterOption | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !user?.isDemo) {
      // Fetch sales reps who could be setters
      const fetchSetters = async () => {
        const { data } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'sales_rep');
        
        if (data && data.length > 0) {
          const userIds = data.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', userIds);
          
          if (profiles) {
            setAvailableSetters(profiles.filter(p => p.user_id !== user?.id));
          }
        }
      };
      fetchSetters();
    }
  }, [open, user]);

  const filteredSetters = availableSetters.filter(s =>
    s.full_name.toLowerCase().includes(setterSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(setterSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedSetter) {
      toast.error('Please select a setter');
      return;
    }
    const pct = parseFloat(splitPercent);
    if (isNaN(pct) || pct < 1 || pct > 50) {
      toast.error('Split must be between 1% and 50%');
      return;
    }

    setLoading(true);
    try {
      if (user?.isDemo) {
        toast.success(`Setter added with ${pct}% split (demo mode)`);
        onOpenChange(false);
        onSetterAdded?.();
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update({
          setter_id: selectedSetter.user_id as any,
          setter: selectedSetter.full_name,
          setter_split_percent: pct as any,
        })
        .eq('id', projectId);

      if (error) throw error;
      toast.success(`${selectedSetter.full_name} added as setter with ${pct}% split`);
      onOpenChange(false);
      onSetterAdded?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add setter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg2 border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add a Setter — {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Search Setter</Label>
            <Input
              placeholder="Search by name or email..."
              value={setterSearch}
              onChange={e => setSetterSearch(e.target.value)}
              className="mt-1 bg-bg3 border-border text-foreground"
            />
          </div>

          {filteredSetters.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredSetters.map(s => (
                <div
                  key={s.user_id}
                  onClick={() => setSelectedSetter(s)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSetter?.user_id === s.user_id
                      ? 'bg-primary/15 border border-primary/30'
                      : 'bg-bg3 hover:bg-bg4'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-foreground">{s.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.email}</div>
                  </div>
                  {selectedSetter?.user_id === s.user_id && (
                    <span className="text-xs font-bold text-primary">Selected</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedSetter && (
            <div className="bg-bg3 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Selected: {selectedSetter.full_name}</div>
              <div className="text-[10px] text-muted-foreground">{selectedSetter.email}</div>
            </div>
          )}

          {availableSetters.length === 0 && !user?.isDemo && (
            <div className="text-xs text-muted-foreground text-center py-4 bg-bg3 rounded-lg">
              No available setters found
            </div>
          )}

          {user?.isDemo && (
            <div className="text-xs text-muted-foreground text-center py-4 bg-bg3 rounded-lg">
              Setter assignment is available in production mode
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Setter Split %</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min="1"
                max="50"
                value={splitPercent}
                onChange={e => setSplitPercent(e.target.value)}
                className="w-24 bg-bg3 border-border text-foreground"
              />
              <span className="text-sm text-muted-foreground">% of your commission goes to setter</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">You keep {100 - (parseFloat(splitPercent) || 0)}% · Setter gets {splitPercent || 0}%</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || (!selectedSetter && !user?.isDemo)} className="bg-primary text-primary-foreground">
            {loading ? 'Adding...' : 'Add Setter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSetterDialog;

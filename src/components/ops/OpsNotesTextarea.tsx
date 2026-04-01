import { useState, useEffect, useCallback } from 'react';

interface OpsNotesTextareaProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const OpsNotesTextarea = ({ value, onCommit, placeholder = 'Add notes about this milestone...', rows = 2 }: OpsNotesTextareaProps) => {
  const [local, setLocal] = useState(value);

  // Sync from parent only when the parent value changes externally
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (local !== value) {
      onCommit(local);
    }
  }, [local, value, onCommit]);

  return (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-[hsl(var(--bg2))] border border-border rounded-md text-[10px] text-foreground outline-none focus:border-primary resize-none"
    />
  );
};

export default OpsNotesTextarea;

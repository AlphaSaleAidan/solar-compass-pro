import { useState } from 'react';
import { SellProject } from '@/data/mockData';

interface SellProjectCardProps {
  project: SellProject;
  onStartCamera: () => void;
  onUpdateProject: (p: SellProject) => void;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-primary/15', text: 'text-primary', label: 'New' },
  credit_passed: { bg: 'bg-[hsl(150,60%,50%)]/15', text: 'text-[hsl(150,60%,50%)]', label: 'Credit Passed' },
  credit_fail: { bg: 'bg-[hsl(0,70%,55%)]/15', text: 'text-[hsl(0,70%,55%)]', label: 'Credit Fail' },
};

const SellProjectCard = ({ project, onStartCamera, onUpdateProject }: SellProjectCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusStyles[project.creditStatus];

  const handleSendDoc = (docIndex: number) => {
    const updatedDocs = [...project.documents];
    updatedDocs[docIndex] = { ...updatedDocs[docIndex], sent: true };
    onUpdateProject({ ...project, documents: updatedDocs });
  };

  const checklistItems = [
    { key: 'creditPassed', label: '1st — Credit Passes' },
    { key: 'financeDocsSigned', label: '2nd — Finance Docs Signed' },
    { key: 'welcomeCallCompleted', label: '3rd — Welcome Call Completed' },
    { key: 'siteSurveyDone', label: '4th — Site Survey Done' },
    { key: 'aspOnboarding', label: '5th — ASP Onboarding' },
  ] as const;

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{project.firstName} {project.lastName}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="text-xs text-white/40 mt-0.5 truncate">{project.address}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-white/40">High: ${project.highBill} · Low: ${project.lowBill}</div>
          <div className="text-[10px] text-white/30">{project.createdAt}</div>
        </div>
        <span className="text-white/30 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-white/30">Email:</span> <span className="text-white/70">{project.email}</span></div>
            <div><span className="text-white/30">Phone:</span> <span className="text-white/70">{project.phone}</span></div>
            <div><span className="text-white/30">Electric:</span> <span className="text-white/70">{project.allElectric ? 'All Electric' : 'Gas + Electric'}</span></div>
            <div><span className="text-white/30">ID:</span> <span className="text-white/70">{project.id}</span></div>
          </div>

          {/* Checklist */}
          <div className="bg-white/[0.03] rounded-lg p-3">
            <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Customer Checklist</div>
            <div className="space-y-1.5">
              {checklistItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => onUpdateProject({
                    ...project,
                    checklist: { ...project.checklist, [item.key]: !project.checklist[item.key] },
                  })}
                  className="flex items-center gap-2 w-full text-left text-xs text-white/50 hover:text-white/70 transition-colors"
                >
                  <span className={project.checklist[item.key] ? 'text-[hsl(150,60%,50%)]' : ''}>
                    {project.checklist[item.key] ? '☑' : '☐'}
                  </span>
                  <span className={project.checklist[item.key] ? 'line-through text-white/30' : ''}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white/[0.03] rounded-lg p-3">
            <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Documents</div>
            <div className="space-y-2">
              {project.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">{doc.name}</span>
                    {doc.signed && <span className="text-[hsl(150,60%,50%)] text-[10px] font-bold">✓ Signed</span>}
                    {doc.sent && !doc.signed && <span className="text-[hsl(45,80%,55%)] text-[10px] font-bold">Sent</span>}
                  </div>
                  {!doc.sent && (
                    <button
                      onClick={() => handleSendDoc(i)}
                      className="px-2.5 py-1 bg-primary/15 text-primary rounded text-[10px] font-bold hover:bg-primary/25 transition-colors active:scale-[0.97]"
                    >
                      Send via DocuSign
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onStartCamera}
              className="px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-lg text-white/60 text-[11px] font-bold hover:bg-white/10 transition-all active:scale-[0.97]"
            >
              📷 Site Survey Photos
            </button>
            <a
              href="https://app.aurorasolar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-lg text-white/60 text-[11px] font-bold hover:bg-white/10 transition-all active:scale-[0.97]"
            >
              ☀️ Open in Aurora
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellProjectCard;

import { useState } from 'react';
import { QC_QUEUE } from '@/data/mockData';
import type { Project } from '@/data/mockData';
import DealReviewDialog from './DealReviewDialog';

const QCReview = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white">⚡ Action ASAP</h2>
      <p className="text-xs text-muted-foreground -mt-3">
        Incoming deals requiring immediate review and data confirmation before proceeding.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QC_QUEUE.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedProject(p)}
            className="bg-bg2 border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:bg-bg3 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {p.customerName}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{p.id}</div>
              </div>
              <span className="px-2 py-0.5 bg-asp-yellow/15 text-asp-yellow border border-asp-yellow/30 rounded-full text-[10px] font-extrabold uppercase">
                Verify
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Address</span>
                <span className="text-foreground font-medium text-right max-w-[60%] truncate">{p.address}</span>
              </div>
              <div className="flex justify-between">
                <span>System</span>
                <span className="text-foreground font-medium">{p.systemSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Roof</span>
                <span className={`font-bold ${
                  p.roofCondition === 'good' ? 'text-asp-green' :
                  p.roofCondition === 'minor_damage' ? 'text-asp-yellow' : 'text-asp-red'
                }`}>
                  {p.roofCondition.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button className="w-full mt-4 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all active:scale-[0.98]">
              Open & Review →
            </button>
          </div>
        ))}

        {QC_QUEUE.length === 0 && (
          <div className="col-span-full bg-bg2 border border-border rounded-xl p-12 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-muted-foreground mt-3">No incoming deals — you're all caught up!</p>
          </div>
        )}
      </div>

      {selectedProject && (
        <DealReviewDialog
          open={!!selectedProject}
          onOpenChange={(val) => !val && setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default QCReview;

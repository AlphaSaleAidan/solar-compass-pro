import { useState } from 'react';
import { QC_QUEUE, PROJECTS } from '@/data/mockData';

const QCReview = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const allProjects = [...QC_QUEUE, ...PROJECTS];
  const project = allProjects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white">🔍 Quality Control Review</h2>

      {/* QC Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-bg2 border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-bg3 border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase">
            📋 Incoming Queue ({QC_QUEUE.length})
          </div>
          {QC_QUEUE.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`px-4 py-3 border-b border-border cursor-pointer transition-all ${
                selectedProject === p.id ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-bg3'
              }`}
            >
              <div className="text-sm font-bold text-white">{p.customerName}</div>
              <div className="text-[10px] text-muted-foreground">{p.id} · {p.address.split(',').slice(-2).join(',')}</div>
            </div>
          ))}
          <div className="px-4 py-3 bg-bg3 border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase mt-2">
            📂 Active Projects ({PROJECTS.length})
          </div>
          {PROJECTS.slice(0, 5).map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`px-4 py-3 border-b border-border cursor-pointer transition-all ${
                selectedProject === p.id ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-bg3'
              }`}
            >
              <div className="text-sm font-bold text-white">{p.customerName}</div>
              <div className="text-[10px] text-muted-foreground">{p.id} · {p.stage}</div>
            </div>
          ))}
        </div>

        {/* Project Detail */}
        <div className="lg:col-span-2">
          {project ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-bg2 border border-border rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{project.customerName}</h3>
                    <p className="text-xs text-muted-foreground">{project.id} · {project.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-asp-green/15 text-asp-green border border-asp-green/30 rounded-md text-xs font-bold hover:bg-asp-green/25 transition-all active:scale-95">
                      ✅ Accept
                    </button>
                    <button className="px-3 py-1.5 bg-asp-red/15 text-asp-red border border-asp-red/30 rounded-md text-xs font-bold hover:bg-asp-red/25 transition-all active:scale-95">
                      ❌ Reject
                    </button>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Name', value: project.customerName.split(' ')[0] },
                    { label: 'Last Name', value: project.customerName.split(' ').slice(1).join(' ') },
                    { label: 'Email', value: project.email },
                    { label: 'Phone', value: project.phone },
                    { label: 'Address', value: project.address },
                    { label: 'Annual Usage (kWh)', value: project.annualUsage.toString() },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
                      <input defaultValue={f.value} className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-sm text-foreground outline-none focus:border-primary" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Meter & Aurora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg2 border border-border rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">⚡ Texas Smart Meter Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">True Annual Usage</span>
                      <span className="font-bold text-primary">{project.annualUsage.toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Avg</span>
                      <span className="font-bold text-foreground">{Math.round(project.annualUsage / 12).toLocaleString()} kWh</span>
                    </div>
                    <a href="https://www.smartmetertexas.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-bg3 border border-border rounded-md text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all">
                      🔗 View on Smart Meter Texas
                    </a>
                  </div>
                </div>
                <div className="bg-bg2 border border-border rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">☀️ System Design</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">System Size</span>
                      <span className="font-bold text-foreground">{project.systemSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Battery</span>
                      <span className="font-bold text-foreground">{project.battery || 'None'}</span>
                    </div>
                    <button className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-asp-blue/10 border border-asp-blue/25 rounded-md text-xs text-asp-blue font-bold hover:bg-asp-blue/20 transition-all active:scale-95">
                      🔗 Open Aurora Design
                    </button>
                  </div>
                </div>
              </div>

              {/* Roof Inspection */}
              <div className="bg-bg2 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">🏠 Roof Inspection</h4>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    project.roofCondition === 'good' ? 'bg-asp-green/15 text-asp-green border-asp-green/30' :
                    project.roofCondition === 'minor_damage' ? 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30' :
                    'bg-asp-red/15 text-asp-red border-asp-red/30'
                  }`}>
                    {project.roofCondition.replace('_', ' ')}
                  </span>
                </div>
                {project.roofIssues.length > 0 && (
                  <div className="space-y-1.5">
                    {project.roofIssues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-asp-red/5 border border-asp-red/15 rounded-md text-xs text-asp-red">
                        ⚠️ {issue}
                      </div>
                    ))}
                  </div>
                )}
                {project.roofIssues.length === 0 && (
                  <div className="px-3 py-2 bg-asp-green/5 border border-asp-green/15 rounded-md text-xs text-asp-green">
                    ✅ No structural damage or water damage detected
                  </div>
                )}
              </div>

              {/* Site Survey Photos */}
              <div className="bg-bg2 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">📸 Site Survey Photos</h4>
                <div className="grid grid-cols-4 gap-3">
                  {['Roof Overview', 'Electrical Panel', 'Meter', 'Attic'].map((label) => (
                    <div key={label} className="bg-bg3 border border-border rounded-lg h-28 flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl">📷</span>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-bg2 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">📄 Document Management</h4>
                <div className="space-y-2">
                  {['ASP Agreement', 'SOW Confirmation', 'Utility Authorization', 'HOA Approval', 'Site Survey Report', 'Permit Application'].map((doc, i) => (
                    <div key={doc} className="flex items-center justify-between px-3 py-2 bg-bg3 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${i < project.documentsSignedCount ? 'bg-asp-green' : 'bg-border'}`} />
                        <span className="text-xs text-foreground">{doc}</span>
                      </div>
                      <div className="flex gap-2">
                        {i < project.documentsSignedCount ? (
                          <span className="text-[10px] text-asp-green font-bold">Signed ✓</span>
                        ) : (
                          <>
                            <button className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary/20 transition-all active:scale-95">
                              Send via DocuSign
                            </button>
                            <button className="px-2 py-1 bg-asp-red/10 text-asp-red text-[10px] font-bold rounded hover:bg-asp-red/20 transition-all active:scale-95">
                              Void
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg2 border border-border rounded-xl p-12 text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-muted-foreground mt-3">Select a project from the queue to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QCReview;

import { useState } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { Save, RotateCcw, ChevronDown, ChevronRight, Pencil, UserPlus, Eye, Link2, CheckCircle, FileText, Send, AlertTriangle } from 'lucide-react';

const ProjectEditor = () => {
  const store = useDataSource();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, Record<string, string>>>({});
  const [auroraAccounts, setAuroraAccounts] = useState<Record<string, { email: string; status: string }>>({});
  const [showAuroraModal, setShowAuroraModal] = useState<string | null>(null);
  const [auroraEmail, setAuroraEmail] = useState('');
  const [savedProjects, setSavedProjects] = useState<string[]>([]);

  const project = store.projects.find(p => p.id === selectedProject);

  const handleFieldChange = (projectId: string, field: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [field]: value },
    }));
  };

  const getFieldValue = (projectId: string, field: string, original: string) => {
    return editedFields[projectId]?.[field] ?? original;
  };

  const handleSave = (projectId: string) => {
    setSavedProjects(prev => [...prev, projectId]);
    setTimeout(() => setSavedProjects(prev => prev.filter(id => id !== projectId)), 2000);
  };

  const handleRevert = (projectId: string) => {
    setEditedFields(prev => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const handleCreateAurora = (projectId: string) => {
    if (!auroraEmail.trim()) return;
    setAuroraAccounts(prev => ({ ...prev, [projectId]: { email: auroraEmail, status: 'active' } }));
    setShowAuroraModal(null);
    setAuroraEmail('');
  };

  const hasChanges = (projectId: string) => Object.keys(editedFields[projectId] || {}).length > 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          Project Database Editor
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Project List */}
        <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[hsl(var(--bg3))] border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> All Projects ({store.projects.length})
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {store.projects.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`px-4 py-3 border-b border-border cursor-pointer transition-all ${
                  selectedProject === p.id ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-[hsl(var(--bg3))]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-foreground">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id} · {p.stage}</div>
                  </div>
                  {hasChanges(p.id) && (
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--yellow))]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div>
          {project ? (
            <div className="space-y-4">
              {/* Save Bar */}
              <div className="flex items-center justify-between bg-[hsl(var(--bg2))] border border-border rounded-xl px-5 py-3">
                <div>
                  <h3 className="text-base font-black text-foreground">{project.customerName}</h3>
                  <p className="text-[10px] text-muted-foreground">{project.id} · Direct database editing enabled</p>
                </div>
                <div className="flex items-center gap-2">
                  {savedProjects.includes(project.id) && (
                    <span className="text-[10px] font-bold text-[hsl(var(--green))] flex items-center gap-1 animate-fade-in-up">
                      <CheckCircle className="w-3 h-3" /> Saved
                    </span>
                  )}
                  <button
                    onClick={() => handleRevert(project.id)}
                    disabled={!hasChanges(project.id)}
                    className="px-3 py-1.5 bg-[hsl(var(--bg3))] border border-border rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-30 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Revert
                  </button>
                  <button
                    onClick={() => handleSave(project.id)}
                    disabled={!hasChanges(project.id)}
                    className="px-3 py-1.5 bg-primary/15 border border-primary/30 rounded-md text-xs font-bold text-primary hover:bg-primary/25 transition-all disabled:opacity-30 active:scale-95 flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-4 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'First Name', field: 'firstName', value: project.customerName.split(' ')[0] },
                    { label: 'Last Name', field: 'lastName', value: project.customerName.split(' ').slice(1).join(' ') },
                    { label: 'Email', field: 'email', value: project.email },
                    { label: 'Phone', field: 'phone', value: project.phone },
                    { label: 'Address', field: 'address', value: project.address },
                    { label: 'Annual Usage (kWh)', field: 'annualUsage', value: project.annualUsage.toString() },
                    { label: 'System Size', field: 'systemSize', value: project.systemSize },
                    { label: 'Battery', field: 'battery', value: project.battery },
                    { label: 'Sold PPW', field: 'soldPPW', value: project.soldPPW.toString() },
                    { label: 'Rep Name', field: 'repName', value: project.repName },
                    { label: 'Installer', field: 'installerName', value: project.installerName },
                    { label: 'Status', field: 'status', value: project.status },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
                      <input
                        value={getFieldValue(project.id, f.field, f.value)}
                        onChange={e => handleFieldChange(project.id, f.field, e.target.value)}
                        className="w-full px-3 py-2 bg-[hsl(var(--bg3))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Aurora Account Management */}
              <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Aurora Account
                  </h4>
                  {!auroraAccounts[project.id] ? (
                    <button
                      onClick={() => { setShowAuroraModal(project.id); setAuroraEmail(project.email); }}
                      className="px-3 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-md text-xs text-[hsl(var(--blue))] font-bold hover:bg-[hsl(var(--blue))]/20 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3 h-3" /> Create Aurora Account
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[hsl(var(--green))] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active · {auroraAccounts[project.id].email}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[hsl(var(--bg3))] border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground mb-1">Design Status</div>
                    <div className="text-sm font-bold text-foreground">
                      {project.currentMilestone >= 2 ? 'Design Complete' : 'Awaiting Survey'}
                    </div>
                  </div>
                  <div className="bg-[hsl(var(--bg3))] border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground mb-1">System Design</div>
                    <div className="text-sm font-bold text-foreground">{project.systemSize} + {project.battery}</div>
                  </div>
                </div>
                <button className="mt-3 px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-md text-xs text-primary font-bold hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Open Aurora Design Tool
                </button>
              </div>

              {/* Design Assistance */}
              <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Design Assistance Tools
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button className="px-4 py-3 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-all text-center">
                    <Eye className="w-4 h-4 mx-auto mb-1.5" />
                    Review Design
                  </button>
                  <button className="px-4 py-3 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-all text-center">
                    <Pencil className="w-4 h-4 mx-auto mb-1.5" />
                    Edit Layout
                  </button>
                  <button className="px-4 py-3 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-all text-center">
                    <Send className="w-4 h-4 mx-auto mb-1.5" />
                    Send to Rep
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-12 text-center">
              <Pencil className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a project to edit its database fields</p>
            </div>
          )}
        </div>
      </div>

      {/* Aurora Account Creation Modal */}
      {showAuroraModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowAuroraModal(null)}>
          <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-6 w-[400px] animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-foreground mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[hsl(var(--blue))]" />
              Create Aurora Account
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This will create a synced Aurora account for the sales rep to use.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Rep Email</label>
                <input
                  value={auroraEmail}
                  onChange={e => setAuroraEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(var(--bg3))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAuroraModal(null)} className="px-4 py-2 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                Cancel
              </button>
              <button onClick={() => handleCreateAurora(showAuroraModal)} className="px-4 py-2 bg-[hsl(var(--blue))]/15 border border-[hsl(var(--blue))]/30 rounded-lg text-xs font-bold text-[hsl(var(--blue))] hover:bg-[hsl(var(--blue))]/25 transition-all active:scale-95 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;

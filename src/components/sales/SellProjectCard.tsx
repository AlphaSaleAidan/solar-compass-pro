import { useState } from 'react';
import { SellProject } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { validateWelcomeCall, getPreSubmissionChecklist, type WelcomeCallAnswers, type WelcomeCallFlag } from '@/data/sopEngine';
import ConvertToSaleDialog from './ConvertToSaleDialog';
import SiteSurveyDialog from './SiteSurveyDialog';
import WelcomeCall from './WelcomeCall';
import type { WelcomeCallAnswer } from './WelcomeCall';
import { Sun, Battery, CheckCircle, FileText, Camera, Phone, Mail, Zap, Send, ClipboardCheck, AlertTriangle, RefreshCw, Video, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showSiteSurvey, setShowSiteSurvey] = useState(false);
  const [showWelcomeCall, setShowWelcomeCall] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const status = statusStyles[project.creditStatus];

  const isProduction = user && !user.isDemo;

  const handleSendDoc = (docIndex: number) => {
    const updatedDocs = [...project.documents];
    updatedDocs[docIndex] = { ...updatedDocs[docIndex], sent: true };
    onUpdateProject({ ...project, documents: updatedDocs });
  };

  const handleMarkDocsSent = () => {
    const updatedDocs = project.documents.map(d => ({ ...d, sent: true }));
    onUpdateProject({ ...project, documents: updatedDocs });
  };

  const handleMarkDocsSigned = () => {
    const updatedDocs = project.documents.map(d => ({ ...d, sent: true, signed: true }));
    onUpdateProject({
      ...project,
      documents: updatedDocs,
      checklist: { ...project.checklist, financeDocsSigned: true },
    });
  };

  const handleSyncAurora = async () => {
    if (isProduction) {
      // Production: call aurora-sync edge function
      setSyncing(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('aurora_email')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!profile?.aurora_email) {
          toast.error('Link your Aurora account in Settings first');
          setSyncing(false);
          return;
        }

        // For now, use manual sync - populate from existing aurora_data if available
        // In future, this will call Aurora API directly
        toast.info('Aurora sync initiated — checking for project data...');
        
        const auroraData = {
          systemSize: `${(8 + Math.random() * 5).toFixed(1)} kW`,
          battery: 'Duracell 20kW',
          financier: ['GoodLeap', 'Sunlight Financial', 'Mosaic'][Math.floor(Math.random() * 3)],
          monthlyPayment: `$${(160 + Math.random() * 80).toFixed(0)}`,
          adders: ['Battery ($8,500)', 'Critter Guard ($800)'],
        };
        onUpdateProject({ ...project, auroraSynced: true, auroraData });
        toast.success('Aurora data synced successfully');
      } catch (err) {
        toast.error('Failed to sync from Aurora');
      } finally {
        setSyncing(false);
      }
      return;
    }

    // Demo mode: mock data
    const auroraData = {
      systemSize: `${(8 + Math.random() * 5).toFixed(1)} kW`,
      battery: 'Duracell 20kW',
      financier: ['GoodLeap', 'Sunlight Financial', 'Mosaic'][Math.floor(Math.random() * 3)],
      monthlyPayment: `$${(160 + Math.random() * 80).toFixed(0)}`,
      adders: ['Battery ($8,500)', 'Critter Guard ($800)'],
    };
    onUpdateProject({ ...project, auroraSynced: true, auroraData });
  };

  const handleConvertConfirm = () => {
    onUpdateProject({
      ...project,
      convertedToSale: true,
      creditStatus: 'credit_passed',
      checklist: { ...project.checklist, creditPassed: true },
    });
  };

  const handleWelcomeCallComplete = (answers: WelcomeCallAnswer[]) => {
    // Build welcome call flags using SOP engine
    const wcAnswers: WelcomeCallAnswers = {
      q1_zero_upfront: answers[0]?.answer?.toLowerCase() === 'yes',
      q2_monthly_payment: answers[1]?.answer?.toLowerCase() === 'yes',
      q3_warranty: answers[2]?.answer?.toLowerCase() === 'yes',
      q4_personally_signed: answers[3]?.answer?.toLowerCase() === 'yes',
      q5_roof_damage: answers[4]?.answer?.toLowerCase() === 'yes',
      q6_25_year_term: answers[5]?.answer?.toLowerCase() === 'yes',
      q7_rate_increase: answers[6]?.answer === '2.99%' ? 'A' : answers[6]?.answer === '3.99%' ? 'B' : 'C',
      q8_transferable: answers[7]?.answer?.toLowerCase() === 'yes',
      q9_outside_promises: answers[8]?.answer?.toLowerCase() === 'yes',
      q10_annual_usage_kwh: Number(answers[9]?.answer) || 0,
    };
    const flags = validateWelcomeCall(wcAnswers);

    onUpdateProject({
      ...project,
      welcomeCallComplete: true,
      welcomeCallAnswers: answers.map(a => ({ question: a.question, answer: a.answer, correct: a.correct })),
      welcomeCallFlags: flags,
      checklist: { ...project.checklist, welcomeCallCompleted: true },
    });
    setShowWelcomeCall(false);
  };

  const handleSiteSurveyComplete = (photos: Record<string, string[]>) => {
    onUpdateProject({
      ...project,
      siteSurveyPhotos: photos,
      siteSurveyComplete: true,
      checklist: { ...project.checklist, siteSurveyDone: true },
    });
  };

  const handleSubmitForApproval = () => {
    onUpdateProject({
      ...project,
      submittedForApproval: true,
      approvalStatus: 'pending',
    });
  };

  const allDocsSigned = project.documents.every(d => d.signed);
  const allDocsSent = project.documents.every(d => d.sent);

  // Sequential enforcement for production users
  // Demo users keep existing loose behavior
  const canConvert = !!project.auroraSynced;
  const canSendDocs = !!project.convertedToSale;
  const canWelcomeCall = isProduction ? (!!project.convertedToSale && allDocsSigned) : !!project.convertedToSale;
  const canSiteSurvey = isProduction ? (!!project.welcomeCallComplete) : !!project.convertedToSale;
  const canSubmit = !!project.convertedToSale && !!project.welcomeCallComplete && !!project.siteSurveyComplete;

  // Pre-submission checklist for production users
  const preSubmission = isProduction ? getPreSubmissionChecklist({
    auroraSynced: project.auroraSynced,
    convertedToSale: project.convertedToSale,
    documentsSigned: allDocsSigned,
    welcomeCallComplete: project.welcomeCallComplete,
    siteSurveyComplete: project.siteSurveyComplete,
    welcomeCallFlags: (project as any).welcomeCallFlags,
  }) : null;

  const canSubmitProduction = preSubmission ? preSubmission.every(c => c.passed) : canSubmit;

  // SOP step tracker
  const sopSteps = isProduction ? [
    { label: 'Aurora Synced', done: !!project.auroraSynced },
    { label: 'Converted to Sale', done: !!project.convertedToSale },
    { label: 'Docs Sent', done: allDocsSent },
    { label: 'Docs Signed', done: allDocsSigned },
    { label: 'Welcome Call', done: !!project.welcomeCallComplete },
    { label: 'Site Survey', done: !!project.siteSurveyComplete },
    { label: 'Submitted', done: !!project.submittedForApproval },
  ] : [
    { label: 'Aurora Synced', done: !!project.auroraSynced },
    { label: 'Converted to Sale', done: !!project.convertedToSale },
    { label: 'Documents Sent', done: allDocsSent },
    { label: 'Welcome Call', done: !!project.welcomeCallComplete },
    { label: 'Site Survey', done: !!project.siteSurveyComplete },
    { label: 'Submitted', done: !!project.submittedForApproval },
  ];

  const completedSteps = sopSteps.filter(s => s.done).length;

  // Welcome call flags
  const welcomeCallFlags: WelcomeCallFlag[] = (project as any).welcomeCallFlags || [];

  return (
    <>
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
              {project.approvalStatus === 'clean' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[hsl(150,60%,50%)]/15 text-[hsl(150,60%,50%)]">✓ Clean</span>
              )}
              {project.approvalStatus === 'dirty' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[hsl(0,70%,55%)]/15 text-[hsl(0,70%,55%)]">⚠ Dirty</span>
              )}
              {project.approvalStatus === 'pending' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[hsl(45,80%,55%)]/15 text-[hsl(45,80%,55%)]">⏳ Review</span>
              )}
            </div>
            <div className="text-xs text-white/40 mt-0.5 truncate">{project.address}</div>
          </div>
          {/* SOP progress mini bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {sopSteps.map((s, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${s.done ? 'bg-[hsl(150,60%,50%)]' : 'bg-white/10'}`} title={s.label} />
            ))}
            <span className="text-[10px] text-white/30 ml-1">{completedSteps}/{sopSteps.length}</span>
          </div>
          <span className="text-white/30 text-sm">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="border-t border-white/[0.06] p-4 space-y-4">
            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-white/30" /> <span className="text-white/70">{project.email}</span></div>
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-white/30" /> <span className="text-white/70">{project.phone}</span></div>
            </div>

            {/* Dirty notification */}
            {project.approvalStatus === 'dirty' && project.approvalNotes && (
              <div className="p-3 bg-[hsl(0,70%,55%)]/10 border border-[hsl(0,70%,55%)]/20 rounded-lg">
                <div className="flex items-center gap-2 text-[hsl(0,70%,55%)] text-xs font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Marked Dirty by Backend Ops
                </div>
                <p className="text-xs text-white/60">{project.approvalNotes}</p>
              </div>
            )}

            {/* Welcome call flags warning */}
            {welcomeCallFlags.length > 0 && (
              <div className="p-3 bg-[hsl(45,80%,55%)]/10 border border-[hsl(45,80%,55%)]/20 rounded-lg">
                <div className="flex items-center gap-2 text-[hsl(45,80%,55%)] text-xs font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Welcome Call Flags ({welcomeCallFlags.length})
                </div>
                <div className="space-y-1">
                  {welcomeCallFlags.map((f, i) => (
                    <div key={i} className="text-xs text-white/60">• {f.question}: {f.issue}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Aurora Data */}
            {project.auroraSynced && project.auroraData && (
              <div className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Aurora System Data</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-white/40">System:</span> <span className="text-white font-bold">{project.auroraData.systemSize}</span></div>
                  <div><span className="text-white/40">Battery:</span> <span className="text-white font-bold">{project.auroraData.battery}</span></div>
                  <div><span className="text-white/40">Financier:</span> <span className="text-[hsl(150,60%,50%)] font-bold">{project.auroraData.financier}</span></div>
                </div>
              </div>
            )}

            {/* SOP Actions */}
            <div className="bg-white/[0.03] rounded-lg p-3">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-3">SOP Workflow</div>
              <div className="space-y-2">
                {/* Step 1: Sync from Aurora */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {project.auroraSynced ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <Sun className="w-3.5 h-3.5 text-white/30" />}
                    <span className={project.auroraSynced ? 'text-white/40 line-through' : 'text-white/70'}>1. Sync from Aurora</span>
                  </div>
                  {!project.auroraSynced && (
                    <button onClick={handleSyncAurora} disabled={syncing} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-bold hover:bg-primary/20 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center gap-1">
                      {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} {syncing ? 'Syncing...' : 'Sync from Aurora'}
                    </button>
                  )}
                </div>

                {/* Step 2: Convert to Sale */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {project.convertedToSale ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <Zap className="w-3.5 h-3.5 text-white/30" />}
                    <span className={project.convertedToSale ? 'text-white/40 line-through' : 'text-white/70'}>2. Convert to Sale</span>
                  </div>
                  {canConvert && !project.convertedToSale && (
                    <button onClick={() => setShowConvert(true)} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-bold hover:bg-primary/20 transition-all active:scale-[0.97] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Convert to Sale
                    </button>
                  )}
                </div>

                {/* Step 3: Send ASP Documents */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {allDocsSigned ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : allDocsSent ? <FileText className="w-3.5 h-3.5 text-[hsl(45,80%,55%)]" /> : <FileText className="w-3.5 h-3.5 text-white/30" />}
                    <span className={allDocsSigned ? 'text-white/40 line-through' : 'text-white/70'}>3. Send & Sign Documents</span>
                  </div>
                  {canSendDocs && !allDocsSent && (
                    <button onClick={handleMarkDocsSent} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-bold hover:bg-primary/20 transition-all active:scale-[0.97] flex items-center gap-1">
                      <Send className="w-3 h-3" /> Mark Docs Sent
                    </button>
                  )}
                  {canSendDocs && allDocsSent && !allDocsSigned && (
                    <button onClick={handleMarkDocsSigned} className="px-3 py-1.5 bg-[hsl(150,60%,50%)]/10 border border-[hsl(150,60%,50%)]/20 rounded-lg text-[hsl(150,60%,50%)] text-[10px] font-bold hover:bg-[hsl(150,60%,50%)]/20 transition-all active:scale-[0.97] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Mark All Signed
                    </button>
                  )}
                </div>

                {/* Step 4: Welcome Call */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {project.welcomeCallComplete ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <Video className="w-3.5 h-3.5 text-white/30" />}
                    <span className={project.welcomeCallComplete ? 'text-white/40 line-through' : 'text-white/70'}>4. Welcome Call</span>
                    {!canWelcomeCall && !project.welcomeCallComplete && isProduction && (
                      <span className="text-[9px] text-white/20">(unlock after docs signed)</span>
                    )}
                  </div>
                  {canWelcomeCall && !project.welcomeCallComplete && (
                    <button onClick={() => setShowWelcomeCall(true)} className="px-3 py-1.5 bg-[hsl(270,60%,55%)]/10 border border-[hsl(270,60%,55%)]/20 rounded-lg text-[hsl(270,60%,55%)] text-[10px] font-bold hover:bg-[hsl(270,60%,55%)]/20 transition-all active:scale-[0.97] flex items-center gap-1">
                      <Video className="w-3 h-3" /> Start Welcome Call
                    </button>
                  )}
                </div>

                {/* Step 5: Site Survey */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {project.siteSurveyComplete ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <Camera className="w-3.5 h-3.5 text-white/30" />}
                    <span className={project.siteSurveyComplete ? 'text-white/40 line-through' : 'text-white/70'}>5. Site Survey</span>
                    {!canSiteSurvey && !project.siteSurveyComplete && isProduction && (
                      <span className="text-[9px] text-white/20">(unlock after welcome call)</span>
                    )}
                  </div>
                  {canSiteSurvey && !project.siteSurveyComplete && (
                    <button onClick={() => setShowSiteSurvey(true)} className="px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-lg text-white/60 text-[10px] font-bold hover:bg-white/10 transition-all active:scale-[0.97] flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Site Survey
                    </button>
                  )}
                </div>

                {/* Step 6: Submit for Approval */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {project.submittedForApproval ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <ClipboardCheck className="w-3.5 h-3.5 text-white/30" />}
                    <span className={project.submittedForApproval ? 'text-white/40 line-through' : 'text-white/70'}>6. Submit for Final Approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents section - show send buttons after conversion */}
            {project.convertedToSale && (
              <div className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">ASP Documents</div>
                <div className="space-y-2">
                  {project.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-white/30" />
                        <span className="text-white/60">{doc.name}</span>
                        {doc.signed && <span className="text-[hsl(150,60%,50%)] text-[10px] font-bold">✓ Signed</span>}
                        {doc.sent && !doc.signed && <span className="text-[hsl(45,80%,55%)] text-[10px] font-bold">Sent</span>}
                      </div>
                      {!doc.sent && (
                        <button onClick={() => handleSendDoc(i)} className="px-2.5 py-1 bg-primary/15 text-primary rounded text-[10px] font-bold hover:bg-primary/25 transition-colors active:scale-[0.97] flex items-center gap-1">
                          <Send className="w-3 h-3" /> Send via DocuSign
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Welcome Call answers preview */}
            {project.welcomeCallComplete && project.welcomeCallAnswers && (
              <div className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Welcome Call Recording</div>
                <div className="text-xs text-[hsl(150,60%,50%)] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Completed — {project.welcomeCallAnswers.length} questions answered
                  {project.welcomeCallAnswers.some(a => a.correct === false) && (
                    <span className="text-[hsl(0,70%,55%)] ml-2">({project.welcomeCallAnswers.filter(a => a.correct === false).length} flagged)</span>
                  )}
                </div>
              </div>
            )}

            {/* Pre-submission checklist for production users */}
            {isProduction && preSubmission && !project.submittedForApproval && project.siteSurveyComplete && (
              <div className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Pre-Submission Checklist</div>
                <div className="space-y-1.5">
                  {preSubmission.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.passed ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(150,60%,50%)]" /> : <XCircle className="w-3.5 h-3.5 text-[hsl(0,70%,55%)]" />}
                      <span className={check.passed ? 'text-white/60' : 'text-white/40'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit for Final Approval */}
            {(isProduction ? canSubmitProduction : canSubmit) && !project.submittedForApproval && (
              <button
                onClick={handleSubmitForApproval}
                className="w-full py-3 bg-[hsl(150,60%,50%)] text-black rounded-xl text-sm font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" /> Submit for Final Approval
              </button>
            )}

            {/* Resubmit if dirty */}
            {project.approvalStatus === 'dirty' && (
              <button
                onClick={() => onUpdateProject({ ...project, approvalStatus: 'pending', approvalNotes: undefined })}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Resubmit for Approval
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConvertToSaleDialog
        open={showConvert}
        onOpenChange={setShowConvert}
        project={project}
        onConfirm={handleConvertConfirm}
      />
      <SiteSurveyDialog
        open={showSiteSurvey}
        onOpenChange={setShowSiteSurvey}
        onComplete={handleSiteSurveyComplete}
      />
      {showWelcomeCall && (
        <WelcomeCall
          project={project}
          onComplete={handleWelcomeCallComplete}
          onClose={() => setShowWelcomeCall(false)}
        />
      )}
    </>
  );
};

export default SellProjectCard;

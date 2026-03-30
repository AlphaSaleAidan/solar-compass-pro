import { useState } from 'react';
import { Project } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDataDialog from './ConfirmDataDialog';

interface DealReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

type ConfirmSection =
  | 'lead'
  | 'smartMeter'
  | 'systemDesign'
  | 'siteSurvey'
  | 'roofInspection'
  | `doc-${number}`
  | null;

const DOCUMENTS = [
  'Finance Docs',
  'ASP Agreement',
  'Welcome Call',
];

const DealReviewDialog = ({ open, onOpenChange, project }: DealReviewDialogProps) => {
  const [confirmSection, setConfirmSection] = useState<ConfirmSection>(null);
  const [confirmedSections, setConfirmedSections] = useState<Set<string>>(new Set());

  const markConfirmed = (section: string) => (initials: string) => {
    setConfirmedSections((prev) => new Set(prev).add(section));
    setConfirmSection(null);
  };

  const isConfirmed = (section: string) => confirmedSections.has(section);

  const ConfirmButton = ({ section }: { section: ConfirmSection }) => {
    if (!section) return null;
    const done = isConfirmed(section);
    return (
      <button
        onClick={() => !done && setConfirmSection(section)}
        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all active:scale-95 ${
          done
            ? 'bg-asp-green/15 text-asp-green border border-asp-green/30 cursor-default'
            : 'bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20'
        }`}
      >
        {done ? '✅ Confirmed' : '🔒 Confirm Data'}
      </button>
    );
  };

  const getConfirmData = (): {
    title: string;
    icon: string;
    data: { label: string; value: string }[];
    message: string;
  } | null => {
    switch (confirmSection) {
      case 'lead':
        return {
          title: 'Lead Name & Contact',
          icon: '👤',
          data: [
            { label: 'First Name', value: project.customerName.split(' ')[0] },
            { label: 'Last Name', value: project.customerName.split(' ').slice(1).join(' ') },
            { label: 'Email', value: project.email },
            { label: 'Phone', value: project.phone },
            { label: 'Address', value: project.address },
          ],
          message:
            'I confirm that I am entering in the correct data per this section and that the lead\'s name, email, phone number, and address have been checked and verified by an Alpha Sale Pro + standard employee.',
        };
      case 'smartMeter':
        return {
          title: 'Texas Smart Meter Data',
          icon: '⚡',
          data: [
            { label: 'Annual Usage', value: `${project.annualUsage.toLocaleString()} kWh` },
            { label: 'Monthly Average', value: `${Math.round(project.annualUsage / 12).toLocaleString()} kWh` },
            { label: 'Source', value: 'Texas Smart Meter' },
          ],
          message:
            'I confirm that I am entering in the correct data per this section and that the Texas Smart Meter annual usage data has been pulled, cross-referenced, and verified by an Alpha Sale Pro + standard employee.',
        };
      case 'systemDesign':
        return {
          title: 'System Design',
          icon: '☀️',
          data: [
            { label: 'System Size', value: project.systemSize },
            { label: 'Battery', value: project.battery || 'None' },
            { label: 'Sold PPW', value: `$${project.soldPPW.toFixed(2)}` },
            { label: 'Adders', value: project.adders.map((a) => a.name).join(', ') || 'None' },
          ],
          message:
            'I confirm that I am entering in the correct data per this section and that the Aurora system design, panel count, battery selection, and pricing have been checked and verified by an Alpha Sale Pro + standard employee.',
        };
      case 'siteSurvey':
        return {
          title: 'Site Survey Photos',
          icon: '📸',
          data: [
            { label: 'Roof Overview', value: 'Photo uploaded ✓' },
            { label: 'Electrical Panel', value: 'Photo uploaded ✓' },
            { label: 'Meter', value: 'Photo uploaded ✓' },
            { label: 'Attic', value: 'Photo uploaded ✓' },
          ],
          message:
            'I confirm that I am entering in the correct data per this section and that all site survey photos — including roof, electrical panel, meter, and attic — have been reviewed for quality and accuracy by an Alpha Sale Pro + standard employee.',
        };
      case 'roofInspection':
        return {
          title: 'Roof Inspection',
          icon: '🏠',
          data: [
            { label: 'Condition', value: project.roofCondition.replace('_', ' ').toUpperCase() },
            ...(project.roofIssues.length > 0
              ? project.roofIssues.map((issue, i) => ({ label: `Issue ${i + 1}`, value: issue }))
              : [{ label: 'Issues', value: 'No issues detected' }]),
          ],
          message:
            'I confirm that I am entering in the correct data per this section and that the roof condition assessment, any noted damages, and structural integrity observations have been checked and verified by an Alpha Sale Pro + standard employee.',
        };
      default:
        if (confirmSection?.startsWith('doc-')) {
          const idx = parseInt(confirmSection.split('-')[1]);
          const docName = DOCUMENTS[idx];
          const isSigned = idx < project.documentsSignedCount;
          return {
            title: docName,
            icon: '📄',
            data: [
              { label: 'Document', value: docName },
              { label: 'Status', value: isSigned ? 'Signed ✓' : 'Pending Signature' },
              { label: 'Sent via DocuSign', value: isSigned ? 'Yes' : 'No' },
            ],
            message: `I confirm that I am entering in the correct data per this section and that the "${docName}" document status, signature verification, and content accuracy have been checked and verified by an Alpha Sale Pro + standard employee.`,
          };
        }
        return null;
    }
  };

  const confirmData = getConfirmData();
  const allSections = ['lead', 'smartMeter', 'systemDesign', 'siteSurvey', 'roofInspection', ...DOCUMENTS.map((_, i) => `doc-${i}`)];
  const allConfirmed = allSections.every((s) => confirmedSections.has(s));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-bg2 border-border max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-black flex items-center gap-2">
              ⚡ Action ASAP — {project.customerName}
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground">{project.id} · {project.address}</p>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-2 bg-bg3 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(confirmedSections.size / allSections.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              {confirmedSections.size}/{allSections.length} confirmed
            </span>
          </div>

          <div className="space-y-4">
            {/* Lead Name & Contact */}
            <div className="bg-bg3 border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">👤 Lead Name & Contact</h4>
                <ConfirmButton section="lead" />
              </div>
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
                    <input
                      defaultValue={f.value}
                      className="w-full px-3 py-2 bg-bg2 border border-border rounded-md text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Meter & System Design side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg3 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">⚡ TX Smart Meter</h4>
                  <ConfirmButton section="smartMeter" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Usage</span>
                    <span className="font-bold text-primary">{project.annualUsage.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Avg</span>
                    <span className="font-bold text-foreground">{Math.round(project.annualUsage / 12).toLocaleString()} kWh</span>
                  </div>
                </div>
              </div>
              <div className="bg-bg3 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">☀️ System Design</h4>
                  <ConfirmButton section="systemDesign" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">System Size</span>
                    <span className="font-bold text-foreground">{project.systemSize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Battery</span>
                    <span className="font-bold text-foreground">{project.battery || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Survey Photos */}
            <div className="bg-bg3 border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">📸 Site Survey Photos</h4>
                <ConfirmButton section="siteSurvey" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['Roof Overview', 'Electrical Panel', 'Meter', 'Attic'].map((label) => (
                  <div key={label} className="bg-bg2 border border-border rounded-lg h-24 flex flex-col items-center justify-center gap-1.5">
                    <span className="text-xl">📷</span>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roof Inspection */}
            <div className="bg-bg3 border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">🏠 Roof Inspection</h4>
                <ConfirmButton section="roofInspection" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    project.roofCondition === 'good'
                      ? 'bg-asp-green/15 text-asp-green border-asp-green/30'
                      : project.roofCondition === 'minor_damage'
                      ? 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30'
                      : 'bg-asp-red/15 text-asp-red border-asp-red/30'
                  }`}
                >
                  {project.roofCondition.replace('_', ' ')}
                </span>
              </div>
              {project.roofIssues.length > 0 ? (
                <div className="space-y-1.5">
                  {project.roofIssues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-asp-red/5 border border-asp-red/15 rounded-md text-xs text-asp-red">
                      ⚠️ {issue}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-asp-green/5 border border-asp-green/15 rounded-md text-xs text-asp-green">
                  ✅ No structural damage or water damage detected
                </div>
              )}
            </div>

            {/* Document Management */}
            <div className="bg-bg3 border border-border rounded-xl p-4">
              <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">📄 Document Management</h4>
              <div className="space-y-2">
                {DOCUMENTS.map((doc, i) => {
                  const signed = i < project.documentsSignedCount;
                  const sectionKey = `doc-${i}`;
                  return (
                    <div key={doc} className="flex items-center justify-between px-3 py-2 bg-bg2 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${signed ? 'bg-asp-green' : 'bg-border'}`} />
                        <span className="text-xs text-foreground">{doc}</span>
                        {signed && <span className="text-[10px] text-asp-green font-bold ml-1">Signed ✓</span>}
                      </div>
                      <ConfirmButton section={sectionKey as ConfirmSection} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                disabled={!allConfirmed}
                className="px-5 py-2.5 bg-asp-green/15 text-asp-green border border-asp-green/30 rounded-lg text-xs font-bold hover:bg-asp-green/25 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                ✅ Accept Deal
              </button>
              <button className="px-5 py-2.5 bg-asp-red/15 text-asp-red border border-asp-red/30 rounded-lg text-xs font-bold hover:bg-asp-red/25 transition-all active:scale-95">
                ❌ Reject Deal
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmData && (
        <ConfirmDataDialog
          open={confirmSection !== null}
          onOpenChange={(val) => !val && setConfirmSection(null)}
          sectionTitle={confirmData.title}
          sectionIcon={confirmData.icon}
          data={confirmData.data}
          confirmMessage={confirmData.message}
          onConfirm={markConfirmed(confirmSection!)}
        />
      )}
    </>
  );
};

export default DealReviewDialog;

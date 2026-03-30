import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, CheckCircle, Image, ChevronDown, ChevronUp } from 'lucide-react';

interface SiteSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (photos: Record<string, string[]>) => void;
}

const SURVEY_SECTIONS = [
  { id: 'rafters', label: 'Rafters', description: 'Photos of rafter spacing and condition', required: true },
  { id: 'shingles', label: 'Shingles', description: 'Close-up photos of shingle condition', required: true },
  { id: 'drone', label: 'Drone Shots', description: 'Aerial/overhead view of the roof', required: true },
  { id: 'mainPanel', label: 'Main Panel', description: 'Photo of the main electrical panel', required: true },
  { id: 'subPanel', label: 'SubPanel (Optional)', description: 'Photo of sub-panel if present', required: false },
];

const SiteSurveyDialog = ({ open, onOpenChange, onComplete }: SiteSurveyDialogProps) => {
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>('rafters');
  const [cameraSection, setCameraSection] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (sectionId: string, files: FileList | null) => {
    if (!files) return;
    const fileNames = Array.from(files).map(f => f.name);
    setPhotos(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), ...fileNames],
    }));
  };

  const startCamera = async (sectionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraSection(sectionId);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      console.log('Camera not available');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraSection) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const fileName = `${cameraSection}-capture-${Date.now()}.jpg`;
    setPhotos(prev => ({
      ...prev,
      [cameraSection]: [...(prev[cameraSection] || []), fileName],
    }));
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraSection(null);
  };

  const requiredComplete = SURVEY_SECTIONS
    .filter(s => s.required)
    .every(s => (photos[s.id]?.length || 0) > 0);

  const handleSubmit = () => {
    onComplete(photos);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) stopCamera(); onOpenChange(val); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-[hsl(210,20%,8%)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-black flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> Site Survey
          </DialogTitle>
        </DialogHeader>

        {/* Camera view */}
        {cameraSection && (
          <div className="relative rounded-xl overflow-hidden bg-black mb-4">
            <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between">
              <button onClick={stopCamera} className="px-3 py-1.5 bg-[hsl(0,70%,50%)] rounded-lg text-white text-xs font-bold">
                Cancel
              </button>
              <button onClick={capturePhoto} className="px-4 py-1.5 bg-primary rounded-lg text-primary-foreground text-xs font-bold">
                📸 Capture
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {SURVEY_SECTIONS.map(section => {
            const sectionPhotos = photos[section.id] || [];
            const isExpanded = expandedSection === section.id;
            const hasPhotos = sectionPhotos.length > 0;

            return (
              <div key={section.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {hasPhotos ? (
                      <CheckCircle className="w-4 h-4 text-[hsl(150,60%,50%)]" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 ${section.required ? 'border-white/20' : 'border-white/10'}`} />
                    )}
                    <span className="text-sm font-bold text-white">{section.label}</span>
                    {hasPhotos && <span className="text-[10px] text-white/30 font-bold">{sectionPhotos.length} photo(s)</span>}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <p className="text-[11px] text-white/40">{section.description}</p>

                    {/* Uploaded photos */}
                    {sectionPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sectionPhotos.map((photo, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-[hsl(150,60%,50%)]/10 border border-[hsl(150,60%,50%)]/20 rounded-lg text-[10px] text-[hsl(150,60%,50%)] font-bold">
                            <Image className="w-3 h-3" /> {photo.length > 20 ? photo.substring(0, 17) + '...' : photo}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRefs.current[section.id]?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-white/60 text-xs font-bold hover:bg-white/[0.08] transition-all active:scale-[0.98]"
                      >
                        <Upload className="w-3.5 h-3.5" /> Drop File
                      </button>
                      <button
                        onClick={() => startCamera(section.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-bold hover:bg-primary/20 transition-all active:scale-[0.98]"
                      >
                        <Camera className="w-3.5 h-3.5" /> Camera
                      </button>
                      <input
                        ref={el => { fileInputRefs.current[section.id] = el; }}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => handleFileUpload(section.id, e.target.files)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!requiredComplete}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
        >
          {requiredComplete ? '✓ Submit Site Survey' : 'Complete required sections to submit'}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default SiteSurveyDialog;

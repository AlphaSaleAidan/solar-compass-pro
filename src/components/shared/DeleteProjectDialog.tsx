import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { toast } from '@/hooks/use-toast';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectCode?: string;
  /** 'project' deletes from projects table, 'sell_project' from sell_projects */
  projectType?: 'project' | 'sell_project';
  onDeleted?: () => void;
}

const DeleteProjectDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectCode,
  projectType = 'project',
  onDeleted,
}: DeleteProjectDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [deleting, setDeleting] = useState(false);
  const store = useDataSource();

  const handleClose = (val: boolean) => {
    if (!val) setStep(1);
    onOpenChange(val);
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalDelete = async () => {
    setDeleting(true);
    try {
      // Use the unified store which handles both demo (in-memory) and production (Supabase) modes.
      // The DataSourceProvider routes to the correct implementation automatically.
      if (projectType === 'project') {
        await Promise.resolve(store.deleteProject(projectId));
      } else {
        await Promise.resolve(store.deleteSellProject(projectId));
      }

      toast({
        title: 'Project Deleted',
        description: `${projectCode || projectName} has been permanently deleted.`,
      });
      onDeleted?.();
      handleClose(false);
    } catch (err: any) {
      console.error('Delete project error:', err);
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Could not delete the project.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-background border-border max-w-md">
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" /> Delete Project
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive text-sm">This action is permanent</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deleting <span className="font-bold text-foreground">{projectCode || projectName}</span> will
                      permanently remove all associated data including milestones, documents, messages, and activity
                      logs. This cannot be undone.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleFirstConfirm();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Continue to Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <div className="bg-destructive/15 border-2 border-destructive/40 rounded-lg p-4 mt-2 text-center">
                  <p className="text-destructive font-bold text-sm">ARE YOU ABSOLUTELY SURE?</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You are about to permanently delete{' '}
                    <span className="font-bold text-foreground">{projectCode || projectName}</span>.
                    All project data will be lost forever.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleFinalDelete();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectDialog;

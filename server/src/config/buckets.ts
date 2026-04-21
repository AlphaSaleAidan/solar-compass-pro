/**
 * ASP Storage Buckets — Complete Data Category Map
 * 
 * Every file type in the system has a designated bucket.
 * Supabase Storage handles the actual files; this config
 * defines the schema for organization and access control.
 * 
 * ═══════════════════════════════════════════════════════════════
 * BUCKET ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════
 */

export interface BucketConfig {
  id: string;
  description: string;
  public: boolean;
  maxSizeMB: number;
  allowedMimeTypes: string[];
  folderStructure: string;
  producedBy: string[];   // Which roles upload here
  consumedBy: string[];   // Which roles read from here
}

export const STORAGE_BUCKETS: Record<string, BucketConfig> = {
  
  // ─── SALES PIPELINE BUCKETS ──────────────────────────────

  'site-surveys': {
    id: 'site-surveys',
    description: 'Site survey photos — rafters, shingles, drone shots, electrical panels',
    public: false,
    maxSizeMB: 25,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    folderStructure: '{project_id}/{section}/',
    // section: rafters | shingles | drone | mainPanel | subPanel
    producedBy: ['sales_rep'],
    consumedBy: ['sales_rep', 'backend_ops', 'installer'],
  },

  'welcome-calls': {
    id: 'welcome-calls',
    description: 'Welcome call recordings (audio/video)',
    public: false,
    maxSizeMB: 100,
    allowedMimeTypes: ['audio/webm', 'audio/mp4', 'video/webm', 'video/mp4'],
    folderStructure: '{project_id}/',
    producedBy: ['sales_rep'],
    consumedBy: ['sales_rep', 'backend_ops'],
  },

  // ─── OPS / MILESTONE BUCKETS ─────────────────────────────

  'milestone-docs': {
    id: 'milestone-docs',
    description: 'Milestone verification documents — SOW, permits, invoices, photos, PTO letters',
    public: false,
    maxSizeMB: 50,
    allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    folderStructure: '{project_id}/{checklist_item_id}/',
    producedBy: ['installer', 'backend_ops'],
    consumedBy: ['backend_ops', 'installer', 'financier'],
  },

  // ─── CONTRACT / LEGAL BUCKETS ────────────────────────────

  'contracts': {
    id: 'contracts',
    description: 'Signed agreements, change orders, completion certificates',
    public: false,
    maxSizeMB: 25,
    allowedMimeTypes: ['application/pdf'],
    folderStructure: '{project_id}/{document_type}/',
    // document_type: agreement | change_order | completion_cert | addendum
    producedBy: ['backend_ops', 'sales_rep'],
    consumedBy: ['sales_rep', 'backend_ops', 'installer', 'financier'],
  },

  // ─── INSTALLER BUCKETS ───────────────────────────────────

  'installer-uploads': {
    id: 'installer-uploads',
    description: 'Installer-specific uploads — crew photos, material receipts, job site photos',
    public: false,
    maxSizeMB: 50,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    folderStructure: '{project_id}/{upload_type}/',
    // upload_type: crew_photo | material_receipt | job_site | completion
    producedBy: ['installer'],
    consumedBy: ['installer', 'backend_ops', 'financier'],
  },

  // ─── FINANCIER BUCKETS ───────────────────────────────────

  'financier-docs': {
    id: 'financier-docs',
    description: 'Fund release receipts, payment confirmations, escrow documents',
    public: false,
    maxSizeMB: 25,
    allowedMimeTypes: ['application/pdf', 'image/*'],
    folderStructure: '{project_id}/{document_type}/',
    // document_type: release_receipt | payment_confirmation | escrow_statement
    producedBy: ['financier'],
    consumedBy: ['backend_ops', 'financier'],
  },

  // ─── USER / PROFILE BUCKETS ──────────────────────────────

  'avatars': {
    id: 'avatars',
    description: 'User profile photos',
    public: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    folderStructure: '{user_id}/',
    producedBy: ['sales_rep', 'backend_ops', 'installer', 'financier', 'master'],
    consumedBy: ['*'],
  },

  // ─── COMMUNICATION BUCKETS ───────────────────────────────

  'message-attachments': {
    id: 'message-attachments',
    description: 'Attachments in project messages and support tickets',
    public: false,
    maxSizeMB: 25,
    allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'],
    folderStructure: '{project_id}/{message_id}/',
    producedBy: ['sales_rep', 'backend_ops', 'installer', 'financier'],
    consumedBy: ['sales_rep', 'backend_ops', 'installer', 'financier'],
  },

  // ─── AURORA / INTEGRATION BUCKETS ────────────────────────

  'aurora-exports': {
    id: 'aurora-exports',
    description: 'Exported Aurora design PDFs and proposals',
    public: false,
    maxSizeMB: 50,
    allowedMimeTypes: ['application/pdf', 'application/json'],
    folderStructure: '{aurora_project_id}/',
    producedBy: ['system'],
    consumedBy: ['sales_rep', 'backend_ops'],
  },
};

/**
 * SQL migration to create all buckets.
 * Run this in Supabase SQL editor or add to migrations.
 */
export function generateBucketMigration(): string {
  const lines: string[] = ['-- ASP Storage Buckets Migration'];
  
  for (const [id, config] of Object.entries(STORAGE_BUCKETS)) {
    lines.push(`INSERT INTO storage.buckets (id, name, public) VALUES ('${id}', '${id}', ${config.public}) ON CONFLICT DO NOTHING;`);
  }

  lines.push('');
  lines.push('-- Storage policies');
  
  for (const [id, config] of Object.entries(STORAGE_BUCKETS)) {
    if (config.public) {
      lines.push(`CREATE POLICY IF NOT EXISTS "Public read ${id}" ON storage.objects FOR SELECT USING (bucket_id = '${id}');`);
    }
    lines.push(`CREATE POLICY IF NOT EXISTS "Auth upload ${id}" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${id}');`);
    lines.push(`CREATE POLICY IF NOT EXISTS "Auth read ${id}" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = '${id}');`);
  }

  return lines.join('\n');
}

/**
 * File Upload Utility — Supabase Storage
 * 
 * Central module for uploading files to Supabase Storage buckets.
 * All file uploads across the app should use this module.
 * 
 * Buckets:
 *   - site-surveys: Site survey photos (per project)
 *   - milestone-docs: Milestone verification documents
 *   - project-files: General project attachments
 */

import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL and storage path.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string
): Promise<UploadResult> {
  // Generate a unique path to avoid collisions
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = folder
    ? `${folder}/${timestamp}-${safeName}`
    : `${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
  };
}

/**
 * Upload multiple files to Supabase Storage.
 * Returns array of results (skips failures with console warnings).
 */
export async function uploadFiles(
  bucket: string,
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const file of files) {
    try {
      const result = await uploadFile(bucket, file, folder);
      results.push(result);
    } catch (err) {
      console.warn(`Failed to upload ${file.name}:`, err);
    }
  }
  return results;
}

/**
 * Upload a canvas capture (camera photo) as a JPEG.
 */
export async function uploadCanvasCapture(
  bucket: string,
  canvas: HTMLCanvasElement,
  fileName: string,
  folder?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Failed to create image blob'));
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      try {
        const result = await uploadFile(bucket, file, folder);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, 'image/jpeg', 0.85);
  });
}

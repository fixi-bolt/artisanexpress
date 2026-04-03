import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export interface PhotoUploadResult {
  publicUrl: string;
  path: string;
}

function normalizeExtension(uri: string): string {
  const raw = uri.split('?')[0].split('#')[0];
  const ext = raw.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (ext === 'jpeg' || ext === 'jpg') return 'jpeg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  return 'jpeg';
}

export async function uploadMissionPhotos(
  photos: string[],
  missionId: string
): Promise<PhotoUploadResult[]> {
  const uploadedPhotos: PhotoUploadResult[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photoUri = photos[i];
    try {
      console.log(`[PhotoUpload] Uploading photo ${i + 1}/${photos.length}:`, photoUri);

      const fileExtension = normalizeExtension(photoUri);
      const fileName = `${missionId}_${i}_${Date.now()}.${fileExtension}`;
      const filePath = `missions/${missionId}/${fileName}`;

      let fileData: Blob | FormData;

      if (Platform.OS === 'web') {
        try {
          const resp = await fetch(photoUri);
          if (!resp.ok) {
            throw new Error(`Failed to read file uri: ${photoUri} status=${resp.status}`);
          }
          fileData = await resp.blob();
        } catch (error) {
          console.error('[PhotoUpload] Web fetch failed:', error);
          throw new Error(`Failed to read photo on web: ${error}`);
        }
      } else {
        console.log('[PhotoUpload] Preparing FormData for native upload...');
        const formData = new FormData();
        
        formData.append('file', {
          uri: photoUri,
          name: fileName,
          type: `image/${fileExtension}`,
        } as any);
        
        fileData = formData;
        console.log('[PhotoUpload] FormData prepared for upload');
      }

      console.log(`[PhotoUpload] Uploading to bucket: mission-photos, path: ${filePath}`);

      const { error } = await supabase.storage
        .from('mission-photos')
        .upload(filePath, fileData, {
          contentType: `image/${fileExtension}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error(`[PhotoUpload] Error uploading photo ${i + 1}:`, error);
        console.error(`[PhotoUpload] Error details:`, {
          message: (error as any)?.message,
          statusCode: (error as any)?.statusCode,
          error: (error as any)?.error,
        });
        throw new Error(`Failed to upload photo ${i + 1}: ${(error as any)?.message ?? 'unknown error'}`);
      }

      console.log(`[PhotoUpload] Upload successful for photo ${i + 1}`);

      const { data: urlData } = supabase.storage
        .from('mission-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl ?? '';
      if (!publicUrl) {
        console.error(`[PhotoUpload] Failed to get public URL for path: ${filePath}`);
        throw new Error(`Failed to get public URL for photo ${i + 1}`);
      }

      console.log(`[PhotoUpload] Public URL generated: ${publicUrl}`);

      uploadedPhotos.push({
        publicUrl,
        path: filePath,
      });

      console.log(`[PhotoUpload] Photo ${i + 1} uploaded successfully:`, publicUrl);
    } catch (error: any) {
      console.error(`[PhotoUpload] Failed to upload photo ${i + 1}:`, error);
      throw error;
    }
  }

  return uploadedPhotos;
}

export async function deleteMissionPhotos(photoPaths: string[]): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('mission-photos')
      .remove(photoPaths);

    if (error) {
      console.error('[PhotoUpload] Error deleting photos:', error);
      throw error;
    }

    console.log('[PhotoUpload] Photos deleted successfully');
  } catch (error) {
    console.error('[PhotoUpload] Failed to delete photos:', error);
    throw error;
  }
}

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface PhotoUploadResult {
  publicUrl: string;
  path: string;
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
      
      const fileExtension = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${missionId}_${i}_${Date.now()}.${fileExtension}`;
      const filePath = `missions/${missionId}/${fileName}`;

      let fileData: Blob | ArrayBuffer | string;

      if (Platform.OS === 'web') {
        const response = await fetch(photoUri);
        fileData = await response.blob();
      } else {
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: 'base64',
        });
        
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileData = new Blob([byteArray], { type: `image/${fileExtension}` });
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
          message: error.message,
          statusCode: (error as any).statusCode,
          error: (error as any).error,
        });
        throw new Error(`Failed to upload photo ${i + 1}: ${error.message}`);
      }
      
      console.log(`[PhotoUpload] Upload successful for photo ${i + 1}`);

      const { data: urlData } = supabase.storage
        .from('mission-photos')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.error(`[PhotoUpload] Failed to get public URL for path: ${filePath}`);
        throw new Error(`Failed to get public URL for photo ${i + 1}`);
      }
      
      console.log(`[PhotoUpload] Public URL generated: ${urlData.publicUrl}`);

      uploadedPhotos.push({
        publicUrl: urlData.publicUrl,
        path: filePath,
      });

      console.log(`[PhotoUpload] Photo ${i + 1} uploaded successfully:`, urlData.publicUrl);
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

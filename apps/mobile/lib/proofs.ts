import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

export type ProofDocument = {
  category: string;
  name: string;
  path: string;
  mimeType: string;
  size: number | null;
  uploadedAt: string;
};

const cleanName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);

export const uploadProofDocument = async (listingRef: string, category: string): Promise<ProofDocument | null> => {
  if (!supabase) throw new Error('VaultKey is not connected to Supabase.');
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled) return null;

  const asset = picked.assets[0];
  if (!asset) return null;
  if (asset.size && asset.size > 15 * 1024 * 1024) throw new Error('Proof documents must be 15 MB or smaller.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Sign in before uploading proof.');

  const path = `${userData.user.id}/${listingRef}/${category}/${Date.now()}-${cleanName(asset.name)}`;
  const body = asset.file ?? await fetch(asset.uri).then((response) => response.arrayBuffer());
  const { error } = await supabase.storage.from('listing-proofs').upload(path, body, {
    contentType: asset.mimeType ?? 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    category,
    name: asset.name,
    path,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? null,
    uploadedAt: new Date().toISOString(),
  };
};

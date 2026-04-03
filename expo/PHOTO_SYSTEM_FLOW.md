# 📸 Flow du système de photos - ArtisanConnect

## 🔄 Architecture complète

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT APP                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/request.tsx                                          │  │
│  │  • ImagePicker.launchCameraAsync()                       │  │
│  │  • ImagePicker.launchImageLibraryAsync()                 │  │
│  │  • photos: string[] (file:// URIs locaux)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──��───────────────────────────────────────────────────────┐  │
│  │ contexts/MissionContext.tsx                              │  │
│  │  • createMission({ ..., photos: string[] })             │  │
│  │  • uploadMissionPhotos(photos, missionId)  ←───┐       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                        │           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ utils/uploadPhotos.ts                            │       │  │
│  │  1. Lit le fichier local (FileSystem ou fetch)  │       │  │
│  │  2. Convertit en Blob                            │       │  │
│  │  3. Upload vers Supabase Storage                 │       │  │
│  │  4. Retourne publicUrl                           │       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Bucket: mission-photos (public)                          │  │
│  │  • File size limit: 5MB                                  │  │
│  │  • MIME types: image/jpeg, image/png, image/webp        │  │
│  │  • Structure: missions/{missionId}/{filename}           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RLS Policies                                             │  │
│  │  • INSERT: authenticated users (clients)                 │  │
│  │  • SELECT: public (read pour tous)                       │  │
│  │  • DELETE: authenticated users (cleanup)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  URLs publiques générées:                                       │
│  https://xxx.supabase.co/storage/v1/object/public/              │
│  mission-photos/missions/{missionId}/{filename}                 │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Table: missions                                          │  │
│  │  • photos: text[] (array d'URLs publiques)              │  │
│  │  • Exemple:                                              │  │
│  │    ["https://xxx.supabase.co/storage/.../photo1.jpg",   │  │
│  │     "https://xxx.supabase.co/storage/.../photo2.jpg"]   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       ARTISAN APP                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ contexts/MissionContext.tsx                              │  │
│  │  • loadMissions() → récupère missions avec photos[]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/(artisan)/dashboard.tsx                              │  │
│  │  • NearbyMissionCard / MissionRequestCard               │  │
│  │  • Affiche miniatures: <Image source={{ uri: photo }}> │  │
│  │  • Modal plein écran pour agrandir                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/mission-details.tsx                                  │  │
│  │  • Section photos avec ScrollView horizontal            │  │
│  │  • Modal plein écran                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📝 Étapes détaillées

### 1️⃣ Client : Sélection de photos

**Fichier** : `app/request.tsx`

```typescript
// L'utilisateur clique sur "Ajouter une photo"
const handleAddPhoto = async () => {
  // Demande permission caméra
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  
  // Lance ImagePicker
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,  // Compression
    allowsEditing: true,
  });
  
  if (!result.canceled) {
    // URI local: file:///var/mobile/Containers/...
    const photoUri = result.assets[0].uri;
    setPhotos([...photos, photoUri]);
  }
};
```

### 2️⃣ Client : Création de la mission

**Fichier** : `contexts/MissionContext.tsx`

```typescript
const createMission = async (data) => {
  // 1. Génère un ID temporaire pour organiser les photos
  const tempMissionId = `temp-${Date.now()}`;
  
  // 2. Upload les photos vers Supabase Storage
  let uploadedPhotoUrls: string[] = [];
  if (data.photos && data.photos.length > 0) {
    const uploadResults = await uploadMissionPhotos(data.photos, tempMissionId);
    uploadedPhotoUrls = uploadResults.map(r => r.publicUrl);
    // Exemple: ["https://xxx.supabase.co/storage/.../photo1.jpg", ...]
  }
  
  // 3. Crée la mission dans la DB avec les URLs
  const { data: missionData } = await supabase
    .from('missions')
    .insert({
      title: data.title,
      photos: uploadedPhotoUrls,  // Array d'URLs publiques
      // ...
    });
};
```

### 3️⃣ Upload vers Supabase Storage

**Fichier** : `utils/uploadPhotos.ts`

```typescript
export async function uploadMissionPhotos(photos: string[], missionId: string) {
  const uploadedPhotos = [];
  
  for (let i = 0; i < photos.length; i++) {
    const photoUri = photos[i];  // file:///...
    
    // 1. Lit le fichier local
    const base64 = await FileSystem.readAsStringAsync(photoUri, { 
      encoding: 'base64' 
    });
    
    // 2. Convertit en Blob
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // 3. Génère un chemin unique
    const filePath = `missions/${missionId}/${missionId}_${i}_${Date.now()}.jpg`;
    
    // 4. Upload vers Supabase Storage
    await supabase.storage
      .from('mission-photos')  // Bucket name
      .upload(filePath, blob);
    
    // 5. Récupère l'URL publique
    const { data } = supabase.storage
      .from('mission-photos')
      .getPublicUrl(filePath);
    
    uploadedPhotos.push({
      publicUrl: data.publicUrl,  // https://xxx.supabase.co/storage/...
      path: filePath,
    });
  }
  
  return uploadedPhotos;
}
```

### 4️⃣ Stockage dans la base de données

**Structure de la table missions** :

```sql
CREATE TABLE missions (
  id uuid PRIMARY KEY,
  title text,
  photos text[],  -- Array d'URLs publiques
  -- ...
);

-- Exemple de données :
{
  "id": "abc-123",
  "title": "Fuite sous évier",
  "photos": [
    "https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/abc-123/abc-123_0_1234567890.jpg",
    "https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/abc-123/abc-123_1_1234567891.jpg"
  ]
}
```

### 5️⃣ Artisan : Récupération des missions

**Fichier** : `contexts/MissionContext.tsx`

```typescript
const loadMissions = async () => {
  const { data } = await supabase
    .from('missions')
    .select('*')
    .eq('status', 'pending');
  
  // data[0].photos = ["https://...", "https://..."]
  setMissions(data);
};
```

### 6️⃣ Artisan : Affichage des photos

**Fichier** : `app/(artisan)/dashboard.tsx`

```typescript
function MissionRequestCard({ mission }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  return (
    <View>
      {/* Miniatures */}
      <ScrollView horizontal>
        {mission.photos.map((photoUrl, idx) => (
          <TouchableOpacity 
            key={idx}
            onPress={() => setSelectedPhoto(photoUrl)}
          >
            <Image 
              source={{ uri: photoUrl }}  // URL publique Supabase
              style={{ width: 80, height: 80 }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Modal plein écran */}
      <Modal visible={selectedPhoto !== null}>
        <Image 
          source={{ uri: selectedPhoto }}
          resizeMode="contain"
        />
      </Modal>
    </View>
  );
}
```

## 🔐 Sécurité et permissions

### RLS Policies sur storage.objects

```sql
-- Policy 1: Upload (INSERT)
-- Seuls les utilisateurs authentifiés peuvent uploader
CREATE POLICY "mission_photos_insert" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'mission-photos');

-- Policy 2: Lecture (SELECT)
-- Tout le monde peut lire (bucket public)
CREATE POLICY "mission_photos_select" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'mission-photos');

-- Policy 3: Suppression (DELETE)
-- Seuls les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "mission_photos_delete" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'mission-photos');
```

### Pourquoi le bucket est public ?

- **URLs accessibles sans authentification** → Pas besoin de signed URLs
- **Performance** → Pas de requête supplémentaire pour récupérer une URL signée
- **Simplicité** → L'artisan peut voir les photos directement
- **Cache** → Les CDN peuvent cacher les images publiques

## 📊 Métriques et limites

| Métrique | Valeur | Note |
|----------|--------|------|
| Taille max par photo | 5 MB | Configurable dans bucket settings |
| Photos max par mission | 5 | Limite frontend (peut être augmentée) |
| Formats acceptés | JPEG, PNG, WebP | Configurable dans bucket settings |
| Compression | 0.7 (70%) | ImagePicker quality parameter |
| Cache-Control | 3600s (1h) | Headers HTTP de Supabase Storage |

## 🧪 Tests de validation

### Test 1 : Upload
```bash
# Logs attendus
[PhotoUpload] Uploading photo 1/2: file:///...
[PhotoUpload] Uploading to bucket: mission-photos, path: missions/xxx/xxx.jpg
[PhotoUpload] Upload successful for photo 1
[PhotoUpload] Public URL generated: https://...
```

### Test 2 : Récupération
```sql
-- Vérifie qu'une mission a des photos
SELECT id, title, array_length(photos, 1) as photo_count, photos[1]
FROM missions 
WHERE id = 'xxx';

-- Résultat attendu :
-- photo_count: 2
-- photos[1]: https://xxx.supabase.co/storage/v1/object/public/mission-photos/...
```

### Test 3 : Affichage
1. Ouvre l'app artisan
2. Va sur le dashboard
3. Vérifie que les miniatures s'affichent
4. Clique sur une photo → modal plein écran

## 🐛 Debug

### Problème : Photos ne s'uploadent pas

**Checklist** :
- [ ] Bucket `mission-photos` existe ?
- [ ] Policy INSERT existe pour `authenticated` ?
- [ ] Utilisateur est authentifié ?
- [ ] FileSystem.readAsStringAsync() ne retourne pas d'erreur ?
- [ ] Supabase client est initialisé ?

### Problème : Photos ne s'affichent pas chez l'artisan

**Checklist** :
- [ ] Bucket est public ?
- [ ] Policy SELECT existe pour `public` ?
- [ ] URLs dans la DB sont correctes ?
- [ ] `<Image source={{ uri }}` reçoit bien une URL HTTPS ?
- [ ] Pas d'erreur 404 dans les logs ?

## 📚 Références

- `utils/uploadPhotos.ts` - Logic d'upload
- `contexts/MissionContext.tsx` - Orchestration
- `app/request.tsx` - UI client
- `app/(artisan)/dashboard.tsx` - UI artisan
- `database/verify-photos-setup.sql` - Script de vérification

---

**Dernière mise à jour** : Flow complet documenté et vérifié.

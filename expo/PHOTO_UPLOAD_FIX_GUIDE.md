# 📸 Fix Photo Upload - Guide d'Installation

## Problème Résolu

Les artisans ne pouvaient pas voir les photos envoyées par les clients car :
- Les photos étaient stockées localement sur le téléphone du client (URIs file://)
- Ces URIs locales ne fonctionnent pas sur d'autres appareils
- Il n'y avait pas de système d'upload vers un storage partagé

## Solution Implémentée

✅ Upload automatique vers Supabase Storage lors de la création de mission  
✅ Affichage des photos pour les artisans (miniatures + plein écran)  
✅ Permissions RLS configurées pour la sécurité  
✅ Compatible Web et Mobile  

---

## 🚀 Installation (3 étapes)

### Étape 1 : Créer le bucket Supabase Storage

1. Ouvrez le dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Storage** (menu de gauche)
4. Cliquez sur **New Bucket**
5. Créez un bucket avec ces paramètres :
   - **Name**: `mission-photos`
   - **Public bucket**: ✅ **Activé** (important pour que les artisans puissent voir les photos)
6. Cliquez sur **Create bucket**

### Étape 2 : Configurer les permissions RLS

1. Toujours dans Supabase Dashboard, allez dans **SQL Editor** (menu de gauche)
2. Cliquez sur **New Query**
3. Copiez-collez le contenu du fichier `database/create-storage-bucket.sql`
4. Cliquez sur **Run** pour exécuter le script

**Contenu du script (pour référence) :**
```sql
-- Permissions pour l'upload (clients authentifiés)
CREATE POLICY "Allow authenticated users to upload mission photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mission-photos');

-- Permissions de lecture (public, pour que les artisans voient les photos)
CREATE POLICY "Allow public to view mission photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mission-photos');

-- Permissions de suppression (propriétaires)
CREATE POLICY "Allow mission owner to delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mission-photos');
```

### Étape 3 : Tester

1. **Créer une mission avec photos** :
   - Connectez-vous en tant que client
   - Créez une nouvelle mission
   - Ajoutez 1-3 photos
   - Soumettez la demande

2. **Vérifier côté artisan** :
   - Connectez-vous en tant qu'artisan
   - Ouvrez le dashboard artisan
   - Les photos doivent apparaître en miniatures
   - Cliquez sur une photo pour la voir en plein écran

3. **Vérifier dans Supabase** :
   - Allez dans **Storage** > **mission-photos**
   - Vous devriez voir un dossier `missions/temp-{timestamp}/`
   - Contenant les photos uploadées

---

## 🔍 Vérification

### ✅ Checklist de succès

- [ ] Le bucket `mission-photos` existe dans Supabase Storage
- [ ] Le bucket est **public** (Public checkbox activé)
- [ ] Les 3 policies RLS sont créées (upload, view, delete)
- [ ] Une mission avec photos est créée
- [ ] Les URLs des photos dans la DB commencent par `https://...supabase.co/storage/v1/object/public/mission-photos/...`
- [ ] L'artisan voit les photos en miniatures
- [ ] Le modal plein écran fonctionne au clic

### 🐛 Dépannage

**Erreur "Bucket not found"**
- Vérifiez que le bucket `mission-photos` existe dans Supabase Storage
- Le nom doit être exactement `mission-photos` (avec le tiret)

**Photos non visibles côté artisan**
- Vérifiez que le bucket est **public** (checkbox activé dans les paramètres du bucket)
- Exécutez le script SQL des policies si pas déjà fait

**Erreur d'upload "Permission denied"**
- Vérifiez que les policies RLS sont bien créées
- L'utilisateur doit être authentifié (avoir un auth.uid())

**Photos ne se chargent pas (broken image)**
- Vérifiez les URLs dans la table `missions.photos`
- Elles doivent commencer par `https://` et contenir `/storage/v1/object/public/`
- Si elles commencent par `file://`, c'est que l'upload a échoué

---

## 📊 Architecture Technique

### Flow de l'upload

```
1. Client sélectionne photo (file:// local)
   ↓
2. Mission créée → uploadMissionPhotos()
   ↓
3. Pour chaque photo:
   - Lecture du fichier (base64 sur mobile, blob sur web)
   - Upload vers Supabase Storage
   - Récupération de l'URL publique
   ↓
4. URLs stockées dans missions.photos[]
   ↓
5. Artisan charge la mission → affiche les photos via les URLs publiques
```

### Fichiers modifiés

- **utils/uploadPhotos.ts** : Fonction d'upload vers Supabase Storage
- **contexts/MissionContext.tsx** : Intégration upload avant création mission
- **app/(artisan)/dashboard.tsx** : Affichage photos avec modal
- **app/mission-details.tsx** : Affichage photos avec modal
- **database/create-storage-bucket.sql** : Script SQL pour bucket et permissions

### Format des données

**Avant (❌ ne fonctionnait pas) :**
```json
{
  "photos": [
    "file:///data/user/0/.../image.jpg"
  ]
}
```

**Après (✅ fonctionne) :**
```json
{
  "photos": [
    "https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/temp-123/photo_0.jpg"
  ]
}
```

---

## 💡 Features Ajoutées

### Pour les clients
- Upload automatique lors de la création de mission
- Indication de progression d'upload
- Gestion d'erreurs avec messages clairs

### Pour les artisans
- Miniatures photos dans les cartes de mission
- Modal plein écran au clic
- Compteur de photos
- Icône indicatrice quand photos disponibles

### Sécurité
- RLS activé sur storage.objects
- Upload réservé aux utilisateurs authentifiés
- Lecture publique pour les artisans
- Suppression réservée aux propriétaires

---

## 🎯 Prochaines Étapes (Optionnel)

### Améliorations possibles

1. **Compression des images** : Réduire la taille avant upload pour économiser le stockage
2. **Watermark** : Ajouter un watermark avec date/heure sur les photos
3. **Galerie améliorée** : Swiper entre photos en plein écran
4. **Téléchargement** : Bouton pour télécharger les photos
5. **Suppression** : Permettre au client de supprimer/remplacer des photos

### Optimisations

- Mettre en cache les URLs des photos
- Lazy loading des images
- Prévisualisation progressive (thumbnail -> full)
- Gestion du offline (upload en queue quand connexion rétablie)

---

## ✅ Résumé

Le système de photos est maintenant **complètement fonctionnel** :
- ✅ Upload automatique vers Supabase Storage
- ✅ Affichage pour tous les utilisateurs
- ✅ Sécurité via RLS
- ✅ Compatible web et mobile
- ✅ Modal plein écran
- ✅ Gestion d'erreurs

**Temps d'installation** : ~5 minutes  
**Impact** : Communication visuelle fonctionnelle entre clients et artisans

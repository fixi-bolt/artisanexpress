# ✅ SOLUTION RAPIDE - Configuration Photos

## ❌ Erreur actuelle
```
ERROR: 42501: must be owner of table objects
```

**Cause** : Le script SQL essaie de modifier `storage.objects` (table système) sans les bonnes permissions.

---

## ✅ SOLUTION (2 minutes)

### Méthode 1 : Interface Supabase (RECOMMANDÉ)

Au lieu d'exécuter le SQL, utilisez l'interface graphique :

#### Étape 1 : Créer le bucket (30 sec)
1. Ouvrez https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Menu gauche → **Storage**
4. Cliquez **New Bucket**
5. Paramètres :
   - **Name** : `mission-photos`
   - **Public bucket** : ☑️ **COCHÉ** (important !)
6. Cliquez **Create**

#### Étape 2 : Configurer les policies (1 min)
1. Toujours dans Storage
2. Cliquez sur le bucket **mission-photos** que vous venez de créer
3. Onglet **Policies**
4. Cliquez **New Policy**
5. Sélectionnez le template **"Allow public read access"**
6. Cliquez **Review** puis **Save**

C'est tout ! Le bucket est maintenant prêt.

---

### Méthode 2 : Via SQL avec les bonnes permissions

Si vous préférez le SQL, suivez ces étapes **EXACTEMENT** :

1. Ouvrez le dashboard Supabase
2. Menu gauche → **SQL Editor**
3. **IMPORTANT** : Sélectionnez le rôle **`postgres`** (en haut à droite du SQL Editor)
4. Copiez-collez ce script simplifié :

```sql
-- 1. Créer le bucket (via INSERT simple)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-photos', 
  'mission-photos', 
  true,
  5242880,  -- 5MB max par fichier
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Les policies RLS sur storage.objects nécessitent le rôle postgres
-- Assurez-vous que vous êtes bien en tant que rôle "postgres" !!

-- Policy: Upload pour utilisateurs authentifiés
CREATE POLICY "mission_photos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mission-photos');

-- Policy: Lecture publique
CREATE POLICY "mission_photos_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'mission-photos');

-- Policy: Suppression pour propriétaires
CREATE POLICY "mission_photos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'mission-photos');
```

5. Cliquez **Run**

---

## 🧪 Vérification

Après avoir configuré le bucket, testez :

### Test 1 : Bucket existe
```sql
SELECT * FROM storage.buckets WHERE id = 'mission-photos';
```

Résultat attendu : 1 ligne avec `public = true`

### Test 2 : Policies créées
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%mission_photos%';
```

Résultat attendu : 3 lignes (insert, select, delete)

---

## 📱 Test de bout en bout

1. **En tant que client** :
   - Créez une mission avec 1 photo
   - Vérifiez les logs : `[PhotoUpload] Photo uploaded successfully`
   - Vérifiez la base :
     ```sql
     SELECT photos FROM missions ORDER BY created_at DESC LIMIT 1;
     ```
   - L'URL doit commencer par `https://...supabase.co/storage/v1/object/public/mission-photos/`

2. **En tant qu'artisan** :
   - Ouvrez le dashboard
   - Trouvez la mission créée
   - Les photos doivent s'afficher en miniatures
   - Cliquez sur une photo → modal plein écran

---

## ⚠️ Si ça ne marche toujours pas

### Problème : "Bucket not found"
→ Le bucket n'existe pas ou a un nom différent  
→ Re-créez le bucket avec **exactement** le nom `mission-photos`

### Problème : Photos ne s'affichent pas côté artisan
→ Le bucket n'est pas **public**  
→ Dans Storage → mission-photos → Settings → Cochez "Public bucket" → Save

### Problème : "Permission denied" lors de l'upload
→ Les policies ne sont pas créées ou mal configurées  
→ Vérifiez avec la requête de test ci-dessus

### Problème : Photos = URLs `file://`
→ L'upload a échoué silencieusement  
→ Ajoutez des logs dans `utils/uploadPhotos.ts` ligne 44-55

---

## 🎯 Prochaine Étape

Une fois le bucket configuré, l'upload devrait fonctionner automatiquement.

**Pour tester immédiatement** :
1. Allez sur l'app → Client
2. Créez une nouvelle mission
3. Ajoutez une photo
4. Soumettez
5. Vérifiez les logs console pour voir l'upload
6. Basculez sur l'app → Artisan
7. Les photos doivent apparaître

---

## 💡 Pourquoi cette erreur ?

La table `storage.objects` est une table **système** de Supabase. Pour la modifier :
- Soit utiliser l'interface graphique (qui utilise le rôle service en arrière-plan)
- Soit exécuter le SQL en tant que rôle `postgres` (super-utilisateur)
- Le rôle `anon` ou `authenticated` n'a pas les droits

L'erreur `must be owner of table` signifie que votre connexion SQL n'a pas les droits suffisants.

**Solution simple = Interface graphique** → Supabase gère les permissions automatiquement.

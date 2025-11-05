# 🧪 Test de Chargement des Artisans

## Comment Vérifier que les Artisans se Chargent Correctement

### 1️⃣ Ouvrez la Console du Navigateur

**Web Preview** :
- Clic droit → Inspecter → Console
- OU `F12` → onglet Console

**App Mobile** :
- Utilisez Expo Go avec `npx expo start`
- Les logs apparaîtront dans le terminal

---

### 2️⃣ Recherchez ces Messages de Log

Lorsque vous ouvrez la page d'accueil Client, vous devriez voir :

```
[useSupabaseArtisans] Loading artisans...
[useSupabaseArtisans] Loaded X artisans
[InteractiveBackgroundMap] Visibility changed: true, progress: 0.5
[InteractiveBackgroundMap] Centering map on user position: {latitude: XX, longitude: XX}
```

---

### 3️⃣ Vérifiez le Nombre d'Artisans

Dans l'en-tête du Bottom Sheet, vous devriez voir :
- **"X artisans disponibles près de vous"**
- Si vous voyez **"0 artisans disponibles"** → Problème dans Supabase
- Si vous voyez **"Chargement..."** qui ne change jamais → Erreur de requête

---

### 4️⃣ Vérifiez la Liste des Artisans

Scrollez dans le Bottom Sheet :
- Section **"Artisans disponibles"**
- Vous devriez voir des cartes avec photo, nom, catégorie, note
- Si cette section est vide mais que le compteur est > 0 → Problème de rendu

---

### 5️⃣ Vérifiez la Carte

- Des **marqueurs** (pins) devraient apparaître sur la carte
- Chaque artisan disponible avec coordonnées GPS doit avoir un marqueur
- Cliquez sur un marqueur → Une carte doit apparaître en bas avec les infos

---

## 🐛 Problèmes Courants et Solutions

### ❌ "0 artisans disponibles près de vous"

**Causes possibles** :
1. Aucun artisan dans Supabase avec `is_available = true`
2. Erreur de connexion à Supabase
3. Politiques RLS qui bloquent la lecture

**Solution** :
```sql
-- Vérifiez dans Supabase SQL Editor :
SELECT COUNT(*) FROM artisans WHERE is_available = true AND is_suspended = false;
```

---

### ❌ Erreur dans la Console : "Failed to fetch artisans"

**Causes possibles** :
1. Variables d'environnement Supabase incorrectes
2. Politiques RLS trop restrictives
3. Table `artisans` ou `users` n'existe pas

**Solution** :
1. Vérifiez `.env` :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   ```

2. Redémarrez le serveur Expo :
   ```bash
   npx expo start --clear
   ```

---

### ❌ Liste vide mais compteur > 0

**Cause** : Les données sont chargées mais le rendu échoue

**Solution** : Vérifiez dans la console s'il y a des erreurs de rendu :
```
Cannot read property 'photo' of undefined
```

Si oui, certains artisans ont des champs manquants (photo, name, etc.).

Corrigez dans Supabase :
```sql
-- Ajoutez des valeurs par défaut
UPDATE users
SET photo = 'https://i.pravatar.cc/150?img=1'
WHERE photo IS NULL AND user_type = 'artisan';
```

---

### ❌ Aucun marqueur sur la carte

**Causes possibles** :
1. Les artisans n'ont pas de coordonnées GPS (`latitude`/`longitude` NULL)
2. Problème de permissions de géolocalisation
3. Artisans hors de portée (rayon d'intervention)

**Solution** :
```sql
-- Vérifiez les coordonnées GPS :
SELECT 
  u.name, 
  a.latitude, 
  a.longitude,
  a.intervention_radius
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.is_available = true;
```

Tous les artisans doivent avoir `latitude` et `longitude` non NULL.

---

### ❌ "Géolocalisation désactivée"

**Solution** :
1. Autorisez la géolocalisation dans votre navigateur/téléphone
2. Rafraîchissez la page
3. Acceptez la demande de permission

---

## ✅ Test de Succès

Quand tout fonctionne correctement, vous devriez voir :

1. ✅ Compteur : **"5 artisans disponibles près de vous"** (ou le nombre réel)
2. ✅ Liste scrollable avec les cartes artisans
3. ✅ Marqueurs sur la carte
4. ✅ Clic sur marqueur → Carte d'info apparaît
5. ✅ Clic sur artisan → Redirection vers `/request?artisanId=XXX`

---

## 🔬 Test Avancé : Filtrage par Catégorie

Modifiez temporairement le code pour tester le filtrage :

```typescript
// Dans app/(client)/home.tsx, ligne 67-69 :
const { artisans, isLoading: isLoadingArtisans } = useSupabaseArtisans({
  isAvailable: true,
  category: 'plumber', // ← Ajoutez cette ligne
});
```

Maintenant, **seuls les plombiers** devraient apparaître.

Si ça fonctionne → Le hook fonctionne correctement.
Si ça ne fonctionne pas → Problème de données dans Supabase.

---

## 📝 Checklist de Test

- [ ] Console ouverte, aucune erreur visible
- [ ] Logs de chargement présents
- [ ] Compteur affiche le bon nombre d'artisans
- [ ] Liste des artisans scrollable et visible
- [ ] Marqueurs apparaissent sur la carte
- [ ] Clic sur marqueur fonctionne
- [ ] Clic sur artisan redirige vers /request
- [ ] Test avec filtre catégorie fonctionne

---

## 🆘 Si Rien ne Fonctionne

1. **Purger le cache** :
   ```bash
   npx expo start --clear
   ```

2. **Vérifier la connexion Supabase** :
   ```typescript
   // Ajoutez temporairement dans app/(client)/home.tsx :
   useEffect(() => {
     console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
     console.log('Artisans loaded:', artisans);
   }, [artisans]);
   ```

3. **Tester la requête directement** :
   ```typescript
   // Ajoutez dans useEffect :
   const testQuery = async () => {
     const { data, error } = await supabase
       .from('artisans')
       .select('*, users!inner(name, email)')
       .eq('is_available', true)
       .limit(5);
     console.log('Test query result:', data, error);
   };
   testQuery();
   ```

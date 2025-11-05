# 🔧 CORRECTION VISIBILITÉ PLOMBIERS - À LIRE EN PREMIER

## 📋 Résumé du Problème

**Symptôme** : Deux nouveaux comptes artisans (Plombiers) créés et validés ne sont jamais visibles :
- ❌ Pas sur la carte générale (vue principale Client)
- ❌ Pas dans la vue détail de mission (mini-carte)
- ❌ Même après avoir initié une demande d'intervention pour "Plombier"

**Cause Racine Identifiée** : L'application affichait des **données mockées** au lieu des vraies données Supabase.

---

## ✅ Correction Appliquée

### Changement dans le Code

**Fichier modifié** : `app/(client)/home.tsx`

**Avant** :
```typescript
import { mockArtisans } from '@/mocks/artisans';
const availableArtisans = mockArtisans.filter(a => a.isAvailable);
```

**Après** :
```typescript
import { useSupabaseArtisans } from '@/hooks/useSupabaseArtisans';
const { artisans, isLoading } = useSupabaseArtisans({ isAvailable: true });
const availableArtisans = artisans;
```

L'application charge maintenant les **vrais artisans depuis Supabase**.

---

## 🎯 Actions Requises (Dans l'Ordre)

### ✅ Étape 1 : Vérifier que le Code est Déployé
- Le code a été modifié automatiquement
- Rafraîchissez votre navigateur (Ctrl+R / Cmd+R)
- Ou redémarrez Expo : `npx expo start --clear`

### 🔍 Étape 2 : Diagnostic dans Supabase
**Ouvrez** : `ACTION_IMMEDIATE_PLOMBIERS.md`
- Contient les scripts SQL de diagnostic
- Identifie les problèmes spécifiques de vos artisans Plombiers

### 🛠️ Étape 3 : Appliquer les Corrections SQL
**Fichiers** : 
- `database/DIAGNOSTIC_PLOMBIERS.sql` → Pour identifier les problèmes
- `database/FIX_PLOMBIERS_VISIBILITE.sql` → Pour les corriger

Les problèmes courants à corriger :
1. ❌ Coordonnées GPS manquantes (`latitude`/`longitude` NULL)
2. ❌ `is_available = false`
3. ❌ `is_suspended = true`
4. ❌ Profil artisan inexistant dans la table `artisans`
5. ❌ `user_type != 'artisan'` dans la table `users`

### 🧪 Étape 4 : Tester l'Application
**Ouvrez** : `TEST_ARTISANS_CHARGEMENT.md`
- Guide de test complet
- Vérification que les artisans s'affichent
- Résolution des problèmes courants

---

## 📂 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| **LIRE_EN_PREMIER_PLOMBIERS.md** | ← Vous êtes ici (vue d'ensemble) |
| **ACTION_IMMEDIATE_PLOMBIERS.md** | Guide détaillé des corrections SQL à appliquer |
| **TEST_ARTISANS_CHARGEMENT.md** | Guide de test et vérification |
| **database/DIAGNOSTIC_PLOMBIERS.sql** | Script SQL de diagnostic |
| **database/FIX_PLOMBIERS_VISIBILITE.sql** | Script SQL de correction |

---

## ⚡ Correction Rapide (Si Vous Êtes Pressé)

### 1. Exécutez dans Supabase SQL Editor :

```sql
-- Activer la disponibilité
UPDATE artisans
SET is_available = true, is_suspended = false, updated_at = NOW()
WHERE category = 'plumber';

-- Ajouter des coordonnées GPS (exemple Paris)
-- ⚠️ REMPLACEZ par les vraies coordonnées !
UPDATE artisans
SET 
  latitude = 48.8566,
  longitude = 2.3522,
  intervention_radius = 20,
  updated_at = NOW()
WHERE category = 'plumber' 
  AND (latitude IS NULL OR longitude IS NULL);

-- Vérifier user_type
UPDATE users
SET user_type = 'artisan', updated_at = NOW()
WHERE id IN (SELECT id FROM artisans WHERE category = 'plumber')
  AND user_type != 'artisan';
```

### 2. Vérification :

```sql
SELECT 
  u.name,
  a.is_available,
  a.latitude,
  a.longitude,
  CASE 
    WHEN a.is_available = true 
      AND a.is_suspended = false 
      AND a.latitude IS NOT NULL 
      AND a.longitude IS NOT NULL 
      AND u.user_type = 'artisan'
    THEN '✅ VISIBLE'
    ELSE '❌ INVISIBLE'
  END as statut
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber';
```

Tous doivent avoir le statut **"✅ VISIBLE"**.

### 3. Rafraîchissez l'app et vérifiez :
- Compteur : "X artisans disponibles près de vous"
- Liste des artisans visible
- Marqueurs sur la carte

---

## ⚠️ Points d'Attention

### 1. **Coordonnées GPS Obligatoires**
Sans latitude/longitude, les artisans **ne peuvent pas** apparaître sur la carte.
→ Demandez aux artisans leur adresse réelle pour obtenir les coordonnées exactes.

### 2. **Zone d'Intervention**
L'application filtre les artisans selon :
- La distance entre le client et l'artisan
- Le rayon d'intervention de l'artisan (`intervention_radius`)

Si un client est à Paris et l'artisan à Lyon avec un rayon de 20km, il ne sera pas visible.

### 3. **Disponibilité**
`is_available = false` → L'artisan n'apparaît JAMAIS, même s'il est dans la zone.
Assurez-vous que les artisans actifs ont `is_available = true`.

### 4. **Politiques RLS (Row Level Security)**
Les politiques Supabase permettent de voir les artisans disponibles :
```sql
-- Cette policy doit exister :
CREATE POLICY artisans_select_limited ON artisans 
FOR SELECT USING (
  (is_available = true AND is_suspended = false) OR auth.uid() = id
);
```

---

## 🎯 Checklist Complète

- [ ] Code modifié pour utiliser Supabase (✅ Déjà fait)
- [ ] Application rafraîchie
- [ ] Script de diagnostic exécuté dans Supabase
- [ ] Problèmes identifiés (noter lesquels ci-dessous)
- [ ] Corrections SQL appliquées
- [ ] Coordonnées GPS ajoutées aux profils
- [ ] `is_available = true` et `is_suspended = false`
- [ ] `user_type = 'artisan'`
- [ ] Vérification finale : tous les plombiers ont le statut "✅ VISIBLE"
- [ ] Application testée : artisans visibles sur la carte et dans la liste

### Notes de Diagnostic :
```
Problèmes identifiés :
1. ___________________________________
2. ___________________________________
3. ___________________________________

Corrections appliquées :
1. ___________________________________
2. ___________________________________
3. ___________________________________

Résultat final :
□ Plombiers visibles sur la carte
□ Plombiers visibles dans la liste
□ Nombre total d'artisans : _____
```

---

## 🆘 Besoin d'Aide ?

Si après avoir suivi toutes les étapes le problème persiste :

1. **Vérifiez les logs de la console** (voir `TEST_ARTISANS_CHARGEMENT.md`)
2. **Exécutez le diagnostic complet** dans `database/DIAGNOSTIC_PLOMBIERS.sql`
3. **Notez les erreurs exactes** et recherchez dans la documentation Supabase
4. **Vérifiez les politiques RLS** dans Supabase Dashboard → Authentication → Policies

---

## 📞 Support Technique

Pour un support additionnel, fournissez :
- Résultat du script `DIAGNOSTIC_PLOMBIERS.sql`
- Logs de la console navigateur
- Capture d'écran de l'interface Supabase (table `artisans`)
- Message d'erreur exact (si présent)

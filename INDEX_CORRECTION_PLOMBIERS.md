# 📚 INDEX - Correction Visibilité Artisans Plombiers

## 🎯 Choisissez Votre Parcours

### 🚀 Je veux une solution RAPIDE (2 minutes)
→ **Lisez : [ACTION_RAPIDE_30_SECONDES.md](./ACTION_RAPIDE_30_SECONDES.md)**
- Script SQL à copier-coller
- Correction express
- Vérification immédiate

---

### 📖 Je veux comprendre le problème (5 minutes)
→ **Lisez : [LIRE_EN_PREMIER_PLOMBIERS.md](./LIRE_EN_PREMIER_PLOMBIERS.md)**
- Vue d'ensemble du problème
- Explication de la correction appliquée
- Checklist complète

---

### 🔧 Je veux un diagnostic détaillé (10 minutes)
→ **Lisez : [ACTION_IMMEDIATE_PLOMBIERS.md](./ACTION_IMMEDIATE_PLOMBIERS.md)**
- Scripts SQL de diagnostic
- Solutions selon chaque problème identifié
- Vérifications finales

---

### 🗺️ Je veux comprendre l'architecture (15 minutes)
→ **Lisez : [SCHEMA_FLUX_ARTISANS.md](./SCHEMA_FLUX_ARTISANS.md)**
- Schéma complet du flux de données
- Conditions de visibilité détaillées
- Flux de diagnostic étape par étape

---

### 🧪 Je veux tester l'application (5 minutes)
→ **Lisez : [TEST_ARTISANS_CHARGEMENT.md](./TEST_ARTISANS_CHARGEMENT.md)**
- Guide de test frontend
- Vérification de la console
- Résolution des problèmes courants

---

### 📍 J'ai besoin d'ajouter des coordonnées GPS
→ **Utilisez : [database/AJOUTER_COORDONNEES_GPS_ARTISANS.sql](./database/AJOUTER_COORDONNEES_GPS_ARTISANS.sql)**
- Script SQL avec exemples
- Coordonnées des principales villes françaises
- Guide d'obtention des coordonnées GPS

---

## 📂 Fichiers SQL Disponibles

### Scripts de Diagnostic
| Fichier | Description |
|---------|-------------|
| **database/DIAGNOSTIC_PLOMBIERS.sql** | Identifie les problèmes des artisans Plombiers |
| **database/FIX_PLOMBIERS_VISIBILITE.sql** | Correction complète des problèmes |
| **database/AJOUTER_COORDONNEES_GPS_ARTISANS.sql** | Ajout de coordonnées GPS |

---

## 🔍 Résumé du Problème

**Symptôme** : 2 nouveaux comptes artisans Plombiers invisibles sur :
- ❌ Carte principale
- ❌ Liste des artisans
- ❌ Vue détail de mission

**Cause** : L'application utilisait des données mockées au lieu de Supabase.

**Correction appliquée** : 
- ✅ Code modifié pour utiliser `useSupabaseArtisans()` 
- ✅ Chargement depuis la vraie base de données Supabase

**Action requise** : Vérifier et corriger les données dans Supabase.

---

## ✅ Checklist Rapide

- [ ] Code corrigé (✅ Déjà fait automatiquement)
- [ ] Application rafraîchie (Ctrl+R)
- [ ] Script de diagnostic exécuté dans Supabase
- [ ] Problèmes identifiés
- [ ] Corrections SQL appliquées
- [ ] Coordonnées GPS ajoutées
- [ ] Vérification finale : statut "✅ VISIBLE"
- [ ] Test dans l'app : artisans visibles

---

## 🎓 Ce Qui a Été Modifié dans le Code

### Fichier : `app/(client)/home.tsx`

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

### Fichier : `hooks/useSupabaseArtisans.ts`

**Ajout de logs de débogage** :
```typescript
console.log('[useSupabaseArtisans] Loading artisans with filters:', filters);
console.log(`[useSupabaseArtisans] Loaded ${mapped.length} artisans`);
console.error('[useSupabaseArtisans] Error fetching artisans:', error);
```

Ces logs vous permettent de voir dans la console navigateur ce qui se passe.

---

## 🆘 Support

### Si le problème persiste après avoir tout essayé :

1. **Vérifiez les logs de la console** :
   - Ouvrez la console navigateur (F12)
   - Recherchez les messages `[useSupabaseArtisans]`
   - Notez les erreurs

2. **Exécutez le diagnostic SQL complet** :
   - Fichier : `database/DIAGNOSTIC_PLOMBIERS.sql`
   - Copiez le résultat

3. **Vérifiez les variables d'environnement** :
   - Fichier : `.env`
   - Vérifiez `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. **Testez la connexion Supabase** :
   ```sql
   -- Dans Supabase SQL Editor :
   SELECT COUNT(*) FROM artisans;
   SELECT COUNT(*) FROM users WHERE user_type = 'artisan';
   ```

---

## 📊 Structure des Données

```
Table: users
├── id (UUID)
├── name
├── email
├── user_type ('artisan', 'client', 'admin')
├── rating
└── review_count

Table: artisans (référence users.id)
├── id (UUID, FK → users.id)
├── category ('plumber', 'electrician', ...)
├── is_available (boolean)
├── is_suspended (boolean)
├── latitude (decimal)
├── longitude (decimal)
├── intervention_radius (integer, en km)
└── hourly_rate (decimal)
```

---

## 🔗 Liens Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Google Maps](https://www.google.com/maps) - Pour obtenir des coordonnées GPS
- [Expo Documentation](https://docs.expo.dev)

---

## 📝 Notes Importantes

1. **Coordonnées GPS** : Sans latitude/longitude, les artisans ne peuvent PAS apparaître sur la carte
2. **is_available** : Doit être `true` pour que l'artisan soit visible
3. **is_suspended** : Doit être `false` pour que l'artisan soit visible
4. **user_type** : Doit être `'artisan'` dans la table users
5. **Zone d'intervention** : L'artisan doit être à distance ≤ `intervention_radius` du client

---

## 🎉 Résultat Attendu

Après correction complète :

✅ Les artisans Plombiers apparaissent sur la carte avec des marqueurs  
✅ Les artisans Plombiers apparaissent dans la liste scrollable  
✅ Le compteur affiche le bon nombre d'artisans disponibles  
✅ Clic sur un artisan redirige vers la page de demande d'intervention  
✅ Toutes les fonctionnalités de l'app fonctionnent normalement  

---

**Dernière mise à jour** : ${new Date().toISOString().split('T')[0]}

# 🔄 Schéma du Flux de Chargement des Artisans

## 📊 Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                   INTERFACE CLIENT (Home Page)                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  app/(client)/home.tsx                                    │ │
│  │                                                           │ │
│  │  const { artisans } = useSupabaseArtisans({              │ │
│  │    isAvailable: true                                     │ │
│  │  });                                                      │ │
│  │                                                           │ │
│  │  ↓                                                        │ │
│  │  <InteractiveBackgroundMap artisans={artisans} />        │ │
│  │  <ArtisansList artisans={artisans} />                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                     HOOK SUPABASE                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  hooks/useSupabaseArtisans.ts                            │ │
│  │                                                           │ │
│  │  1. Construire la requête :                              │ │
│  │     SELECT * FROM artisans                               │ │
│  │     JOIN users ON artisans.id = users.id                 │ │
│  │     WHERE is_available = true                            │ │
│  │     AND is_suspended = false                             │ │
│  │                                                           │ │
│  │  2. Mapper les données vers le type Artisan             │ │
│  │  3. Filtrer par distance (si location fournie)          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                            │
│                                                                 │
│  ┌────────────────────┐        ┌────────────────────┐          │
│  │  Table: users      │        │  Table: artisans   │          │
│  ├────────────────────┤        ├────────────────────┤          │
│  │ id (PK)            │◄───┐   │ id (FK→users.id)   │          │
│  │ name               │    └───┤ category           │          │
│  │ email              │        │ hourly_rate        │          │
│  │ phone              │        │ is_available       │          │
│  │ photo              │        │ is_suspended       │          │
│  │ user_type          │        │ latitude           │          │
│  │ rating             │        │ longitude          │          │
│  │ review_count       │        │ intervention_radius│          │
│  └────────────────────┘        └────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Conditions de Visibilité d'un Artisan

Un artisan est **VISIBLE** sur la carte et dans la liste **UNIQUEMENT** si **TOUTES** ces conditions sont remplies :

```
┌─────────────────────────────────────────────────────────────────┐
│                   CHECKLIST DE VISIBILITÉ                       │
└─────────────────────────────────────────────────────────────────┘

1. ✅ users.user_type = 'artisan'
   │
   ├── ❌ Si = 'client' → INVISIBLE
   └── ❌ Si = 'admin' → INVISIBLE

2. ✅ Entrée existe dans la table 'artisans'
   │
   └── ❌ Si pas d'entrée → INVISIBLE

3. ✅ artisans.is_available = true
   │
   └── ❌ Si = false → INVISIBLE (même si tout le reste est OK)

4. ✅ artisans.is_suspended = false
   │
   └── ❌ Si = true → INVISIBLE (artisan banni/suspendu)

5. ✅ artisans.latitude IS NOT NULL
   │
   └── ❌ Si NULL → INVISIBLE sur la carte (peut être dans la liste)

6. ✅ artisans.longitude IS NOT NULL
   │
   └── ❌ Si NULL → INVISIBLE sur la carte (peut être dans la liste)

7. ✅ Distance ≤ artisans.intervention_radius (optionnel)
   │
   └── ❌ Si trop loin → INVISIBLE (selon filtrage géographique)

8. ✅ Politiques RLS (Row Level Security) autorisent la lecture
   │
   └── ❌ Si bloqué par RLS → INVISIBLE
```

---

## 🚦 Flux de Diagnostic

```
┌─────────────────────────────────────────────────────────────────┐
│              DIAGNOSTIC DU PROBLÈME                             │
└─────────────────────────────────────────────────────────────────┘

❓ Les Plombiers sont-ils INVISIBLES ?
│
├─── OUI → Continuer le diagnostic
│
└─── NON → Problème résolu ✅

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 1 : Vérifier l'Existence dans la BDD             │
└─────────────────────────────────────────────────────────────────┘

SELECT * FROM users WHERE user_type = 'artisan';
SELECT * FROM artisans WHERE category = 'plumber';

❓ Les plombiers existent-ils ?
│
├─── NON → Créer les comptes artisans
│          └─→ Exécuter : INSERT INTO users + INSERT INTO artisans
│
└─── OUI → Passer à l'étape 2

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 2 : Vérifier la Disponibilité                    │
└─────────────────────────────────────────────────────────────────┘

SELECT is_available, is_suspended FROM artisans WHERE category = 'plumber';

❓ is_available = true ET is_suspended = false ?
│
├─── NON → Corriger :
│          └─→ UPDATE artisans SET is_available = true, is_suspended = false
│
└─── OUI → Passer à l'étape 3

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 3 : Vérifier les Coordonnées GPS                 │
└─────────────────────────────────────────────────────────────────┘

SELECT latitude, longitude FROM artisans WHERE category = 'plumber';

❓ latitude et longitude sont NON NULL ?
│
├─── NON → Ajouter les coordonnées :
│          └─→ UPDATE artisans SET latitude = X, longitude = Y
│
└─── OUI → Passer à l'étape 4

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 4 : Vérifier user_type                           │
└─────────────────────────────────────────────────────────────────┘

SELECT user_type FROM users 
WHERE id IN (SELECT id FROM artisans WHERE category = 'plumber');

❓ user_type = 'artisan' ?
│
├─── NON → Corriger :
│          └─→ UPDATE users SET user_type = 'artisan'
│
└─── OUI → Passer à l'étape 5

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 5 : Vérifier les Politiques RLS                  │
└─────────────────────────────────────────────────────────────────┘

-- Tester la requête de l'app :
SELECT a.*, u.* FROM artisans a
INNER JOIN users u ON a.id = u.id
WHERE a.is_available = true AND a.is_suspended = false;

❓ Les plombiers apparaissent dans le résultat ?
│
├─── NON → Problème de politiques RLS :
│          └─→ Vérifier : Supabase Dashboard → Policies
│
└─── OUI → Passer à l'étape 6

┌─────────────────────────────────────────────────────────────────┐
│          ÉTAPE 6 : Vérifier le Code de l'App                    │
└─────────────────────────────────────────────────────────────────┘

// Ouvrir la console navigateur :
console.log('[useSupabaseArtisans] Loaded X artisans');

❓ Le nombre d'artisans chargés est correct ?
│
├─── NON → Vérifier :
│          ├─→ Variables d'environnement (.env)
│          ├─→ Connexion Supabase (lib/supabase.ts)
│          └─→ Cache (Ctrl+Shift+R pour hard refresh)
│
└─── OUI → Problème résolu ✅
```

---

## 🎯 Requête de Test Finale

```sql
-- Cette requête simule exactement ce que fait l'app
-- Si elle retourne vos plombiers, ils DOIVENT être visibles

SELECT 
  u.id,
  u.name,
  u.email,
  a.category,
  a.is_available,
  a.is_suspended,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  a.hourly_rate,
  u.rating,
  
  -- Diagnostic de visibilité
  CASE 
    WHEN u.user_type != 'artisan' THEN '❌ user_type incorrect'
    WHEN a.id IS NULL THEN '❌ Pas de profil artisan'
    WHEN NOT a.is_available THEN '❌ is_available = false'
    WHEN a.is_suspended THEN '❌ is_suspended = true'
    WHEN a.latitude IS NULL THEN '❌ latitude manquante'
    WHEN a.longitude IS NULL THEN '❌ longitude manquante'
    ELSE '✅ DEVRAIT ÊTRE VISIBLE'
  END as diagnostic

FROM users u
LEFT JOIN artisans a ON u.id = a.id
WHERE 
  (a.category = 'plumber' OR u.user_type = 'artisan')
ORDER BY a.created_at DESC;
```

**Résultat attendu** : Tous les plombiers doivent avoir le diagnostic **"✅ DEVRAIT ÊTRE VISIBLE"**.

---

## 📈 Exemple de Résultat Correct

```
┌──────────┬──────────────┬────────────┬──────────┬────────────┬──────────┐
│   name   │   category   │ is_avail.  │latitude  │ longitude  │diagnostic│
├──────────┼──────────────┼────────────┼──────────┼────────────┼──────────┤
│Jean D.   │ plumber      │ true       │ 48.8566  │ 2.3522     │ ✅ VISIBLE│
│Marie L.  │ plumber      │ true       │ 48.8606  │ 2.3376     │ ✅ VISIBLE│
└──────────┴──────────────┴────────────┴──────────┴────────────┴──────────┘

Résultat : 2 artisans Plombiers VISIBLES ✅
```

---

## 🔄 Cycle de Rafraîchissement

```
User ouvre l'app
       ↓
Component mount
       ↓
useSupabaseArtisans() → useEffect()
       ↓
loadArtisans() → Requête Supabase
       ↓
Données mappées → setArtisans(data)
       ↓
Re-render avec nouvelles données
       ↓
Carte + Liste affichent les artisans
```

**Temps de chargement typique** : 200-500ms

**Cache** : Aucun cache côté client par défaut. 
           À chaque navigation vers home.tsx, les données sont rechargées.

---

## 🛠️ Points de Débug

| Emplacement | Que vérifier |
|-------------|--------------|
| **Console navigateur** | Logs `[useSupabaseArtisans]` |
| **Network tab** | Requêtes vers Supabase (status 200 ?) |
| **Supabase SQL Editor** | Résultat de la requête de test |
| **App UI** | Compteur "X artisans disponibles" |
| **Carte** | Présence de marqueurs (pins) |
| **Liste** | Cartes artisans visibles |

---

## ✅ État Final Attendu

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOME PAGE CLIENT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🗺️  CARTE                                                      │
│     ┌─────────────────────────────────────┐                    │
│     │   📍 Marqueur Plombier 1            │                    │
│     │   📍 Marqueur Plombier 2            │                    │
│     │   📍 Marqueur Électricien           │                    │
│     │   📍 Vous (position user)           │                    │
│     └─────────────────────────────────────┘                    │
│                                                                 │
│  📊 BOTTOM SHEET                                                │
│     ┌─────────────────────────────────────┐                    │
│     │ 🔍 Recherche...                     │                    │
│     ├─────────────────────────────────────┤                    │
│     │ Artisans disponibles (5)            │                    │
│     ├─────────────────────────────────────┤                    │
│     │ 👤 Jean Dupont - Plombier ⭐ 4.8   │  ← VISIBLE         │
│     │ 👤 Marie Laurent - Plombier ⭐ 4.9 │  ← VISIBLE         │
│     │ 👤 Pierre Martin - Électricien      │                    │
│     └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

✅ Les 2 Plombiers sont VISIBLES sur la carte ET dans la liste
```

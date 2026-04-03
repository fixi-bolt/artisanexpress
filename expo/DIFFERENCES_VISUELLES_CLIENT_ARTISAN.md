# 🎨 Différences visuelles : Client vs Artisan

## 📱 Vue d'ensemble

Votre application comporte **deux interfaces complètement différentes** selon le rôle de l'utilisateur.

---

## 👤 INTERFACE CLIENT

### 🎨 Couleurs
- **Primaire** : Bleu `#007AFF`
- **Accent** : Bleu clair
- **Thème** : Moderne, accessible

### 🗂️ Navigation (Onglets en bas)
```
┌─────────┬─────────┬─────────┐
│ 🗺️ Carte │ ⏱️ Missions │ 👤 Profil │
└─────────┴─────────┴─────────┘
```

### 🏠 Écran d'accueil (home.tsx)
```
╔════════════════════════════════╗
║   🗺️ CARTE INTERACTIVE         ║
║     (Placeholder grande)       ║
╠════════════════════════════════╣
║                                ║
║  Bonjour                       ║
║  **Jean Dupont**               ║
║                                ║
║  ┌──────────────────────────┐ ║
║  │ 🔍 Rechercher artisan... │ ║
║  └──────────────────────────┘ ║
║                                ║
║  Choisissez un artisan    24/7 ║
║  ─────────────────────────     ║
║                                ║
║  ┌────────────────────────┐   ║
║  │ ✨ Ouvrir Super App 🆕 │   ║
║  └────────────────────────┘   ║
║                                ║
║  ┌────┐  ┌────┐  ┌────┐       ║
║  │ 🔧 │  │ ⚡ │  │ 🎨 │       ║
║  │Plom│  │Élec│  │Pein│       ║
║  └────┘  └────┘  └────┘       ║
║                                ║
║  ┌────┐  ┌────┐  ┌────┐       ║
║  │ 🚪 │  │ 🔥 │  │ 🪟 │       ║
║  │Serr│  │Chau│  │Vitr│       ║
║  └────┘  └────┘  └────┘       ║
║                                ║
║  [Voir tous les artisans ▼]   ║
║                                ║
║  ╔════════════════════════╗   ║
║  ║ ✨ Assistant IA        ║   ║
║  ║ Décrivez votre problème║   ║
║  ╚════════════════════════╝   ║
╚════════════════════════════════╝
```

### 📋 Écran Missions
- **Affichage** : Liste des missions demandées
- **Statuts** : En attente, En cours, Terminées
- **Actions** : Suivre la mission, Contacter l'artisan

### 👤 Écran Profil
- Informations personnelles
- Historique des missions
- Moyens de paiement
- Paramètres

---

## 👨‍🔧 INTERFACE ARTISAN

### 🎨 Couleurs
- **Primaire** : Orange `#FF9500`
- **Accent** : Orange clair
- **Thème** : Professionnel, énergique

### 🗂️ Navigation (Onglets en bas)
```
┌─────────┬─────────┬─────────┐
│ 💼 Missions │ 💰 Revenus │ 👤 Profil │
└─────────┴─────────┴─────────┘
```

### 🏠 Écran d'accueil (dashboard.tsx)
```
╔════════════════════════════════╗
║  Bonjour                    🔔 ║
║  **Marc Artisan**              ║
║                                ║
║  ╔════════════════════════╗   ║
║  ║ Statut:  🟢 Disponible ║   ║
║  ║              [Gérer]   ║   ║
║  ╚════════════════════════╝   ║
║                                ║
║  Nouvelles demandes      [ 3 ] ║
║  ───────────────────────       ║
║                                ║
║  ╔════════════════════════╗   ║
║  ║ ⏱️ Il y a 5 min   🔴URGENT║║
║  ║                        ║   ║
║  ║ **Réparation fuite**   ║   ║
║  ║ Robinet qui fuit...    ║   ║
║  ║                        ║   ║
║  ║ 📍 Paris 15ème    📷 2 ║   ║
║  ║                        ║   ║
║  ║ 💰 75€      [Accepter] ║   ║
║  ╚════════════════════════╝   ║
║                                ║
║  ╔════════════════════════╗   ║
║  ║ ⏱️ Il y a 12 min       ║   ║
║  ║ **Installation VMC**   ║   ║
║  ║ 📍 Levallois    💰 120€║   ║
║  ║              [Accepter] ║   ║
║  ╚════════════════════════╝   ║
║                                ║
║  ╔════════════════════════╗   ║
║  ║ 💡 Conseils            ║   ║
║  ║ • Acceptez rapidement  ║   ║
║  ║ • Maintenez note élevée║   ║
║  ╚════════════════════════╝   ║
╚════════════════════════════════╝
```

### 💰 Écran Revenus (earnings.tsx)
- **Solde disponible**
- **Revenus en attente**
- **Historique des paiements**
- **Statistiques mensuelles**

### 👤 Écran Profil
- Informations professionnelles
- Tarifs et rayon d'intervention
- Spécialités
- Abonnement Premium

---

## 🔄 Redirection automatique

### Logique dans `app/index.tsx`

```typescript
useEffect(() => {
  if (isAuthenticated) {
    // CLIENT → /(client)/home
    // ARTISAN → /(artisan)/dashboard
    router.replace(isClient ? '/(client)/home' : '/(artisan)/dashboard');
  }
}, [isAuthenticated, isClient]);
```

**Cette logique fonctionne correctement** ✅

---

## 🔍 Comment vérifier quelle interface vous voyez

### ✅ Vous voyez l'interface CLIENT si :
- [ ] Onglets : **Carte** / Missions / Profil
- [ ] Couleur principale : **Bleu**
- [ ] Écran principal : **Grille de catégories**
- [ ] Présence du bouton **"Ouvrir la Super App"**
- [ ] Placeholder carte en haut
- [ ] Emojis des métiers (🔧 ⚡ 🎨 🚪)

### ✅ Vous voyez l'interface ARTISAN si :
- [ ] Onglets : **Missions** / Revenus / Profil
- [ ] Couleur principale : **Orange**
- [ ] Écran principal : **Liste de demandes**
- [ ] Carte statut **"🟢 Disponible"**
- [ ] Boutons **"Accepter"** sur chaque demande
- [ ] Badge **"URGENT"** sur certaines missions

---

## ⚠️ Si vous voyez la même interface pour les deux

**Le problème n'est PAS dans le code.**

### Diagnostic :
1. Le champ `user_type` dans Supabase est **NULL** ou **incorrect**
2. L'AuthContext récupère un type incorrect
3. La redirection ne se fait pas correctement

### Solution :
Suivez **`SOLUTION_RAPIDE_ROLES.md`** → Étape 2 → Script SQL

---

## 🎯 Tableau comparatif

| Élément | CLIENT 👤 | ARTISAN 👨‍🔧 |
|---------|----------|------------|
| **Route principale** | `/(client)/home` | `/(artisan)/dashboard` |
| **Couleur primaire** | Bleu `#007AFF` | Orange `#FF9500` |
| **Onglet 1** | 🗺️ Carte | 💼 Missions |
| **Onglet 2** | ⏱️ Missions | 💰 Revenus |
| **Écran principal** | Recherche artisan | Accepter missions |
| **Action principale** | Demander un artisan | Accepter une mission |
| **Carte géographique** | ✅ Visible (grand) | ❌ Non affiché |
| **Liste demandes** | ❌ Pas de liste | ✅ Cartes avec bouton |
| **Super App** | ✅ Bouton présent | ❌ Non présent |
| **Badge "Disponible"** | ❌ Non affiché | ✅ En haut |

---

## 🧪 Test rapide

### Pour tester si c'est corrigé :

1. **Créer 2 comptes** :
   - `client@test.com` → user_type = 'client'
   - `artisan@test.com` → user_type = 'artisan'

2. **Se connecter avec client@test.com** :
   - Devrait voir : Grille de catégories + bouton Super App
   - Couleur : Bleu

3. **Se déconnecter et se connecter avec artisan@test.com** :
   - Devrait voir : Liste de demandes avec boutons "Accepter"
   - Couleur : Orange

**Si vous voyez ces deux interfaces différentes** → ✅ **PROBLÈME RÉSOLU !**

---

## 📱 Captures d'écran attendues

### CLIENT - Écran d'accueil
```
🗺️ Grande carte interactive
─────────────────────────
Bonjour, [Nom]
🔍 [Barre de recherche]
─────────────────────────
🔧 ⚡ 🎨 🚪
[Grille de catégories]
✨ [Ouvrir la Super App]
```

### ARTISAN - Écran d'accueil
```
Bonjour, [Nom]        🔔
🟢 Disponible   [Gérer]
─────────────────────────
Nouvelles demandes [3]
─────────────────────────
📋 Mission 1
💰 75€      [Accepter]
─────────────────────────
📋 Mission 2
💰 120€     [Accepter]
```

---

**🎯 Si vous ne voyez PAS ces différences** → Exécutez le script SQL dans **`SOLUTION_RAPIDE_ROLES.md`**

# 🎯 Différences entre Interface Client et Interface Artisan

## 📱 Structure de l'application

Votre application est **déjà correctement séparée** en deux interfaces distinctes. Voici la structure actuelle :

```
app/
  ├── (client)/          # Interface CLIENT
  │   ├── _layout.tsx    # Navigation avec 3 onglets
  │   ├── home.tsx       # Carte + recherche d'artisans
  │   ├── missions.tsx   # Suivi des demandes
  │   ├── profile.tsx    # Profil client
  │   ├── transactions.tsx
  │   ├── marketplace.tsx
  │   ├── premium.tsx
  │   ├── super-hub.tsx
  │   └── artisans.tsx
  │
  ├── (artisan)/         # Interface ARTISAN
  │   ├── _layout.tsx    # Navigation avec 3 onglets
  │   ├── dashboard.tsx  # Demandes à accepter
  │   ├── earnings.tsx   # Revenus et wallet
  │   ├── profile.tsx    # Profil artisan
  │   ├── subscription.tsx
  │   └── heatmap.tsx
  │
  └── (admin)/           # Interface ADMIN
      ├── _layout.tsx
      └── dashboard.tsx
```

## 🎨 Différences visuelles et fonctionnelles

### Interface CLIENT (`/client`)

#### Navigation (Tabs)
```typescript
✅ 3 onglets :
📍 Carte       → home.tsx
⏰ Missions    → missions.tsx
👤 Profil      → profile.tsx

Couleur : Bleu (#007AFF - Colors.primary)
```

#### Page d'accueil (home.tsx)
- 🗺️ Carte interactive (placeholder)
- 🔍 Barre de recherche d'artisans
- 🏗️ Grille de catégories (Plombier, Électricien, etc.)
- ⚡ Bouton "Super App"
- 🤖 Assistant IA
- **But** : Permettre au client de trouver et demander un artisan

#### Page Missions (missions.tsx)
- Liste des demandes du client
- Filtres par statut (en attente, en cours, terminé)
- Suivi en temps réel
- **But** : Suivre l'avancement des interventions

#### Page Profil (profile.tsx)
- Informations personnelles
- Statistiques : nombre de missions, note
- Moyens de paiement 💳
- Notifications 🔔
- Paramètres ⚙️
- **Couleur avatar** : Bleu

---

### Interface ARTISAN (`/artisan`)

#### Navigation (Tabs)
```typescript
✅ 3 onglets :
💼 Missions    → dashboard.tsx
💰 Revenus     → earnings.tsx
👤 Profil      → profile.tsx

Couleur : Orange (#FF9500 - Colors.secondary)
```

#### Page d'accueil (dashboard.tsx)
- 🟢 Indicateur de disponibilité
- 📢 Nouvelles demandes de clients à accepter
- ⏱️ Temps écoulé depuis la demande
- 🚨 Badge "URGENT"
- 💶 Prix estimé de la mission
- ✅ Bouton "Accepter"
- **But** : Recevoir et accepter des missions

#### Page Revenus (earnings.tsx)
- 💰 Solde du wallet
- 📊 Statistiques de gains
- 💸 Historique des transactions
- 🏦 Options de retrait
- **But** : Gérer les revenus

#### Page Profil (profile.tsx)
- Informations personnelles
- 🏷️ Badges de spécialités
- Statistiques : missions complétées, note
- 🔄 Switch de disponibilité
- 📍 Rayon d'intervention
- 💵 Tarifs (horaire, déplacement)
- **Couleur avatar** : Orange

---

## 🔀 Redirection automatique après connexion

### Code dans `app/index.tsx` (ligne 19)
```typescript
if (isAuthenticated) {
  router.replace(isClient ? '/(client)/home' : '/(artisan)/dashboard');
}
```

### Code dans `app/auth.tsx` (lignes 43-52)
```typescript
if (user.type === 'admin') {
  router.replace('/(admin)/dashboard');
} else if (user.type === 'client') {
  router.replace('/(client)/home');
} else {
  router.replace('/(artisan)/dashboard');
}
```

La redirection est **basée sur le champ `user.type`** dans la base de données.

---

## ⚠️ Pourquoi les deux interfaces pourraient sembler identiques ?

### Causes possibles :

1. **Tous les utilisateurs ont le même type**
   - Vérifiez dans Supabase : `SELECT DISTINCT user_type FROM users;`
   - Si tous sont "client" → aucun artisan n'existe

2. **Le champ `user_type` n'est pas défini**
   - Certains utilisateurs n'ont pas de type assigné
   - Le trigger `on_auth_user_created` ne s'est pas exécuté

3. **Les profils associés n'existent pas**
   - user_type = "client" mais pas de ligne dans la table `clients`
   - user_type = "artisan" mais pas de ligne dans la table `artisans`

4. **Cache de l'application**
   - Les données anciennes sont en cache
   - Solution : Déconnexion → Reconnexion

---

## 🛠️ Solution : Vérifier et corriger

### Étape 1 : Exécuter le script de vérification

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Exécutez le fichier `database/check-and-fix-user-types.sql`

Ce script va :
- ✅ Lister tous les utilisateurs et leurs types
- ⚠️ Détecter les incohérences
- 🔧 Corriger automatiquement les profils manquants
- 📊 Afficher des statistiques

### Étape 2 : Tester avec deux comptes différents

Créez deux nouveaux comptes pour tester :

#### Compte CLIENT :
```
Email : client-test@exemple.com
Type : Client
Doit arriver sur : /client/home
Onglets : Carte | Missions | Profil
Couleur : Bleu
```

#### Compte ARTISAN :
```
Email : artisan-test@exemple.com
Type : Artisan
Doit arriver sur : /artisan/dashboard
Onglets : Missions | Revenus | Profil
Couleur : Orange
```

### Étape 3 : Ajouter le composant de debug (temporaire)

Pour vérifier le type d'utilisateur connecté, ajoutez dans la page :

```typescript
import { DebugUserInfo } from '@/components/DebugUserInfo';

// Dans votre composant
<DebugUserInfo />
```

Cela affichera :
```
🔧 ARTISAN  (ou 👤 CLIENT)
email@exemple.com
Nom de l'utilisateur
ID: 972f58ff...
```

---

## 📊 Comparaison visuelle

| Fonctionnalité | Client | Artisan |
|---|---|---|
| **Couleur principale** | 🔵 Bleu | 🟠 Orange |
| **Écran d'accueil** | Carte + Catégories | Demandes à accepter |
| **Navigation principale** | Rechercher artisan | Accepter missions |
| **Onglet 1** | 📍 Carte | 💼 Missions |
| **Onglet 2** | ⏰ Missions | 💰 Revenus |
| **Onglet 3** | 👤 Profil | 👤 Profil |
| **Fonctionnalité unique** | Recherche, demande | Acceptation, gains |
| **Menu Profil** | Paiements, Support | Tarifs, Disponibilité |

---

## ✅ Checklist de vérification

- [ ] J'ai exécuté `database/check-and-fix-user-types.sql`
- [ ] J'ai vérifié que les utilisateurs ont bien un `user_type` défini
- [ ] J'ai vérifié que les profils `clients`/`artisans` existent
- [ ] J'ai testé avec deux comptes différents (1 client + 1 artisan)
- [ ] Les redirections fonctionnent correctement après connexion
- [ ] Les deux interfaces sont visuellement différentes
- [ ] Les couleurs sont différentes (bleu vs orange)
- [ ] Les onglets sont différents (Carte vs Missions/Revenus)

---

## 🆘 Si le problème persiste

1. **Consultez les logs** dans la console pour voir le `user.type`
2. **Vérifiez le trigger** dans Supabase :
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. **Lisez le guide détaillé** : `FIX_USER_TYPES.md`
4. **Supprimez les anciens utilisateurs de test** et recréez-en de nouveaux

---

## 🎉 Résultat attendu

Après correction, vous devriez avoir :

### Compte Client → Interface bleue avec recherche d'artisans
### Compte Artisan → Interface orange avec demandes à accepter

**Les deux interfaces sont déjà construites et fonctionnelles !** 🚀

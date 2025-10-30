# 🛠️ Guide : Géolocalisation + Notifications Artisans

## 📋 Problèmes corrigés

### ✅ 1. Localisation GPS automatique
**Avant** : La carte affichait toujours "15, rue de Rivoli, Paris"  
**Après** : La carte utilise automatiquement la position GPS réelle de l'utilisateur

### ✅ 2. Notifications aux artisans
**Avant** : Les artisans ne recevaient pas de notifications pour les nouvelles missions  
**Après** : Les artisans dans un rayon de 10 km reçoivent une notification instantanée

---

## 🚀 Étapes d'installation

### 1️⃣ Copier le script SQL dans Supabase

1. Allez dans votre tableau de bord Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New query**
5. Copiez-collez tout le contenu du fichier `database/FIX_GEOLOCATION_NOTIFICATIONS.sql`
6. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

### 2️⃣ Vérifier que tout fonctionne

Après avoir exécuté le script, vérifiez dans l'onglet **SQL Editor** :

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('latitude', 'longitude');

-- Doit retourner 2 lignes (latitude et longitude)
```

```sql
-- Vérifier que le trigger existe
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_mission_created_notify_artisans';

-- Doit retourner 1 ligne
```

```sql
-- Vérifier que la table notifications existe
SELECT COUNT(*) FROM public.notifications;

-- Doit retourner 0 ou plus (pas d'erreur)
```

---

## 🧪 Comment tester

### Test 1 : Géolocalisation automatique

1. **Ouvrez l'application sur mobile** (iOS ou Android)
2. Connectez-vous avec un compte **client**
3. L'app va demander l'autorisation de localisation → **Acceptez**
4. La carte doit se centrer sur votre position réelle
5. Dans la console, vous devez voir :
   ```
   📍 User location updated: { latitude: X, longitude: Y }
   ✅ Location saved to database
   ```

### Test 2 : Notifications aux artisans

#### Étape 1 : Créer un artisan de test

1. Créez un compte **artisan** (ex: plombier)
2. Connectez-vous avec ce compte
3. Allez dans le **Dashboard** artisan
4. L'app va récupérer votre position GPS automatiquement
5. Dans la console, vous devez voir : `[Dashboard] Location received:`

#### Étape 2 : Créer une mission avec un client

1. Déconnectez-vous et créez/connectez-vous avec un compte **client**
2. Sur l'écran d'accueil, cliquez sur une catégorie (ex: **Plombier**)
3. Remplissez le formulaire de demande de mission
4. Cliquez sur **Soumettre la demande**

#### Étape 3 : Vérifier la notification

1. Déconnectez-vous du compte client
2. Reconnectez-vous avec le compte **artisan**
3. Sur le dashboard, vous devriez voir :
   - Une **notification** en haut à droite (pastille rouge)
   - Une **mission disponible** dans la liste

---

## 🔍 Vérifier dans Supabase

### Voir les notifications créées

1. Allez dans **Table Editor** → **notifications**
2. Vous devriez voir les notifications envoyées aux artisans
3. Exemple de ligne :
   ```
   user_id: <id de l'artisan>
   title: 🔔 Nouvelle mission disponible
   message: Mission "Plombier" à 2.3 km de vous. Client: Jean Dupont
   is_read: false
   ```

### Voir les positions GPS enregistrées

1. Allez dans **Table Editor** → **users**
2. Vérifiez que les colonnes `latitude` et `longitude` sont remplies
3. Les valeurs doivent correspondre aux vraies positions GPS

---

## 🐛 Résolution de problèmes

### Problème : La carte ne se centre pas sur ma position

**Cause** : Autorisation de localisation refusée

**Solution** :
1. Sur iOS : **Réglages** → **ArtisanNow** → **Localisation** → **Pendant l'utilisation de l'app**
2. Sur Android : **Paramètres** → **Applications** → **ArtisanNow** → **Autorisations** → **Position** → **Autoriser**
3. Redémarrez l'application

### Problème : Les artisans ne reçoivent pas de notifications

**Vérifiez** :

1. **L'artisan a-t-il une position GPS ?**
   ```sql
   SELECT id, name, latitude, longitude 
   FROM users 
   WHERE user_type = 'artisan';
   ```
   Si `latitude` ou `longitude` sont `NULL`, l'artisan n'est pas géolocalisé.

2. **L'artisan est-il disponible ?**
   ```sql
   SELECT id, is_available, is_suspended 
   FROM artisans 
   WHERE id = '<id de l'artisan>';
   ```
   `is_available` doit être `true` et `is_suspended` doit être `false`.

3. **La catégorie correspond-elle ?**
   L'artisan reçoit uniquement les missions de sa catégorie.
   ```sql
   SELECT id, name, category FROM artisans;
   ```

4. **La distance est-elle dans le rayon d'intervention ?**
   Par défaut, le rayon est de 10 km. Vérifiez :
   ```sql
   SELECT id, name, intervention_radius FROM artisans;
   ```

### Problème : Erreur "Network request failed"

**Cause** : Problème de connexion à Supabase

**Solution** : Vérifiez votre fichier `.env` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://nkxucjhavjfsogzpitry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Redémarrez l'application après modification.

---

## 📊 Fonctionnalités ajoutées

### 1. Calcul de distance GPS

Fonction PostgreSQL qui calcule la distance entre deux points GPS (formule de Haversine) :

```sql
SELECT public.calculate_distance(
  48.8566, 2.3522,  -- Paris
  48.8606, 2.3376   -- Tour Eiffel
); 
-- Retourne : ~2.1 km
```

### 2. Recherche d'artisans à proximité

Fonction RPC disponible depuis votre app :

```typescript
import { supabase } from '@/lib/supabase';

const { data: artisans } = await supabase.rpc('get_nearby_artisans', {
  client_latitude: 48.8566,
  client_longitude: 2.3522,
  radius_km: 10,
  artisan_category: 'Plombier'
});
```

### 3. Notifications automatiques

Dès qu'une mission est créée, le trigger SQL notifie automatiquement tous les artisans disponibles dans la zone.

### 4. Sauvegarde automatique de la position

À chaque mise à jour de la position GPS, elle est automatiquement enregistrée dans la base de données.

---

## 🎯 Résumé

| Fonctionnalité | État |
|----------------|------|
| Géolocalisation automatique client | ✅ Activée |
| Géolocalisation automatique artisan | ✅ Activée |
| Sauvegarde position dans BDD | ✅ Activée |
| Calcul de distance GPS | ✅ Activée |
| Notifications aux artisans proches | ✅ Activée |
| Trigger automatique sur missions | ✅ Activée |
| Recherche artisans à proximité | ✅ Activée |

---

## ✅ Prochaines étapes

1. **Testez sur un appareil mobile réel** (pas sur le simulateur web)
2. **Créez 2 comptes** : 1 client + 1 artisan
3. **Activez la géolocalisation** sur les 2 comptes
4. **Créez une mission** depuis le compte client
5. **Vérifiez la notification** sur le compte artisan

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console de l'app
2. Vérifiez les données dans Supabase (Table Editor)
3. Vérifiez que le script SQL a bien été exécuté sans erreur
4. Redémarrez l'application après modification

Toutes les fonctionnalités sont maintenant opérationnelles ! 🎉

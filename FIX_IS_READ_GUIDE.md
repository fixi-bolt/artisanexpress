# 🔧 Correction de l'erreur "is_read" manquante

## ❌ Problème
```
ERROR: 42703: column "is_read" does not exist
```

## 🎯 Cause
La table `notifications` dans Supabase utilise la colonne `read` mais certaines parties du code tentent d'utiliser `is_read`.

## ✅ Solution

### Étape 1: Exécuter le script SQL dans Supabase

1. **Ouvrir Supabase Dashboard**
2. **Aller dans SQL Editor**
3. **Copier-coller le contenu du fichier** `COPIER_COLLER_SUPABASE_FIX_NOTIFICATIONS.sql`
4. **Cliquer sur RUN**

Ce script va :
- ✅ Renommer `read` en `is_read` dans la table notifications
- ✅ Mettre à jour les index
- ✅ Créer la fonction de notification des artisans à proximité
- ✅ Créer le trigger automatique
- ✅ Ajouter les colonnes `latitude` et `longitude` dans la table `users`

### Étape 2: Vérification

Après l'exécution, vous devriez voir dans les logs :
```
✅ Colonne "read" renommée en "is_read"
✅ Index mis à jour
✅ Trigger notifications: ✅
✅ Fonction notify_nearby_artisans: ✅
✅ Colonne users.latitude: ✅
✅ Colonne users.longitude: ✅
✅ TOUTES LES CORRECTIONS SONT APPLIQUÉES
```

## 📋 Ce qui a été corrigé

### 1. **Table notifications**
- Colonne `read` → `is_read`
- Index optimisés pour les requêtes de notifications non lues

### 2. **Notifications géolocalisées**
- Fonction `notify_nearby_artisans()` créée
- Trigger automatique sur nouvelle mission
- Calcul de distance avec Haversine
- Notifications envoyées aux artisans dans leur rayon d'intervention

### 3. **Géolocalisation users**
- Colonnes `latitude` et `longitude` ajoutées à la table `users`
- Permet de stocker la position GPS de tous les utilisateurs

## 🎯 Fonctionnalités maintenant actives

### Pour les clients :
- ✅ Création de mission enregistre la position GPS
- ✅ Les artisans proches sont automatiquement notifiés

### Pour les artisans :
- ✅ Réception de notifications pour missions dans leur rayon
- ✅ Distance affichée dans le message de notification
- ✅ Tri par distance (les plus proches en premier)

## 📊 Prochaines étapes

1. **Tester la création d'une mission** :
   - Se connecter en tant que client
   - Créer une nouvelle mission
   - Vérifier que les artisans proches reçoivent une notification

2. **Vérifier les notifications** :
   - Se connecter en tant qu'artisan
   - Regarder les notifications reçues
   - La distance doit apparaître dans le message

3. **Géolocalisation** :
   - S'assurer que l'app demande la permission GPS
   - Vérifier que la position est enregistrée dans Supabase

## 🐛 Dépannage

### Si l'erreur persiste après le script :

1. **Vérifier que le script s'est bien exécuté** :
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public';
```

Vous devez voir `is_read` dans la liste.

2. **Vider le cache de Supabase** :
   - Aller dans Project Settings
   - Cliquer sur "Restart project"

3. **Recharger l'application** :
   - Stopper le serveur de développement
   - Redémarrer avec `npm start` ou `bun start`

## 📝 Notes importantes

- ⚠️ Le script utilise `SECURITY DEFINER` pour les fonctions sensibles
- ⚠️ RLS (Row Level Security) est maintenu actif
- ⚠️ Les notifications ne sont envoyées qu'aux artisans vérifiés et disponibles
- ⚠️ Limite de 20 artisans notifiés par mission (pour éviter le spam)

## ✅ Confirmation de succès

Après l'exécution du script, l'erreur `column "is_read" does not exist` ne devrait plus apparaître.

Si vous voyez toujours l'erreur, veuillez fournir les logs complets de l'exécution du script SQL.

# 🧪 TEST DES NOTIFICATIONS - MODE D'EMPLOI

## ❓ Problème résolu
Le script de test échouait car il essayait de créer une mission avec un `client_id` qui n'existait pas.

## ✅ Solution
J'ai créé un script complet qui:
1. **Nettoie** les données de test précédentes
2. **Crée** un utilisateur et un client de test
3. **Crée** un utilisateur et un artisan de test
4. **Crée** une mission de test
5. **Simule** l'acceptation de la mission par l'artisan
6. **Vérifie** que les notifications sont bien créées

## 📋 ÉTAPES À SUIVRE

### 1️⃣ Copier le script
Le script se trouve dans: `database/TEST_NOTIFICATIONS_COMPLET.sql`

### 2️⃣ Aller dans Supabase
1. Ouvrir votre projet Supabase
2. Aller dans **SQL Editor**

### 3️⃣ Coller et exécuter
1. Créer une nouvelle query
2. Copier-coller TOUT le contenu du fichier
3. Cliquer sur **Run**

### 4️⃣ Analyser les résultats
Le script affichera:
```
🧪 DÉBUT DES TESTS DE NOTIFICATIONS
═══════════════════════════════════

🧹 Nettoyage des données de test précédentes...
✅ Nettoyage terminé

👤 Création d'un client de test...
✅ Client créé: [UUID]

👷 Création d'un artisan de test...
✅ Artisan créé: [UUID]

📋 Création d'une mission de test...
✅ Mission créée: [UUID]

✋ Simulation de l'acceptation de la mission...
✅ Mission acceptée par l'artisan

📬 Vérification des notifications créées...

✅ SUCCESS! 1 notification(s) créée(s)

Détails de la notification:
─────────────────────────────────
ID: [UUID]
User ID: [UUID]
Type: mission_accepted
Title: Mission acceptée
Message: Un artisan a accepté votre mission
Lu: false
Créée le: [DATE]
```

## 🎯 Ce qu'on teste

### ✅ Ce qui DOIT fonctionner:
- Création d'utilisateurs (client + artisan)
- Création de profils (clients + artisans)
- Création d'une mission
- Changement de statut de la mission à "accepted"
- **Déclenchement automatique du trigger**
- **Création d'une notification pour le client**

### ❌ Si ça ne marche pas:
Le script vous dira précisément ce qui ne va pas:
- Si le trigger n'existe pas
- Si la notification n'a pas été créée
- Affichera les IDs pour debug

## 🔍 Vérifications supplémentaires

### Voir toutes les notifications de test
```sql
SELECT 
    u.email,
    n.type,
    n.title,
    n.message,
    n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE u.email LIKE '%test-notif%'
ORDER BY n.created_at DESC;
```

### Voir toutes les missions de test
```sql
SELECT 
    m.id,
    m.title,
    m.status,
    m.artisan_id,
    c.name as client_name
FROM missions m
JOIN clients c ON c.id = m.client_id
WHERE m.title LIKE '%TEST%'
ORDER BY m.created_at DESC;
```

## 🧹 Nettoyage
Le script nettoie automatiquement les données de test précédentes à chaque exécution. Vous pouvez le lancer plusieurs fois sans problème.

## 💡 Notes importantes

1. **Le script crée de vraies données** dans votre base
2. Les emails utilisés sont: `client-test-notif@test.com` et `artisan-test-notif@test.com`
3. Les données sont préfixées avec 🧪 TEST pour être facilement identifiables
4. Le script attend 1 seconde après l'acceptation pour laisser le trigger s'exécuter

## ❓ Questions?

Si le test échoue, vérifiez:
1. Que le trigger `trigger_mission_accepted_notification` existe
2. Que la fonction `send_mission_accepted_notification()` existe
3. Que les permissions RLS permettent l'insertion dans `notifications`
4. Les logs de Supabase pour voir les erreurs

## 📸 Résultat attendu
À la fin, vous devriez voir une table avec vos notifications de test, montrant qu'une notification a bien été envoyée au client quand l'artisan a accepté la mission.

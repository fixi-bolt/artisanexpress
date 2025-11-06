# 🧪 GUIDE DE TEST DES NOTIFICATIONS

## 📋 Ce que fait ce test

Le script va :
1. ✅ Trouver un client et un artisan dans votre base
2. ✅ Créer une mission test
3. ✅ Accepter cette mission (simule l'action de l'artisan)
4. ✅ Vérifier qu'une notification est créée pour le client
5. ✅ Afficher les résultats détaillés

---

## 🚀 ÉTAPE 1 : Exécuter le test

### Dans Supabase :

1. Aller dans **SQL Editor**
2. Copier-coller le contenu de `database/TEST_NOTIFICATIONS_MAINTENANT.sql`
3. Cliquer sur **RUN**

---

## 📊 ÉTAPE 2 : Interpréter les résultats

### ✅ Si le test réussit, vous verrez :

```
✅ Client trouvé: [uuid]
✅ Artisan trouvé: [uuid]
✅ Mission créée: [uuid]
✅ Mission acceptée par l'artisan
🎉 SUCCÈS ! 1 notification(s) créée(s)
📋 Détails de la notification:
  - Type: mission_accepted, Titre: Mission acceptée, Lue: false
```

### ❌ Si le test échoue, vous verrez :

```
❌ ÉCHEC ! Aucune notification créée
🔍 Vérifier que:
   1. Le trigger est actif
   2. La fonction send_mission_accepted_notification existe
   3. Les RLS sont configurés correctement
```

---

## 🎯 ÉTAPE 3 : Tester côté application

### A. Côté Client (celui qui a créé la mission)

1. **Ouvrir l'app en tant que client**
2. **Aller sur l'écran des notifications**
3. **Vous devriez voir** :
   ```
   🎉 Mission acceptée
   Votre mission "🧪 TEST NOTIFICATION" a été acceptée par un artisan
   ```

### B. Vérifier le realtime

1. **Garder l'écran des notifications ouvert**
2. **Relancer le script SQL**
3. **La notification devrait apparaître instantanément** sans refresh

---

## 🔍 ÉTAPE 4 : Diagnostic si ça ne marche pas

### 1. Vérifier la configuration

Le script affiche automatiquement :
- ✅ Trigger actif
- ✅ Fonction existe
- ✅ Realtime activé

### 2. Vérifier les logs

Dans Supabase, aller dans **Logs** > **Postgres Logs** pour voir les erreurs

### 3. Vérifier les RLS

```sql
-- Tester manuellement les permissions
SELECT * FROM notifications WHERE user_id = '[votre-user-id]';
```

---

## 🎬 ÉTAPE 5 : Test complet bout en bout

### Scénario réel :

1. **Client** : Créer une vraie mission dans l'app
2. **Artisan** : Accepter cette mission
3. **Client** : Vérifier qu'il reçoit bien la notification

### Ce qui devrait se passer :

```
Client crée mission → Mission en BDD → Artisan voit la mission
       ↓
Artisan accepte → UPDATE missions → Trigger activé
       ↓
Fonction SQL → INSERT notification → Realtime
       ↓
Client reçoit notification instantanément
```

---

## 📱 ÉTAPE 6 : Nettoyer après les tests

Le script crée des missions de test avec le titre `🧪 TEST NOTIFICATION`.

Pour les supprimer :

```sql
DELETE FROM missions WHERE title = '🧪 TEST NOTIFICATION';
```

---

## 🆘 Problèmes courants

### "Aucun client trouvé"
→ Créer un compte client dans l'app d'abord

### "Aucun artisan trouvé"
→ Créer un compte artisan dans l'app d'abord

### "Notification créée mais pas reçue dans l'app"
→ Vérifier que le client est bien connecté et sur l'écran des notifications

### "Notification reçue mais pas en realtime"
→ Vérifier les permissions Realtime dans Supabase

---

## ✅ Checklist finale

- [ ] Script SQL exécuté avec succès
- [ ] Notification créée en BDD
- [ ] Notification visible dans l'app client
- [ ] Notification arrive en temps réel (sans refresh)
- [ ] Le badge de compteur se met à jour
- [ ] Le son de notification joue (si activé)

---

## 🎉 Résultat attendu

**Quand tout fonctionne** :

1. L'artisan accepte une mission
2. Le client reçoit instantanément une notification
3. L'écran des notifications affiche la nouvelle notification
4. Le badge du compteur se met à jour
5. Un son de notification est joué (optionnel)

**Temps de latence attendu** : < 1 seconde

---

## 📞 Si ça ne marche toujours pas

1. Lire les logs dans Supabase
2. Vérifier les erreurs dans la console de l'app
3. Vérifier que le user_id est correct
4. Vérifier les permissions RLS

---

**Bonne chance ! 🚀**

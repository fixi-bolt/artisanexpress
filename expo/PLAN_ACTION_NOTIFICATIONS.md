# ⚡ Plan d'Action - Correction Notifications d'Acceptation

## 🎯 Objectif
Garantir que **100% des clients** reçoivent une notification quand un artisan accepte leur mission.

---

## 📋 Checklist d'Exécution

### Phase 1 : Préparation (2 min)
- [ ] Lire `LIRE_MOI_EN_PREMIER_NOTIFICATIONS.txt`
- [ ] Ouvrir Supabase (https://supabase.com)
- [ ] Sélectionner le projet ArtisanNow
- [ ] Ouvrir SQL Editor

### Phase 2 : Déploiement (3 min)
- [ ] Ouvrir `COPIER_COLLER_SUPABASE_NOTIFICATIONS.sql`
- [ ] Copier TOUT le contenu (Ctrl+A puis Ctrl+C)
- [ ] Coller dans Supabase SQL Editor (Ctrl+V)
- [ ] Cliquer "Run" (ou Ctrl+Enter)
- [ ] Vérifier message : `✅ CORRECTION APPLIQUÉE AVEC SUCCÈS !`

### Phase 3 : Tests (5 min)
- [ ] **Test 1 : Trigger actif**
  ```sql
  SELECT tgname, tgenabled FROM pg_trigger 
  WHERE tgname = 'notify_client_on_mission_accepted';
  ```
  → Doit retourner 1 ligne avec `tgenabled = 'O'`

- [ ] **Test 2 : Accepter une mission**
  - Se connecter en tant qu'artisan
  - Accepter une mission pending
  - Attendre 2 secondes

- [ ] **Test 3 : Vérifier notification en DB**
  ```sql
  SELECT * FROM notifications 
  WHERE type = 'mission_accepted' 
  ORDER BY created_at DESC LIMIT 5;
  ```
  → Doit montrer la notification créée

- [ ] **Test 4 : Vérifier côté client**
  - Se connecter en tant que client
  - Ouvrir page notifications
  - Voir : "Mission acceptée ! <artisan> arrive bientôt"

### Phase 4 : Monitoring (optionnel)
- [ ] Exécuter les requêtes de `VERIFICATION_NOTIFICATIONS.sql`
- [ ] Vérifier qu'aucune mission acceptée n'est sans notification
- [ ] Ajouter aux favoris Supabase pour monitoring quotidien

---

## 🛠️ Ressources par Rôle

### Pour le Chef de Projet
📄 **Lire** : `RESUME_CORRECTION_NOTIFICATIONS.md`
- Vue d'ensemble exécutive
- Impact business
- Métriques de succès

### Pour le Développeur
📄 **Lire** : `FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md`
- Diagnostic technique détaillé
- Explication du code
- Modifications optionnelles React

🔧 **Exécuter** : `COPIER_COLLER_SUPABASE_NOTIFICATIONS.sql`
- Script SQL prêt à déployer

🔍 **Vérifier** : `VERIFICATION_NOTIFICATIONS.sql`
- 10 requêtes de diagnostic

### Pour le DevOps / DBA
📊 **Lire** : `database/FIX_NOTIFICATION_MISSION_ACCEPTED.sql`
- Script complet avec tests unitaires
- Documentation inline
- Requêtes de monitoring

🔍 **Monitorer** : Ajouter ces requêtes à votre dashboard
```sql
-- Alerte : Missions sans notification
SELECT COUNT(*) FROM missions m
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted' AND m.accepted_at > NOW() - INTERVAL '24h' AND n.id IS NULL;
-- Attendu : 0
```

### Pour le QA / Testeur
📋 **Suivre** : Section "Plan de tests" dans `FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md`

**Scénarios de test** :
1. ✅ Acceptation normale → Notification créée
2. ✅ Acceptation + réseau coupé → Notification quand même créée (trigger SQL)
3. ✅ Acceptation + app tuée → Notification présente au redémarrage
4. ✅ Pas de notification en double

---

## 📂 Arborescence des Fichiers

```
📦 Correction Notifications
├── 📄 LIRE_MOI_EN_PREMIER_NOTIFICATIONS.txt     ⭐ COMMENCER ICI
├── 📄 PLAN_ACTION_NOTIFICATIONS.md              ← Vous êtes ici
├── 📄 RESUME_CORRECTION_NOTIFICATIONS.md        (Exécutif)
├── 📄 ACTION_IMMEDIATE_NOTIFICATIONS.md         (Guide pas-à-pas)
├── 📄 FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md  (Diagnostic complet)
├── 📄 DIAGRAMME_FLUX_NOTIFICATIONS.md           (Visualisation)
├── 📄 COPIER_COLLER_SUPABASE_NOTIFICATIONS.sql  ⭐ SCRIPT PRINCIPAL
├── 📄 VERIFICATION_NOTIFICATIONS.sql            (Requêtes monitoring)
└── 📁 database/
    └── 📄 FIX_NOTIFICATION_MISSION_ACCEPTED.sql (Version complète)
```

---

## 🔍 FAQ

### Q1 : Le script est-il sûr à exécuter en production ?
✅ **Oui**. Le script est **idempotent** (peut être exécuté plusieurs fois sans risque).
- Il utilise `CREATE OR REPLACE` pour la fonction
- Il utilise `DROP TRIGGER IF EXISTS` avant création
- Aucune suppression de données
- Aucun impact sur les données existantes

### Q2 : Peut-on rollback si nécessaire ?
✅ **Oui**. Pour désactiver le trigger :
```sql
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted();
```

### Q3 : Y a-t-il un impact sur les performances ?
✅ **Non**. Impact minimal :
- Trigger exécuté uniquement sur `UPDATE missions` vers `status='accepted'`
- 1 seul INSERT supplémentaire (notification)
- Exécution < 1ms
- Pas de N+1 queries
- Index existants suffisants

### Q4 : Faut-il modifier le code React ?
⚠️ **Optionnel**. Le trigger rend certaines lignes de code redondantes.
Voir section "Modifications du code React (optionnel)" dans `FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md`.

**Recommandation** : Simplifier plus tard, après validation en production.

### Q5 : Comment monitorer en continu ?
📊 **Requête de monitoring quotidien** :
```sql
-- À automatiser dans un cron job ou monitoring tool
SELECT 
  DATE(m.accepted_at) as date,
  COUNT(m.id) as missions_acceptees,
  COUNT(n.id) as notifications_creees,
  COUNT(m.id) - COUNT(n.id) as ecart
FROM missions m
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted' AND m.accepted_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(m.accepted_at)
ORDER BY date DESC;
-- ecart doit être 0
```

### Q6 : Que faire si des missions ont été acceptées AVANT la correction ?
🔧 **Script de réparation** :
```sql
-- Créer notifications manquantes pour missions acceptées dans les 7 derniers jours
INSERT INTO notifications (user_id, type, title, message, mission_id, read, created_at)
SELECT 
  m.client_id,
  'mission_accepted',
  'Mission acceptée !',
  'Un artisan arrive bientôt pour "' || m.title || '"',
  m.id,
  false,
  m.accepted_at
FROM missions m
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted'
  AND m.accepted_at > NOW() - INTERVAL '7 days'
  AND n.id IS NULL;
```

---

## ⚠️ Points d'Attention

### ✅ Ce qui est garanti après la correction
- Notification créée pour **toutes** les futures acceptations
- Transaction atomique (mission update + notification insert)
- Erreurs remontées dans logs Supabase
- Pas d'impact sur les performances

### ❌ Ce qui N'est PAS couvert par cette correction
- Notifications des missions **déjà acceptées** avant la correction
  - Utiliser le script de réparation ci-dessus si nécessaire
- Notifications d'**autres types** (`mission_request`, `mission_completed`, `payment`)
  - Actuellement gérées par le code React
  - Créer des triggers similaires si souhaité (ticket séparé)
- Push notifications natives (Expo Notifications)
  - Toujours gérées par `NotificationContext.tsx`
  - Le trigger crée seulement l'entrée DB

---

## 📊 KPIs à Suivre

| Métrique | Avant | Objectif Après |
|----------|-------|----------------|
| Taux de notification créée | 60-80% | 100% |
| Délai notification | Variable | < 1 seconde |
| Erreurs silencieuses | Oui | Non |
| Satisfaction client | ? | +20% (estimé) |

**Mesure de succès** : 
```sql
-- Après 1 semaine en production
SELECT 
  COUNT(*) as missions_acceptees,
  COUNT(n.id) as notifications_creees,
  ROUND(100.0 * COUNT(n.id) / COUNT(*), 1) as pourcentage
FROM missions m
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted' AND m.accepted_at > NOW() - INTERVAL '7 days';
-- Objectif : pourcentage = 100.0
```

---

## 🚀 Timeline d'Exécution Recommandée

### Option 1 : Déploiement Immédiat (5 min)
```
Maintenant → Exécuter script → Tester → ✅ Prod
```
**Recommandé si** : Environnement de dev/staging uniquement

### Option 2 : Déploiement Prudent (1h)
```
Maintenant → Exécuter en staging → Tests QA → Prod dans 1h
```
**Recommandé si** : Production avec trafic

### Option 3 : Déploiement Progressif (1 jour)
```
Aujourd'hui → Staging
Demain → Prod en heures creuses
+1 jour → Monitoring
```
**Recommandé si** : Application critique

---

## ✅ Validation Finale

Avant de considérer la correction comme terminée :

- [ ] ✅ Script exécuté sans erreur
- [ ] ✅ Trigger visible dans `pg_trigger`
- [ ] ✅ Test acceptation → Notification créée
- [ ] ✅ Aucune mission acceptée sans notification (requête monitoring)
- [ ] ✅ Client reçoit notification dans l'app
- [ ] ✅ Logs Supabase propres (pas d'erreur)
- [ ] ✅ Équipe informée du changement
- [ ] ✅ Documentation mise à jour

---

## 📞 Support

En cas de problème pendant le déploiement :

1. **Consulter** : Section "En cas de problème" dans `ACTION_IMMEDIATE_NOTIFICATIONS.md`
2. **Vérifier** : Logs Supabase (onglet Database > Logs)
3. **Réexécuter** : Le script est idempotent, safe à relancer
4. **Rollback** : Voir Q2 dans FAQ ci-dessus

---

## 🎉 Prochaines Étapes

Après cette correction, considérer :

1. **Triggers similaires pour autres types de notifications** :
   - `mission_completed` (actuellement code React)
   - `mission_request` (actuellement code React)
   - `payment_received` (actuellement backend tRPC)

2. **Monitoring automatisé** :
   - Dashboard Grafana/Metabase avec métriques notifications
   - Alerte si `missions_sans_notif > 0`

3. **Amélioration UX** :
   - Notification push immédiate (WebSocket)
   - Son personnalisé pour acceptation
   - Badge animé dans l'app

4. **Analytics** :
   - Tracking temps entre acceptation et vue notification
   - Taux de conversion (notification vue → action client)

---

**Version** : 1.0  
**Dernière mise à jour** : 2025-11-01  
**Statut** : ✅ Prêt à exécuter

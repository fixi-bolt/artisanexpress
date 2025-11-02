-- ========================================
-- 🔍 REQUÊTES DE VÉRIFICATION - Notifications d'acceptation
-- ========================================
-- À exécuter dans Supabase SQL Editor après avoir appliqué le fix
-- ========================================

-- ========================================
-- 1. VÉRIFIER QUE LE TRIGGER EST ACTIF
-- ========================================
SELECT 
  t.tgname as "Nom du Trigger",
  t.tgrelid::regclass as "Table",
  p.proname as "Fonction",
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ Actif'
    WHEN t.tgenabled = 'D' THEN '❌ Désactivé'
    ELSE '⚠️ Autre'
  END as "Statut",
  obj_description(t.oid, 'pg_trigger') as "Description"
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'notify_client_on_mission_accepted';

-- ========================================
-- 2. VÉRIFIER LES NOTIFICATIONS RÉCENTES D'ACCEPTATION
-- ========================================
SELECT 
  n.id as "ID Notification",
  n.created_at as "Date Création",
  n.title as "Titre",
  n.message as "Message",
  n.read as "Lu",
  u.name as "Client",
  u.email as "Email Client",
  m.id as "ID Mission",
  m.title as "Titre Mission",
  m.status as "Statut Mission",
  m.accepted_at as "Date Acceptation"
FROM notifications n
JOIN users u ON n.user_id = u.id
LEFT JOIN missions m ON n.mission_id = m.id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC
LIMIT 20;

-- ========================================
-- 3. STATISTIQUES DES NOTIFICATIONS PAR TYPE
-- ========================================
SELECT 
  type as "Type",
  COUNT(*) as "Total",
  COUNT(CASE WHEN read THEN 1 END) as "Lues",
  COUNT(CASE WHEN NOT read THEN 1 END) as "Non lues",
  ROUND(100.0 * COUNT(CASE WHEN read THEN 1 END) / NULLIF(COUNT(*), 0), 1) as "% Lues",
  MIN(created_at) as "Première",
  MAX(created_at) as "Dernière"
FROM notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY "Total" DESC;

-- ========================================
-- 4. DÉTECTER LES MISSIONS ACCEPTÉES SANS NOTIFICATION (BUG)
-- ========================================
-- Cette requête doit retourner 0 lignes si le trigger fonctionne
SELECT 
  m.id as "ID Mission",
  m.title as "Titre Mission",
  m.status as "Statut",
  m.accepted_at as "Acceptée le",
  m.client_id as "ID Client",
  u.name as "Nom Client",
  u.email as "Email Client",
  COUNT(n.id) as "Nb Notifications"
FROM missions m
JOIN users u ON m.client_id = u.id
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted'
  AND m.accepted_at > NOW() - INTERVAL '7 days'  -- Missions acceptées dans les 7 derniers jours
GROUP BY m.id, m.title, m.status, m.accepted_at, m.client_id, u.name, u.email
HAVING COUNT(n.id) = 0  -- Aucune notification trouvée
ORDER BY m.accepted_at DESC;

-- ⚠️ Si cette requête retourne des lignes :
-- Cela signifie que des missions ont été acceptées SANS notification créée
-- Causes possibles :
--   - Le trigger n'était pas encore activé
--   - Le trigger a été désactivé temporairement
--   - Une erreur s'est produite dans la fonction trigger

-- ========================================
-- 5. TESTER LA NOTIFICATION POUR UNE MISSION SPÉCIFIQUE
-- ========================================
-- Remplacez <MISSION_ID> par l'ID de la mission à vérifier
/*
SELECT 
  m.id as "ID Mission",
  m.title as "Titre",
  m.status as "Statut",
  m.accepted_at as "Acceptée le",
  m.artisan_id as "ID Artisan",
  a_user.name as "Nom Artisan",
  m.client_id as "ID Client",
  c_user.name as "Nom Client",
  n.id as "ID Notification",
  n.created_at as "Notification créée le",
  n.read as "Notification lue",
  n.title as "Titre Notification",
  n.message as "Message"
FROM missions m
JOIN users c_user ON m.client_id = c_user.id
LEFT JOIN users a_user ON m.artisan_id = a_user.id
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.id = '<MISSION_ID>';
*/

-- ========================================
-- 6. VÉRIFIER LES PERFORMANCES DU TRIGGER
-- ========================================
-- Compter le nombre d'appels du trigger
SELECT 
  schemaname as "Schema",
  tablename as "Table",
  n_tup_upd as "Nb Updates",
  n_tup_hot_upd as "HOT Updates",
  last_vacuum as "Dernier Vacuum",
  last_autovacuum as "Dernier Autovacuum"
FROM pg_stat_user_tables
WHERE tablename = 'missions';

-- ========================================
-- 7. TIMELINE DES NOTIFICATIONS VS ACCEPTATIONS
-- ========================================
-- Compare le nombre de missions acceptées vs notifications créées par jour
WITH accepted_missions AS (
  SELECT 
    DATE(accepted_at) as date,
    COUNT(*) as missions_acceptees
  FROM missions
  WHERE status = 'accepted'
    AND accepted_at > NOW() - INTERVAL '30 days'
  GROUP BY DATE(accepted_at)
),
created_notifications AS (
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as notifications_creees
  FROM notifications
  WHERE type = 'mission_accepted'
    AND created_at > NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
)
SELECT 
  COALESCE(a.date, n.date) as "Date",
  COALESCE(a.missions_acceptees, 0) as "Missions Acceptées",
  COALESCE(n.notifications_creees, 0) as "Notifications Créées",
  CASE 
    WHEN COALESCE(a.missions_acceptees, 0) = COALESCE(n.notifications_creees, 0) 
    THEN '✅ OK'
    ELSE '⚠️ ÉCART'
  END as "Statut"
FROM accepted_missions a
FULL OUTER JOIN created_notifications n ON a.date = n.date
ORDER BY COALESCE(a.date, n.date) DESC;

-- ========================================
-- 8. VÉRIFIER LES POLITIQUES RLS SUR NOTIFICATIONS
-- ========================================
-- S'assurer que les clients peuvent lire leurs notifications
SELECT 
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Politique",
  permissive as "Permissive",
  roles as "Rôles",
  cmd as "Commande",
  qual as "Condition"
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ========================================
-- 9. AUDIT - DERNIÈRES NOTIFICATIONS CRÉÉES
-- ========================================
-- Affiche les 50 dernières notifications tous types confondus
SELECT 
  n.id,
  n.type as "Type",
  n.created_at as "Créée le",
  u.name as "Destinataire",
  n.title as "Titre",
  n.message as "Message",
  n.read as "Lue",
  CASE 
    WHEN n.mission_id IS NOT NULL THEN '✅ Liée mission'
    ELSE '⚠️ Sans mission'
  END as "Contexte"
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 50;

-- ========================================
-- 10. NETTOYER LES ANCIENNES NOTIFICATIONS (optionnel)
-- ========================================
-- ⚠️ NE PAS EXÉCUTER sans validation !
-- Supprime les notifications lues de plus de 90 jours
/*
DELETE FROM notifications
WHERE read = true
  AND created_at < NOW() - INTERVAL '90 days';
*/

-- ========================================
-- FIN DES REQUÊTES DE VÉRIFICATION
-- ========================================
-- Utilisez ces requêtes pour :
-- 1. Vérifier que le trigger est actif (Requête 1)
-- 2. Voir les dernières notifications créées (Requête 2)
-- 3. Détecter les bugs (Requête 4)
-- 4. Monitorer les performances (Requête 6-7)

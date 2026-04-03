-- ========================================
-- 🔧 CORRECTION VISIBILITÉ ARTISANS PLOMBIERS
-- ========================================
-- Ce script corrige les problèmes de visibilité des artisans Plombiers

-- IMPORTANT : Exécutez d'abord DIAGNOSTIC_PLOMBIERS.sql pour identifier les problèmes

-- ========================================
-- ÉTAPE 1 : Activer la disponibilité des plombiers
-- ========================================
-- Met is_available = true pour tous les plombiers non suspendus
UPDATE artisans
SET 
  is_available = true,
  updated_at = NOW()
WHERE 
  category = 'plumber'
  AND is_suspended = false
  AND is_available = false;

-- ========================================
-- ÉTAPE 2 : Ajouter des coordonnées GPS par défaut si manquantes
-- ========================================
-- Attention : Remplacez ces coordonnées par les vraies coordonnées des artisans
-- Ces coordonnées sont Paris centre (48.8566, 2.3522)
-- Vous devez demander aux artisans leur vraie localisation !

-- Pour voir quels artisans ont besoin de coordonnées :
SELECT 
  u.id,
  u.name,
  u.email,
  a.category
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE 
  a.category = 'plumber'
  AND (a.latitude IS NULL OR a.longitude IS NULL);

-- NE PAS EXÉCUTER cette requête sans avoir les vraies coordonnées :
-- UPDATE artisans
-- SET 
--   latitude = 48.8566,
--   longitude = 2.3522,
--   intervention_radius = 20,
--   updated_at = NOW()
-- WHERE 
--   category = 'plumber'
--   AND (latitude IS NULL OR longitude IS NULL);

-- ========================================
-- ÉTAPE 3 : Vérifier que user_type est correct
-- ========================================
-- S'assure que tous les artisans ont user_type = 'artisan'
UPDATE users
SET 
  user_type = 'artisan',
  updated_at = NOW()
WHERE 
  id IN (SELECT id FROM artisans WHERE category = 'plumber')
  AND user_type != 'artisan';

-- ========================================
-- ÉTAPE 4 : Créer le profil artisan si manquant
-- ========================================
-- Insère un profil artisan pour les utilisateurs qui n'en ont pas
-- ATTENTION : Cette requête doit être adaptée selon votre cas d'usage

-- Exemple d'insertion (à adapter) :
-- INSERT INTO artisans (
--   id,
--   category,
--   hourly_rate,
--   travel_fee,
--   intervention_radius,
--   is_available,
--   latitude,
--   longitude,
--   specialties
-- )
-- SELECT 
--   u.id,
--   'plumber' as category,
--   45.00 as hourly_rate,
--   25.00 as travel_fee,
--   20 as intervention_radius,
--   true as is_available,
--   48.8566 as latitude,  -- À REMPLACER
--   2.3522 as longitude,   -- À REMPLACER
--   ARRAY['Installation', 'Dépannage', 'Débouchage'] as specialties
-- FROM users u
-- WHERE u.user_type = 'artisan'
--   AND NOT EXISTS (SELECT 1 FROM artisans WHERE id = u.id)
--   AND u.email LIKE '%plomb%';  -- Adaptez ce filtre selon vos besoins

-- ========================================
-- ÉTAPE 5 : Vérification finale
-- ========================================
-- Affiche tous les plombiers qui devraient maintenant être visibles
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
  CASE 
    WHEN a.is_available = true 
      AND a.is_suspended = false 
      AND a.latitude IS NOT NULL 
      AND a.longitude IS NOT NULL 
      AND u.user_type = 'artisan'
    THEN '✅ VISIBLE'
    ELSE '❌ INVISIBLE'
  END as statut_visibilite
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber'
ORDER BY a.created_at DESC;

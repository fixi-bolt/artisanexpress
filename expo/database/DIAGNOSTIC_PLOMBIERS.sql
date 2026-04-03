-- ========================================
-- 🔍 DIAGNOSTIC ARTISANS PLOMBIERS
-- ========================================
-- Ce script vérifie pourquoi les plombiers ne sont pas visibles sur la carte

-- 1. Vérifier tous les artisans plombiers dans la base
SELECT 
  u.id,
  u.name,
  u.email,
  u.user_type,
  u.rating,
  u.review_count,
  a.category,
  a.is_available,
  a.is_suspended,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  a.hourly_rate,
  a.created_at
FROM users u
LEFT JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber'
ORDER BY a.created_at DESC;

-- 2. Vérifier si les utilisateurs existent mais sans profil artisan
SELECT 
  u.id,
  u.name,
  u.email,
  u.user_type,
  'PAS DE PROFIL ARTISAN' as probleme
FROM users u
WHERE u.user_type = 'artisan'
  AND NOT EXISTS (SELECT 1 FROM artisans WHERE id = u.id);

-- 3. Compter les artisans par catégorie
SELECT 
  a.category,
  COUNT(*) as total,
  COUNT(CASE WHEN a.is_available THEN 1 END) as disponibles,
  COUNT(CASE WHEN a.is_suspended THEN 1 END) as suspendus,
  COUNT(CASE WHEN a.latitude IS NULL OR a.longitude IS NULL THEN 1 END) as sans_localisation
FROM artisans a
GROUP BY a.category
ORDER BY a.category;

-- 4. Vérifier les problèmes spécifiques des plombiers
SELECT 
  u.name,
  u.email,
  CASE 
    WHEN a.id IS NULL THEN 'Pas de profil artisan'
    WHEN NOT a.is_available THEN 'Non disponible (is_available = false)'
    WHEN a.is_suspended THEN 'Suspendu (is_suspended = true)'
    WHEN a.latitude IS NULL OR a.longitude IS NULL THEN 'Pas de coordonnées GPS'
    WHEN u.user_type != 'artisan' THEN 'user_type incorrect : ' || u.user_type
    ELSE 'Devrait être visible'
  END as statut
FROM users u
LEFT JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber' OR (u.user_type = 'artisan' AND a.category IS NULL);

-- 5. Lister tous les artisans disponibles (tous types)
SELECT 
  u.name,
  a.category,
  a.is_available,
  a.latitude,
  a.longitude
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.is_available = true 
  AND a.is_suspended = false
  AND a.latitude IS NOT NULL 
  AND a.longitude IS NOT NULL
ORDER BY a.category, u.name;

-- ========================================
-- 📍 AJOUTER COORDONNÉES GPS AUX ARTISANS
-- ========================================

-- Ce script permet d'ajouter des coordonnées GPS aux artisans qui n'en ont pas.
-- Les coordonnées doivent être obtenues via une API de géocodage (Google Maps, OpenStreetMap)
-- ou manuellement via Google Maps en cherchant l'adresse de l'artisan.

-- ========================================
-- ÉTAPE 1 : Identifier les artisans sans coordonnées
-- ========================================

SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  a.category,
  a.latitude,
  a.longitude,
  '❌ Coordonnées manquantes' as statut
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.latitude IS NULL OR a.longitude IS NULL
ORDER BY a.category, u.name;

-- ========================================
-- ÉTAPE 2 : Obtenir les Coordonnées GPS
-- ========================================

-- Option A : Utiliser Google Maps
-- 1. Allez sur https://www.google.com/maps
-- 2. Recherchez l'adresse de l'artisan
-- 3. Clic droit sur le marqueur → "What's here?"
-- 4. Les coordonnées apparaissent en bas : latitude, longitude

-- Option B : Utiliser OpenStreetMap
-- 1. Allez sur https://www.openstreetmap.org
-- 2. Recherchez l'adresse
-- 3. Clic droit → "Show address"
-- 4. Les coordonnées sont affichées

-- ========================================
-- ÉTAPE 3 : Ajouter les Coordonnées (TEMPLATE)
-- ========================================

-- EXEMPLE : Artisan à Paris 15e (48.8420, 2.3014)
-- Remplacez 'ARTISAN_USER_ID' par l'ID réel de l'utilisateur
-- Remplacez les coordonnées par les vraies valeurs

-- UPDATE artisans
-- SET 
--   latitude = 48.8420,
--   longitude = 2.3014,
--   intervention_radius = 20,  -- Rayon en kilomètres
--   updated_at = NOW()
-- WHERE id = 'ARTISAN_USER_ID';

-- ========================================
-- ÉTAPE 4 : Exemples pour Différentes Villes
-- ========================================

-- Paris Centre (75001-75020)
-- Coordonnées approximatives : 48.8566, 2.3522
-- UPDATE artisans SET latitude = 48.8566, longitude = 2.3522, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_PARIS';

-- Lyon Centre (69001-69009)
-- Coordonnées approximatives : 45.7640, 4.8357
-- UPDATE artisans SET latitude = 45.7640, longitude = 4.8357, intervention_radius = 25, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_LYON';

-- Marseille Centre (13001-13016)
-- Coordonnées approximatives : 43.2965, 5.3698
-- UPDATE artisans SET latitude = 43.2965, longitude = 5.3698, intervention_radius = 30, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_MARSEILLE';

-- Toulouse Centre (31000-31500)
-- Coordonnées approximatives : 43.6047, 1.4442
-- UPDATE artisans SET latitude = 43.6047, longitude = 1.4442, intervention_radius = 25, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_TOULOUSE';

-- Bordeaux Centre (33000-33800)
-- Coordonnées approximatives : 44.8378, -0.5792
-- UPDATE artisans SET latitude = 44.8378, longitude = -0.5792, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_BORDEAUX';

-- Nice Centre (06000-06300)
-- Coordonnées approximatives : 43.7102, 7.2620
-- UPDATE artisans SET latitude = 43.7102, longitude = 7.2620, intervention_radius = 15, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_NICE';

-- Nantes Centre (44000-44300)
-- Coordonnées approximatives : 47.2184, -1.5536
-- UPDATE artisans SET latitude = 47.2184, longitude = -1.5536, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_NANTES';

-- Strasbourg Centre (67000)
-- Coordonnées approximatives : 48.5734, 7.7521
-- UPDATE artisans SET latitude = 48.5734, longitude = 7.7521, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_STRASBOURG';

-- Lille Centre (59000-59800)
-- Coordonnées approximatives : 50.6292, 3.0573
-- UPDATE artisans SET latitude = 50.6292, longitude = 3.0573, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_LILLE';

-- Rennes Centre (35000-35700)
-- Coordonnées approximatives : 48.1173, -1.6778
-- UPDATE artisans SET latitude = 48.1173, longitude = -1.6778, intervention_radius = 20, updated_at = NOW() 
-- WHERE id = 'ID_ARTISAN_RENNES';

-- ========================================
-- ÉTAPE 5 : Ajouter en Masse (si tous dans la même ville)
-- ========================================

-- Si tous vos artisans Plombiers sont à Paris, par exemple :
-- UPDATE artisans
-- SET 
--   latitude = 48.8566,
--   longitude = 2.3522,
--   intervention_radius = 20,
--   updated_at = NOW()
-- WHERE category = 'plumber' 
--   AND (latitude IS NULL OR longitude IS NULL);

-- ⚠️ ATTENTION : Cette approche est approximative !
-- Les artisans auront tous les mêmes coordonnées.
-- Pour une meilleure UX, utilisez les vraies adresses.

-- ========================================
-- ÉTAPE 6 : Vérification Finale
-- ========================================

-- Tous les artisans devraient maintenant avoir des coordonnées
SELECT 
  u.id,
  u.name,
  u.email,
  a.category,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  CASE 
    WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL 
    THEN '✅ Coordonnées OK'
    ELSE '❌ Coordonnées manquantes'
  END as statut_gps
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber'
ORDER BY a.created_at DESC;

-- ========================================
-- ÉTAPE 7 : Test de Distance
-- ========================================

-- Tester la distance entre un point (ex: client à Paris) et les artisans
-- Latitude/Longitude exemple client : 48.8566, 2.3522 (Paris centre)

SELECT 
  u.name,
  a.category,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  calculate_distance(
    48.8566,  -- Latitude client
    2.3522,   -- Longitude client
    a.latitude,
    a.longitude
  ) as distance_km,
  CASE 
    WHEN calculate_distance(48.8566, 2.3522, a.latitude, a.longitude) <= a.intervention_radius
    THEN '✅ Dans la zone d''intervention'
    ELSE '❌ Hors zone'
  END as statut_zone
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.is_available = true
  AND a.is_suspended = false
  AND a.latitude IS NOT NULL
  AND a.longitude IS NOT NULL
ORDER BY distance_km ASC;

-- Si vos artisans Plombiers n'apparaissent pas dans ce test avec "✅ Dans la zone",
-- c'est qu'ils sont trop loin du point de test ou que leur rayon est trop petit.

-- ========================================
-- 📝 NOTES IMPORTANTES
-- ========================================

-- 1. Les coordonnées GPS doivent être précises pour une bonne expérience utilisateur
-- 2. Le rayon d'intervention (intervention_radius) doit être réaliste :
--    - En ville : 10-20 km
--    - En banlieue : 20-30 km
--    - En zone rurale : 30-50 km
-- 3. Testez toujours après avoir ajouté les coordonnées
-- 4. Validez que les artisans apparaissent sur la carte dans l'app

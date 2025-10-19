-- ========================================
-- 🌱 ARTISANNOW - SEED DATA
-- ========================================

-- Insert test users
INSERT INTO users (id, email, name, phone, photo, user_type, rating, review_count)
VALUES
  ('cli-1', 'alex.durand@email.com', 'Alexandre Durand', '+33 6 98 76 54 32', 'https://i.pravatar.cc/150?img=68', 'client', 4.9, 45),
  ('art-1', 'jean.dupont@email.com', 'Jean Dupont', '+33 6 12 34 56 78', 'https://i.pravatar.cc/150?img=12', 'artisan', 4.8, 127),
  ('art-2', 'marie.laurent@email.com', 'Marie Laurent', '+33 6 23 45 67 89', 'https://i.pravatar.cc/150?img=47', 'artisan', 4.9, 203),
  ('art-3', 'pierre.martin@email.com', 'Pierre Martin', '+33 6 34 56 78 90', 'https://i.pravatar.cc/150?img=33', 'artisan', 4.7, 89),
  ('art-4', 'sophie.bernard@email.com', 'Sophie Bernard', '+33 6 45 67 89 01', 'https://i.pravatar.cc/150?img=44', 'artisan', 4.6, 156),
  ('art-5', 'luc.petit@email.com', 'Luc Petit', '+33 6 56 78 90 12', 'https://i.pravatar.cc/150?img=15', 'artisan', 4.9, 178),
  ('admin-1', 'admin@artisannow.com', 'Admin ArtisanNow', '+33 1 23 45 67 89', 'https://i.pravatar.cc/150?img=12', 'admin', 5.0, 0);

-- Insert client data
INSERT INTO clients (id) VALUES ('cli-1');

-- Insert artisans data
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available, latitude, longitude, completed_missions, specialties)
VALUES
  ('art-1', 'plumber', 45, 25, 20, true, 48.8566, 2.3522, 134, ARRAY['Fuite d''eau', 'Installation', 'Débouchage']),
  ('art-2', 'electrician', 50, 30, 30, true, 48.8606, 2.3376, 215, ARRAY['Tableau électrique', 'Dépannage', 'Installation']),
  ('art-3', 'locksmith', 60, 35, 15, true, 48.8526, 2.3488, 95, ARRAY['Ouverture de porte', 'Changement de serrure', 'Blindage']),
  ('art-4', 'painter', 40, 20, 25, false, 48.8466, 2.3522, 168, ARRAY['Peinture intérieure', 'Rénovation', 'Papier peint']),
  ('art-5', 'carpenter', 48, 28, 20, true, 48.8666, 2.3422, 189, ARRAY['Meubles sur mesure', 'Parquet', 'Réparation']);

-- Insert admin data
INSERT INTO admins (id, role, permissions)
VALUES ('admin-1', 'super_admin', ARRAY['users', 'missions', 'payments', 'stats']);

-- Insert payment methods
INSERT INTO payment_methods (id, client_id, type, last4, is_default)
VALUES ('pm-1', 'cli-1', 'card', '4242', true);

-- Insert test missions
INSERT INTO missions (id, client_id, artisan_id, category, title, description, photos, latitude, longitude, address, status, estimated_price, final_price, commission, created_at, accepted_at, completed_at)
VALUES
  ('mis-1', 'cli-1', 'art-1', 'plumber', 'Fuite sous évier', 'Fuite importante sous l''évier de la cuisine depuis ce matin', ARRAY[]::TEXT[], 48.8566, 2.3522, '15 Rue de Rivoli, 75001 Paris', 'completed', 120, 135, 0.15, '2025-01-10 09:30:00', '2025-01-10 09:35:00', '2025-01-10 11:20:00'),
  ('mis-2', 'cli-1', 'art-2', 'electrician', 'Panne électrique partielle', 'Plus d''électricité dans la salle de bain et une chambre', ARRAY[]::TEXT[], 48.8606, 2.3376, '8 Place de la Concorde, 75008 Paris', 'in_progress', 180, NULL, 0.15, '2025-01-13 14:15:00', '2025-01-13 14:22:00', NULL),
  ('mis-3', 'cli-1', NULL, 'locksmith', 'Porte claquée', 'Porte d''entrée claquée, clés restées à l''intérieur', ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'], 48.8526, 2.3488, '42 Avenue des Champs-Élysées, 75008 Paris', 'pending', 95, NULL, 0.10, '2025-01-14 16:45:00', NULL, NULL);

-- Update mission 2 with artisan location
UPDATE missions
SET artisan_latitude = 48.8596, artisan_longitude = 2.3386, eta = 12
WHERE id = 'mis-2';

-- Insert wallets for artisans
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals)
VALUES
  ('art-1', 1245.50, 0.00, 8934.25, 7688.75),
  ('art-2', 2890.00, 180.00, 15672.40, 12782.40),
  ('art-3', 567.30, 0.00, 4231.85, 3664.55),
  ('art-4', 1123.75, 0.00, 9876.50, 8752.75),
  ('art-5', 3456.80, 0.00, 18234.90, 14778.10);

-- Insert a sample transaction
INSERT INTO transactions (mission_id, client_id, artisan_id, amount, commission, commission_amount, artisan_payout, status, payment_method_id, processed_at)
VALUES ('mis-1', 'cli-1', 'art-1', 135, 0.15, 20.25, 114.75, 'completed', 'pm-1', '2025-01-10 12:00:00');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, mission_id, read)
VALUES
  ('cli-1', 'mission_completed', 'Mission terminée', 'Montant: 135€. Notez votre artisan !', 'mis-1', true),
  ('cli-1', 'mission_accepted', 'Mission acceptée !', 'Un artisan arrive bientôt', 'mis-2', false),
  ('art-1', 'payment', 'Paiement reçu', 'Vous avez reçu 114.75€ pour la mission "Fuite sous évier"', 'mis-1', true);

-- ========================================
-- ✅ SEED DATA INSERTED
-- ========================================

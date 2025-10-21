-- ========================================
-- 🔐 FIX: Ajouter les politiques d'INSERT manquantes
-- ========================================

-- DROP des politiques existantes d'INSERT si elles existent
DROP POLICY IF EXISTS users_insert_new ON users;
DROP POLICY IF EXISTS artisans_insert_new ON artisans;
DROP POLICY IF EXISTS clients_insert_new ON clients;
DROP POLICY IF EXISTS admins_insert_new ON admins;

-- USERS: Permettre à un utilisateur authentifié d'insérer son propre profil
CREATE POLICY users_insert_new ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ARTISANS: Permettre à un utilisateur d'insérer son profil artisan
CREATE POLICY artisans_insert_new ON artisans 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- CLIENTS: Permettre à un utilisateur d'insérer son profil client
CREATE POLICY clients_insert_new ON clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ADMINS: Permettre à un utilisateur d'insérer son profil admin
-- Note: En production, vous voudrez probablement restreindre cela
CREATE POLICY admins_insert_new ON admins 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- WALLETS: Permettre l'insertion lors de la création du compte artisan
DROP POLICY IF EXISTS wallets_insert_new ON wallets;
CREATE POLICY wallets_insert_new ON wallets 
  FOR INSERT 
  WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- ✅ Politiques d'INSERT ajoutées avec succès
-- ========================================

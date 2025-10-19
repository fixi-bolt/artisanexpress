# 🚀 Guide du Schéma Supabase Optimisé

Ce guide vous accompagne pour déployer le schéma optimisé basé sur les recommandations de ChatGPT.

---

## 📋 Sommaire

1. [Changements et Optimisations](#changements-et-optimisations)
2. [Installation du Nouveau Schéma](#installation-du-nouveau-schéma)
3. [Utilisation des Nouveaux Hooks](#utilisation-des-nouveaux-hooks)
4. [Migration depuis l'Ancien Schéma](#migration-depuis-lancien-schéma)

---

## ✨ Changements et Optimisations

### 1️⃣ **Colonnes Décimales Alignées**

**Avant :**
```sql
commission DECIMAL(5, 4)
amount DECIMAL(10, 2)
```

**Après :**
```sql
commission DECIMAL(5, 2)  -- Taux (ex: 10.00 = 10%)
amount DECIMAL(10, 2)      -- Montants
```

**Avantage :** Calculs plus intuitifs et cohérents côté JavaScript.

---

### 2️⃣ **Contraintes NOT NULL avec Valeurs par Défaut**

**Avant :**
```sql
commission DECIMAL(5, 4)
```

**Après :**
```sql
commission DECIMAL(5, 2) NOT NULL DEFAULT 0.10
```

**Avantage :** Données plus sûres, moins d'erreurs de validation.

---

### 3️⃣ **Relations Supabase Explicites**

**Ajout :**
```sql
CONSTRAINT fk_missions_client FOREIGN KEY (client_id) REFERENCES clients(id),
CONSTRAINT fk_missions_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id)
```

**Avantage :** Meilleure reconnaissance dans Supabase Studio, jointures automatiques.

---

### 4️⃣ **Table Audit Logs**

**Nouveau :**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Avantage :** Traçabilité complète, conformité RGPD.

---

### 5️⃣ **Politiques RLS Optimisées**

**Avant :**
```sql
CREATE POLICY missions_select_client ON missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR status = 'pending'
);
```

**Après :**
```sql
CREATE POLICY missions_select_client ON missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR (
    status = 'pending' 
    AND category IN (
      SELECT category FROM artisans WHERE artisans.id = auth.uid()
    )
  )
);
```

**Avantage :** Les artisans ne voient que les missions de leur catégorie.

---

## 🛠️ Installation du Nouveau Schéma

### Étape 1 : Ouvrir Supabase Dashboard

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet **ArtisanNow**

### Étape 2 : Exécuter le Schéma Optimisé

1. Allez dans **SQL Editor** → **New Query**
2. Copiez le contenu de `database/schema-optimized.sql`
3. Cliquez sur **Run**

### Étape 3 : Vérifier les Tables

1. Allez dans **Table Editor**
2. Vérifiez que toutes les tables apparaissent
3. Vérifiez les relations dans la section **Relationships**

### Étape 4 : Tester les Politiques RLS

1. Allez dans **Authentication** → **Policies**
2. Vérifiez que toutes les politiques sont actives
3. Testez avec un utilisateur de test

---

## 🎣 Utilisation des Nouveaux Hooks

### Hook: `useSupabaseAuth`

Gestion complète de l'authentification avec Supabase.

```typescript
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

function LoginScreen() {
  const { signIn, signUp, signOut, user, isLoading } = useSupabaseAuth();

  const handleSignUp = async () => {
    await signUp('email@example.com', 'password', 'John Doe', 'client');
  };

  const handleSignIn = async () => {
    await signIn('email@example.com', 'password');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      {user ? (
        <>
          <Text>Bienvenue {user.name}</Text>
          <Button title="Se déconnecter" onPress={signOut} />
        </>
      ) : (
        <>
          <Button title="Se connecter" onPress={handleSignIn} />
          <Button title="S'inscrire" onPress={handleSignUp} />
        </>
      )}
    </View>
  );
}
```

---

### Hook: `useSupabaseMissions`

Gestion des missions avec temps réel.

```typescript
import { useSupabaseMissions } from '@/hooks/useSupabaseMissions';

function MissionsScreen() {
  const { user } = useSupabaseAuth();
  const {
    missions,
    isLoading,
    createMission,
    acceptMission,
    updateMissionStatus,
  } = useSupabaseMissions(user?.id, user?.type);

  const handleCreateMission = async () => {
    await createMission({
      category: 'plumber',
      title: 'Fuite d\'eau',
      description: 'Urgence plomberie',
      location: { latitude: 48.8566, longitude: 2.3522 },
      estimatedPrice: 120,
    });
  };

  const handleAcceptMission = async (missionId: string) => {
    await acceptMission(missionId);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      data={missions}
      renderItem={({ item }) => (
        <MissionCard
          mission={item}
          onAccept={() => handleAcceptMission(item.id)}
        />
      )}
    />
  );
}
```

---

### Hook: `useSupabaseArtisans`

Recherche et filtrage d'artisans.

```typescript
import { useSupabaseArtisans } from '@/hooks/useSupabaseArtisans';

function ArtisansScreen() {
  const {
    artisans,
    isLoading,
    getArtisanById,
  } = useSupabaseArtisans({
    category: 'plumber',
    isAvailable: true,
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      radius: 10, // km
    },
  });

  const handleViewArtisan = async (artisanId: string) => {
    const artisan = await getArtisanById(artisanId);
    console.log(artisan);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      data={artisans}
      renderItem={({ item }) => (
        <ArtisanCard
          artisan={item}
          onPress={() => handleViewArtisan(item.id)}
        />
      )}
    />
  );
}
```

---

## 🔄 Migration depuis l'Ancien Schéma

Si vous avez déjà des données dans l'ancien schéma :

### Option 1 : Migration Automatique (Recommandé)

```sql
-- Mettre à jour les commissions
UPDATE missions SET commission = commission * 100;
UPDATE transactions SET commission = commission * 100;
UPDATE subscriptions SET commission = commission * 100;

-- Ajouter les contraintes manquantes
ALTER TABLE missions
  ALTER COLUMN commission SET DEFAULT 0.10;

ALTER TABLE transactions
  ALTER COLUMN commission SET DEFAULT 0.10;
```

### Option 2 : Nouveau Départ (Données de Test)

1. Supprimez toutes les tables existantes
2. Exécutez `schema-optimized.sql`
3. Exécutez `seed.sql` pour générer des données de test

---

## 🎯 Prochaines Étapes

1. ✅ **Testez l'authentification** avec les nouveaux hooks
2. ✅ **Créez des missions** depuis l'application
3. ✅ **Vérifiez les politiques RLS** avec différents types d'utilisateurs
4. ✅ **Surveillez les audit logs** pour le debugging

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation Realtime](https://supabase.com/docs/guides/realtime)

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Supabase Dashboard → **Logs**
2. Vérifiez la console de l'application pour les erreurs
3. Consultez `database/INTEGRATION_COMPLETE.md`

---

**Schéma prêt pour la production ! 🚀**

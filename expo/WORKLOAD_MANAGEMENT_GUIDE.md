# 🎯 Guide Complet : Gestion de la Charge de Travail Artisan

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture proposée](#architecture-proposée)
3. [Schéma de base de données](#schéma-de-base-de-données)
4. [Logique métier](#logique-métier)
5. [Implémentation Frontend](#implémentation-frontend)
6. [Cas d'usage détaillés](#cas-dusage-détaillés)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Plan de déploiement](#plan-de-déploiement)

---

## 🎨 Vue d'ensemble

### ❓ Problématique

**Question centrale** : Quand un artisan accepte une mission, doit-il être automatiquement marqué indisponible ?

### ✅ Réponse Recommandée : **NON - Mode Semi-Automatique**

**Pourquoi ?**

1. **Flexibilité** : Un artisan peut gérer plusieurs missions dans sa journée
2. **Autonomie** : L'artisan garde le contrôle de sa disponibilité
3. **Intelligence** : Le système aide avec des suggestions contextuelles
4. **Évolutivité** : Prêt pour des fonctionnalités avancées (planning, réservations futures)

---

## 🏗️ Architecture Proposée

```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTION DE DISPONIBILITÉ                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mode Manuel (Défaut) ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ✓ Artisan contrôle son toggle On/Off                      │ │
│  │  ✓ Système calcule automatiquement la charge de travail    │ │
│  │  ✓ Badge visuel indique le niveau d'occupation            │ │
│  │  ✓ Suggestions intelligentes après acceptation            │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Mode Auto (Optionnel) ───────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ✓ Indisponible automatiquement après 2 missions actives   │ │
│  │  ✓ Disponible automatiquement quand toutes terminées       │ │
│  │  ✓ Notifications avant changement automatique              │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Mode Smart (Future) ─────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ✓ IA prédit la capacité basée sur l'historique            │ │
│  │  ✓ Gestion du planning avec créneaux                       │ │
│  │  ✓ Réservations futures sans bloquer le présent           │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schéma de Base de Données

### Nouveaux Champs dans `artisans`

| Champ | Type | Description |
|-------|------|-------------|
| `current_mission_id` | UUID (FK) | Mission actuellement en cours (la plus récente) |
| `active_missions_count` | INTEGER | Nombre de missions actives (accepted + in_progress) |
| `last_availability_change` | TIMESTAMPTZ | Dernier changement manuel de disponibilité |
| `availability_mode` | ENUM | `manual`, `auto`, `smart` (mode de gestion) |

### Fonctions SQL Créées

1. **`calculate_artisan_workload(artisan_id)`**
   - Retourne : nombre de missions actives, statut de charge, capacité d'acceptation

2. **`suggest_availability_change(artisan_id)`**
   - Retourne : suggestion intelligente basée sur la charge actuelle

3. **`update_artisan_active_missions_count()`**
   - Trigger automatique maintenant le compteur à jour

### Vue Créée

**`artisan_workload_status`** : Vue facilitant l'affichage de la charge de travail

```sql
select * from artisan_workload_status;
-- Affiche pour chaque artisan :
-- - Nombre de missions actives
-- - Statut visuel (🟢 🟡 🔴 ⚫)
-- - Capacité d'acceptation
```

---

## ⚙️ Logique Métier

### Niveaux de Charge de Travail

```
🟢 Disponible       → 0 missions actives + toggle ON
🟡 Occupé            → 1 mission active + toggle ON
🔴 Très occupé       → 2+ missions actives + toggle ON
⚫ Indisponible      → toggle OFF (indépendant du nombre de missions)
```

### Flux d'Acceptation de Mission

```
┌────────────────────────────────────────────────────────────┐
│  1. Artisan clique "Accepter Mission"                      │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  2. Mission.status = 'accepted'                            │
│     Mission.artisan_id = artisan.id                        │
│     Mission.accepted_at = NOW()                            │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  3. [TRIGGER] update_artisan_active_missions_count()       │
│     - Compte les missions actives                          │
│     - Met à jour active_missions_count                     │
│     - Définit current_mission_id                           │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  4. Frontend appelle suggest_availability_change()         │
│     - Si 2+ missions : suggère indisponibilité             │
│     - Affiche modal de confirmation                        │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  5. Artisan choisit :                                      │
│     [A] Rester disponible → Rien ne change                 │
│     [B] Devenir indisponible → is_available = false        │
└────────────────────────────────────────────────────────────┘
```

### Flux de Complétion de Mission

```
┌────────────────────────────────────────────────────────────┐
│  1. Artisan termine la mission                             │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  2. Mission.status = 'completed'                           │
│     Mission.completed_at = NOW()                           │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  3. [TRIGGER] update_artisan_active_missions_count()       │
│     - Décrémente active_missions_count                     │
│     - Si 0 missions : current_mission_id = NULL            │
├────────────────────────────────────────────────────────────┤
│     ↓                                                      │
│  4. Frontend appelle suggest_availability_change()         │
│     - Si indisponible + 0 missions : suggère disponibilité │
│     - Affiche notification discrète                        │
└────────────────────────────────────────────────────────────┘
```

---

## 💻 Implémentation Frontend

### Modifications nécessaires

#### 1. Type `Artisan` (`types/index.ts`)

```typescript
export interface Artisan extends User {
  type: 'artisan';
  category: ArtisanCategory;
  hourlyRate: number;
  travelFee: number;
  interventionRadius: number;
  isAvailable: boolean;
  completedMissions: number;
  specialties: string[];
  location?: Location;
  isSuspended?: boolean;
  
  // 🆕 NOUVEAUX CHAMPS
  currentMissionId?: string;
  activeMissionsCount?: number;
  workloadStatus?: 'available' | 'busy' | 'very_busy';
  canAcceptMore?: boolean;
  availabilityMode?: 'manual' | 'auto' | 'smart';
}
```

#### 2. Hook `useWorkloadSuggestion`

```typescript
// hooks/useWorkloadSuggestion.ts
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkloadSuggestion() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const checkSuggestion = useCallback(async () => {
    if (user?.type !== 'artisan') return;

    try {
      const suggestion = await utils.artisan.getSuggestion.fetch({
        artisanId: user.id,
      });

      if (suggestion.shouldSuggest) {
        Alert.alert(
          'Suggestion de disponibilité',
          suggestion.message,
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: suggestion.suggestionType === 'become_unavailable' 
                ? 'Devenir indisponible' 
                : 'Devenir disponible',
              onPress: async () => {
                const newStatus = suggestion.suggestionType === 'become_unavailable';
                await updateUser({ isAvailable: newStatus });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to check suggestion:', error);
    }
  }, [user?.id]);

  return { checkSuggestion };
}
```

#### 3. Modification de `MissionContext.acceptMission`

```typescript
const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
  try {
    // Acceptation normale
    const { error: updateError } = await supabase
      .from('missions')
      .update({
        status: 'accepted',
        artisan_id: artisanId,
        accepted_at: new Date().toISOString(),
        eta: 15,
      })
      .eq('id', missionId);

    if (updateError) throw updateError;

    // 🆕 Rafraîchir les données artisan (inclut workload)
    await refreshArtisanData(artisanId);

    // 🆕 Vérifier si une suggestion doit être faite
    const { data: suggestion } = await supabase
      .rpc('suggest_availability_change', { p_artisan_id: artisanId })
      .single();

    if (suggestion?.should_suggest) {
      Alert.alert(
        'Gérer votre disponibilité',
        suggestion.message,
        [
          { text: 'Rester disponible', style: 'cancel' },
          {
            text: 'Devenir indisponible',
            onPress: async () => {
              await supabase
                .from('artisans')
                .update({ is_available: false })
                .eq('id', artisanId);
            },
          },
        ]
      );
    }

    // Notifications aux clients...
    await loadMissions();
    console.log('✅ Mission accepted:', missionId);
  } catch (error) {
    console.error('❌ Error accepting mission:', error);
    throw error;
  }
}, [missions, sendNotification]);
```

#### 4. Badge de Charge de Travail (Dashboard Artisan)

```typescript
// Affichage du badge basé sur workloadStatus
<View style={styles.workloadBadge}>
  {user.workloadStatus === 'available' && (
    <>
      <View style={[styles.indicator, { backgroundColor: Colors.success }]} />
      <Text style={styles.workloadText}>🟢 Disponible</Text>
    </>
  )}
  {user.workloadStatus === 'busy' && (
    <>
      <View style={[styles.indicator, { backgroundColor: Colors.warning }]} />
      <Text style={styles.workloadText}>🟡 Occupé (1 mission)</Text>
    </>
  )}
  {user.workloadStatus === 'very_busy' && (
    <>
      <View style={[styles.indicator, { backgroundColor: Colors.error }]} />
      <Text style={styles.workloadText}>🔴 Très occupé ({user.activeMissionsCount} missions)</Text>
    </>
  )}
  {!user.isAvailable && (
    <>
      <View style={[styles.indicator, { backgroundColor: Colors.textSecondary }]} />
      <Text style={styles.workloadText}>⚫ Indisponible</Text>
    </>
  )}
</View>
```

---

## 📖 Cas d'Usage Détaillés

### Cas 1 : Premier artisan, première mission

**Contexte** : Artisan vient de s'inscrire, accepte sa première mission

**Comportement** :
1. ✅ Mission acceptée
2. ✅ `active_missions_count` = 1
3. ✅ Badge passe à 🟡 Occupé
4. ❌ Pas de suggestion (seulement 1 mission)
5. ✅ Reste disponible pour d'autres missions

### Cas 2 : Artisan avec 2 missions actives

**Contexte** : Artisan a déjà 1 mission en cours, accepte une 2e

**Comportement** :
1. ✅ Mission acceptée
2. ✅ `active_missions_count` = 2
3. ✅ Badge passe à 🔴 Très occupé
4. ✅ **Suggestion affichée** : "Vous avez 2 missions actives. Voulez-vous vous marquer indisponible ?"
5. 🔀 **Choix artisan** :
   - "Rester disponible" → Garde le toggle ON
   - "Devenir indisponible" → Toggle passe OFF

### Cas 3 : Artisan termine sa dernière mission

**Contexte** : Artisan indisponible, termine sa dernière mission

**Comportement** :
1. ✅ Mission marquée completed
2. ✅ `active_missions_count` = 0
3. ✅ Badge affiche ⚫ Indisponible (toggle OFF)
4. ✅ **Notification discrète** : "Vous n'avez plus de missions actives. Redevenir disponible ?"
5. 🔀 **Choix artisan** :
   - Ignorer → Reste indisponible
   - "Devenir disponible" → Toggle passe ON

### Cas 4 : Annulation de mission par le client

**Contexte** : Client annule une mission acceptée

**Comportement** :
1. ✅ Mission.status = 'cancelled'
2. ✅ Trigger décrémente `active_missions_count`
3. ✅ Badge mis à jour automatiquement
4. ✅ Si artisan était indisponible à cause de surcharge → Suggestion de redevenir disponible

### Cas 5 : Artisan en pause déjeuner

**Contexte** : Artisan n'a pas de mission, veut faire une pause

**Comportement** :
1. ✅ Artisan désactive manuellement le toggle
2. ✅ `is_available` = false
3. ✅ `last_availability_change` = NOW()
4. ✅ Badge affiche ⚫ Indisponible
5. ✅ N'apparaît plus dans les recherches de clients

### Cas 6 : Artisan accepte mission pour demain

**Contexte** : Système futur avec planning

**Comportement** :
1. ✅ Mission créée avec `scheduled_for` = demain
2. ✅ `active_missions_count` **N'EST PAS** incrémenté (pas encore started)
3. ✅ Artisan reste disponible aujourd'hui
4. ✅ Demain : artisan démarre la mission → compteur s'incrémente

---

## 🚨 Gestion des Erreurs

### Erreur 1 : Réseau pendant acceptation

**Scénario** : Perte de connexion pendant acceptation de mission

**Gestion** :
```typescript
try {
  await acceptMission(missionId, artisanId);
} catch (error: any) {
  if (error.code === 'NETWORK_ERROR') {
    // Rollback local
    setMissions(prevMissions);
    
    Alert.alert(
      'Erreur réseau',
      'Impossible d\'accepter la mission. Vérifiez votre connexion.',
      [{ text: 'Réessayer', onPress: () => acceptMission(missionId, artisanId) }]
    );
  }
}
```

### Erreur 2 : Données incohérentes

**Scénario** : `active_missions_count` ne correspond pas à la réalité

**Solution** :
```sql
-- Fonction de réparation (à exécuter en admin)
create or replace function repair_artisan_workload_counts()
returns void as $$
begin
  update artisans a
  set active_missions_count = (
    select count(*)
    from missions m
    where m.artisan_id = a.id
      and m.status in ('accepted', 'in_progress')
  );
end;
$$ language plpgsql;
```

### Erreur 3 : Trigger ne se déclenche pas

**Diagnostic** :
```sql
-- Vérifier que le trigger existe
select * from pg_trigger where tgname = 'update_artisan_workload';

-- Vérifier les logs de trigger
select * from audit_logs where action = 'trigger_error' order by created_at desc;
```

---

## 🚀 Plan de Déploiement

### Étape 1 : Préparation (Vous êtes ici)

- [x] Analyse de la problématique
- [x] Conception de l'architecture
- [x] Création du script SQL
- [ ] Revue et validation du client

### Étape 2 : Migration Base de Données

```bash
# 1. Backup de la base actuelle
pg_dump -h nkxucjhavjfsogzpitry.supabase.co -U postgres > backup_avant_workload.sql

# 2. Exécuter le script de migration
# Coller le contenu de database/ADD_WORKLOAD_MANAGEMENT.sql dans Supabase SQL Editor

# 3. Vérifier que tout fonctionne
select * from artisan_workload_status;
```

### Étape 3 : Mise à Jour Backend (tRPC)

**Créer les routes tRPC :**

```typescript
// backend/trpc/routes/artisan/get-workload/route.ts
export const getWorkloadProcedure = publicProcedure
  .input(z.object({ artisanId: z.string().uuid() }))
  .query(async ({ input }) => {
    const { data } = await supabase
      .rpc('calculate_artisan_workload', { p_artisan_id: input.artisanId })
      .single();
    return data;
  });

// backend/trpc/routes/artisan/get-suggestion/route.ts
export const getSuggestionProcedure = publicProcedure
  .input(z.object({ artisanId: z.string().uuid() }))
  .query(async ({ input }) => {
    const { data } = await supabase
      .rpc('suggest_availability_change', { p_artisan_id: input.artisanId })
      .single();
    return data;
  });
```

### Étape 4 : Mise à Jour Frontend

1. ✅ Modifier `types/index.ts` (ajouter champs workload)
2. ✅ Créer `hooks/useWorkloadSuggestion.ts`
3. ✅ Modifier `MissionContext.acceptMission`
4. ✅ Modifier `MissionContext.completeMission`
5. ✅ Mettre à jour le dashboard artisan (badge de charge)

### Étape 5 : Tests

**Tests manuels :**
1. ✅ Artisan accepte 1 mission → Badge 🟡
2. ✅ Artisan accepte 2e mission → Suggestion indisponibilité
3. ✅ Artisan termine mission → Compteur décrémente
4. ✅ Client annule mission → Compteur décrémente
5. ✅ Artisan toggle manuel → Fonctionne indépendamment

**Tests SQL :**
```sql
-- Test 1 : Créer un artisan
insert into users (id, email, name, user_type) 
values ('test-artisan-id', 'test@test.com', 'Test Artisan', 'artisan');

insert into artisans (id, category, hourly_rate, travel_fee) 
values ('test-artisan-id', 'plumber', 50, 10);

-- Test 2 : Accepter une mission
update missions 
set artisan_id = 'test-artisan-id', status = 'accepted' 
where id = 'test-mission-id';

-- Test 3 : Vérifier le compteur
select active_missions_count from artisans where id = 'test-artisan-id';
-- Doit retourner 1

-- Test 4 : Suggestion
select * from suggest_availability_change('test-artisan-id');
```

### Étape 6 : Déploiement Production

1. ✅ Tester en staging/dev
2. ✅ Créer backup production
3. ✅ Exécuter migration SQL
4. ✅ Déployer frontend
5. ✅ Monitorer les logs
6. ✅ Vérifier que les artisans existants fonctionnent

### Étape 7 : Communication

**Email aux artisans :**
```
Bonjour,

Nous avons amélioré la gestion de votre disponibilité ! 

🆕 Nouvelles fonctionnalités :
- Vous pouvez maintenant accepter plusieurs missions dans votre journée
- Le système calcule automatiquement votre charge de travail
- Vous recevez des suggestions intelligentes pour gérer votre disponibilité
- Vous gardez toujours le contrôle total avec le bouton On/Off

Rien ne change dans votre utilisation quotidienne, mais vous avez maintenant plus de flexibilité !

L'équipe ArtisanNow
```

---

## 📊 Métriques à Surveiller

Après déploiement, suivre ces métriques :

1. **Nombre moyen de missions actives par artisan**
2. **Taux d'acceptation des suggestions**
3. **Temps moyen entre missions**
4. **Nombre d'artisans avec 2+ missions simultanées**
5. **Erreurs de synchronisation de compteur**

---

## 🎯 Conclusion

### ✅ Recommandation Finale : **Semi-Automatique (Mode Manuel par défaut)**

**Avantages** :
- Flexibilité maximale pour les artisans
- Pas de surprise désagréable (désactivation forcée)
- Suggestions intelligentes pour aider
- Évolutif vers mode auto/smart si demandé

**Inconvénients gérés** :
- Artisan peut oublier de se désactiver → Suggestions intelligentes
- Surcharge potentielle → Badge visuel 🔴 + limite 3 missions
- Clients voient charge de travail → Transparence

### 🚀 Prochaines Étapes

1. **Validation client** : Confirmez cette approche
2. **Exécution SQL** : Collez `database/ADD_WORKLOAD_MANAGEMENT.sql` dans Supabase
3. **Tests** : Vérifiez que les triggers fonctionnent
4. **Implémentation Frontend** : Ajoutez les suggestions et badges
5. **Déploiement** : Mise en production progressive

---

**Besoin de clarifications ou modifications ?** 
Je suis prêt à ajuster cette proposition selon vos besoins spécifiques ! 🚀

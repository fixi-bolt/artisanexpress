# 🔧 Guide de résolution complet - Carte rétractable + Fonction calculate_distance

## ✅ Problèmes résolus

### 1. **Erreur SQL: function calculate_distance does not exist**
- **Problème**: La fonction `calculate_distance` n'avait pas les bons types de paramètres (NUMERIC au lieu de DOUBLE PRECISION)
- **Solution**: Script SQL créé avec les types corrects

### 2. **Carte disparue**
- **Problème**: La carte n'était pas visible dans les écrans
- **Solution**: Nouveau composant `RetractableMap` créé et intégré

---

## 📋 Actions à effectuer immédiatement

### Étape 1: Exécuter le script SQL dans Supabase

1. **Ouvrez votre tableau de bord Supabase**
2. **Allez dans SQL Editor**
3. **Copiez et collez le contenu du fichier** `database/FIX_CALCULATE_DISTANCE_FINAL.sql`
4. **Cliquez sur "Run"**

Le script va:
- ✅ Supprimer l'ancienne fonction `calculate_distance`
- ✅ Créer la nouvelle fonction avec les bons types
- ✅ Recréer la fonction `find_nearby_missions` qui en dépend
- ✅ Accorder les bonnes permissions
- ✅ Exécuter un test automatique (distance Paris-Lyon ≈ 392 km)

### Étape 2: Vérifier que tout fonctionne

Après avoir exécuté le script SQL, vous devriez voir dans les logs:
```
NOTICE:  Distance test Paris-Lyon: 392 km (attendu: ~392 km)
NOTICE:  ✅ Fonction calculate_distance fonctionne correctement
NOTICE:  ✅ Fonction calculate_distance et find_nearby_missions créées avec succès
```

---

## 🗺️ Nouveau composant: Carte rétractable

### Fonctionnalités

Le composant `RetractableMap` offre:

#### ✅ État rétracté (par défaut)
- Affiche l'adresse avec une icône
- Hauteur de 120px
- Message "Appuyez pour voir la carte"
- Aperçu de la carte en arrière-plan

#### ✅ État étendu
- Carte interactive plein écran (60% de la hauteur de l'écran)
- Zoom, pan, rotation activés
- Bouton de position utilisateur
- Boussole

#### ✅ Interactions
- **Tap**: Bascule entre rétracté/étendu
- **Drag up/down** (mobile uniquement): Glisser pour étendre/rétracter
- Animation fluide avec spring

#### ✅ Props
```typescript
interface RetractableMapProps {
  latitude: number;          // Position principale
  longitude: number;
  address?: string;          // Adresse à afficher
  markers?: {                // Marqueurs supplémentaires (ex: position artisan)
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }[];
  showUserLocation?: boolean; // Afficher position utilisateur
  onRegionChange?: (region: any) => void; // Callback changement région
  testID?: string;
}
```

### Où est-elle intégrée?

✅ **app/mission-details.tsx**
- Affiche la position de la mission
- Si un artisan est assigné, affiche aussi sa position

### Ajouter la carte à d'autres écrans (optionnel)

Pour ajouter la carte rétractable à d'autres écrans (par exemple `app/request.tsx` ou `app/(artisan)/dashboard.tsx`):

```typescript
import RetractableMap from '@/components/RetractableMap';

// Dans votre composant:
<RetractableMap
  latitude={currentLatitude}
  longitude={currentLongitude}
  address={address}
  showUserLocation={true}
  testID="request-map"
/>
```

---

## 🧪 Tests à effectuer

### Test 1: Fonction SQL
```sql
-- Dans Supabase SQL Editor
SELECT calculate_distance(48.8566, 2.3522, 45.7640, 4.8357) as distance_km;
-- Résultat attendu: ~392 km
```

### Test 2: Création de mission
1. Allez sur l'écran d'accueil client
2. Choisissez une catégorie (ex: Plombier)
3. Remplissez le formulaire de demande
4. Cliquez sur "Envoyer la demande"
5. ✅ La mission doit se créer sans erreur

### Test 3: Carte rétractable
1. Créez une mission
2. Allez dans l'historique des missions
3. Ouvrez les détails d'une mission
4. ✅ Vous devez voir la carte rétractée avec l'adresse
5. Appuyez sur la carte
6. ✅ La carte doit s'étendre avec animation
7. Appuyez à nouveau
8. ✅ La carte doit se rétracter

### Test 4: Notifications artisans à proximité
1. Créez une mission en tant que client
2. Connectez-vous en tant qu'artisan de la bonne catégorie
3. ✅ L'artisan doit recevoir une notification si dans le rayon d'intervention

---

## 📝 Résumé des fichiers modifiés/créés

### Fichiers créés
- ✅ `database/FIX_CALCULATE_DISTANCE_FINAL.sql` - Script SQL à exécuter
- ✅ `components/RetractableMap.tsx` - Nouveau composant de carte rétractable

### Fichiers modifiés
- ✅ `app/mission-details.tsx` - Ajout de la carte rétractable

---

## 🚀 Prochaines étapes (optionnelles)

Si vous voulez aller plus loin:

### 1. Ajouter la carte à l'écran de création de demande
```typescript
// Dans app/request.tsx, après la section adresse:
<View style={styles.section}>
  <Text style={styles.label}>Voir sur la carte</Text>
  <RetractableMap
    latitude={currentLatitude}
    longitude={currentLongitude}
    address={address}
    showUserLocation={true}
    testID="request-map"
  />
</View>
```

### 2. Tracking en temps réel de l'artisan
```typescript
// Dans app/tracking.tsx, remplacer la MapView actuelle par:
<RetractableMap
  latitude={activeMission.location.latitude}
  longitude={activeMission.location.longitude}
  address={activeMission.location.address}
  markers={activeMission.artisanLocation ? [{
    latitude: activeMission.artisanLocation.latitude,
    longitude: activeMission.artisanLocation.longitude,
    title: 'Artisan en route',
    description: `Arrivée dans ${eta} min`,
  }] : []}
  showUserLocation={true}
  onRegionChange={(region) => {
    console.log('Region changed:', region);
  }}
/>
```

### 3. Dashboard artisan avec missions à proximité
Affichez une carte avec toutes les missions disponibles dans le rayon d'intervention de l'artisan.

---

## ❓ Questions fréquentes

### Q: La carte ne s'affiche pas sur le web
**R:** C'est normal. La carte utilise `react-native-maps` qui a un support limité sur web. Un fallback avec OpenStreetMap/Leaflet pourrait être ajouté.

### Q: L'erreur calculate_distance persiste
**R:** Assurez-vous d'avoir bien exécuté le script SQL dans Supabase et que vous avez les permissions nécessaires (role authenticated).

### Q: La carte ne se rétracte pas
**R:** Sur web, le PanResponder ne fonctionne pas. Utilisez le bouton chevron en haut de la carte pour toggler.

### Q: Les marqueurs n'apparaissent pas
**R:** Vérifiez que les coordonnées latitude/longitude sont valides et que `react-native-maps` est correctement installé.

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de la console pour les erreurs TypeScript
2. Vérifiez les logs Supabase pour les erreurs SQL
3. Assurez-vous que les dépendances sont installées: `bun install`
4. Rechargez l'application avec `r` dans le terminal Expo

---

**Fait avec ❤️ par Rork**

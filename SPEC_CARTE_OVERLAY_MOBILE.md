# Spécification Fonctionnelle et UX — Carte Interactive + Overlay (Style Uber/Bolt)

**Version:** 1.0  
**Plateforme cible:** iOS / Android (React Native / Expo)  
**Date:** 2025-01-01

---

## 1. Vue d'ensemble

Implémenter un système de carte interactive en arrière-plan avec overlay déplaçable par l'utilisateur, inspiré des apps de mobilité (Uber, Bolt, Lyft). La carte reste toujours fonctionnelle et visible partiellement, même lorsque l'overlay est affiché.

### Objectifs UX
- Permettre à l'utilisateur de consulter la carte et la liste simultanément
- Offrir un contrôle fluide et intuitif du ratio carte/liste visible
- Maintenir le contexte spatial en gardant la carte toujours visible
- Fournir un retour visuel immédiat lors des interactions

---

## 2. États de l'interface

### 2.1 État A — Carte dominante (30-40% overlay)

**Description:**  
La carte occupe 60-70% de la hauteur d'écran, l'overlay est rétracté en bas.

**Spécifications visuelles:**
- Carte visible: 60-70% hauteur écran (du haut jusqu'à ~70% de l'écran)
- Overlay visible: 30-40% hauteur écran (bas de l'écran)
- Opacité carte: 100%
- Opacité overlay: 100%
- Z-index carte: 1
- Z-index overlay: 10

**Éléments visibles:**
- Carte complète avec marqueurs
- Contrôles de zoom (+/-)
- Bouton de recentrage (GPS)
- Indicateur de position utilisateur (cercle bleu pulsant)
- Header overlay avec handle bar
- 1-2 items de liste visibles dans l'overlay
- Badge du nombre total d'éléments

**Interactions disponibles:**
- Pan/zoom sur la carte (gestures complets)
- Tap sur marqueurs
- Swipe up sur l'overlay → transition vers État B
- Tap sur handle bar → transition vers État B
- Tap sur item de liste → ouvre détail
- Bouton de recentrage → centre la carte sur utilisateur

**Conditions d'entrée:**
- Ouverture initiale de l'écran (état par défaut)
- Swipe down depuis État B
- Tap sur bouton close/chevron depuis État B ou C

---

### 2.2 État B — Équilibré (50-50)

**Description:**  
État intermédiaire où carte et overlay occupent chacun environ 50% de l'écran.

**Spécifications visuelles:**
- Carte visible: 50% hauteur écran (haut)
- Overlay visible: 50% hauteur écran (bas)
- Opacité carte: 100%
- Opacité overlay: 100%
- Animation: transition fluide depuis État A ou C

**Éléments visibles:**
- Moitié supérieure de la carte
- 3-4 items de liste dans l'overlay
- Handle bar toujours visible
- Contrôles carte visibles mais potentiellement réduits

**Interactions disponibles:**
- Scroll vers le haut dans overlay → transition vers État C
- Scroll vers le bas dans overlay → transition vers État A
- Swipe up/down sur handle → transition vers C/A
- Pan/zoom limité sur partie visible de la carte

**Conditions d'entrée:**
- Swipe up modéré depuis État A
- Swipe down modéré depuis État C
- État transitoire lors du drag

---

### 2.3 État C — Liste dominante (90-95% overlay)

**Description:**  
L'overlay couvre presque tout l'écran, la carte est à peine visible en arrière-plan.

**Spécifications visuelles:**
- Carte visible: 5-10% hauteur écran (fine bande en haut ou masquée)
- Overlay visible: 90-95% hauteur écran
- Opacité carte: 30-40% (assombrie)
- Opacité overlay: 100%
- Fond overlay: légère ombre portée sur la carte

**Éléments visibles:**
- Liste complète scrollable
- Header overlay avec bouton close/chevron
- Handle bar (optionnel)
- Carte très réduite ou masquée
- Barre de recherche/filtres en haut de l'overlay

**Interactions disponibles:**
- Scroll vertical dans la liste (gestures de liste standards)
- Tap sur items → ouvre détail
- Swipe down sur overlay → transition vers État B puis A
- Tap sur bouton close → transition directe vers État A
- Pan/zoom carte désactivés (overlay capture les touches)

**Conditions d'entrée:**
- Swipe up complet depuis État A ou B
- Scroll rapide vers le haut dans la liste
- Tap sur item de liste qui expand l'overlay

---

## 3. Comportements et animations

### 3.1 Gestes utilisateur

#### Swipe Up sur overlay (depuis handle bar ou contenu)
```
Vélocité faible (< 500 px/s):
  - Snap à l'état suivant (A → B ou B → C)
  
Vélocité élevée (≥ 500 px/s):
  - Snap direct à État C (plein écran)
  
During drag:
  - Suivre le doigt en temps réel (60fps)
  - Ajuster opacité carte proportionnellement
  - Bloquer à 95% max (safe area top)
```

#### Swipe Down sur overlay
```
Vélocité faible:
  - Snap à l'état précédent (C → B ou B → A)
  
Vélocité élevée:
  - Snap direct à État A (carte dominante)
  
Limite basse:
  - Bloquer à 30% min (État A)
  - Légère résistance élastique si swipe au-delà
```

#### Scroll vertical dans liste (État B/C)
```
Scroll up (liste monte):
  - Transition progressive B → C
  - Threshold: 20px de scroll → commence transition
  - Opacité carte réduite graduellement
  
Scroll down (liste descend):
  - Si au top de la liste: commence transition C → B → A
  - Sinon: scroll normal de la liste
  - Effet "bounce" pour indiquer possibilité de fermer
```

#### Pan/Zoom sur carte
```
État A (carte dominante):
  - Pan: gestures complets (1 doigt)
  - Zoom: pinch gestures (2 doigts)
  - Double tap: zoom in
  
État B (équilibré):
  - Pan/zoom disponibles mais zone réduite
  - Overlay capture prioritairement les touches si ambigu
  
État C (liste dominante):
  - Pan/zoom désactivés (overlay capture tout)
```

### 3.2 Animations et timing

#### Transition entre états
```
Durée: 280ms (Android) / 320ms (iOS)
Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94) [ease-out-quad]
Native driver: true (performance)

Propriétés animées:
  - translateY de l'overlay
  - opacité de la carte (optionnel)
  - opacité d'un voile sombre sur la carte (État C)
```

#### Snap behavior
```
Threshold de snap: 50% du trajet entre deux états

Exemple A → B:
  - Si drag > 50% du trajet: snap à État B
  - Sinon: snap retour à État A
  
Animation de snap:
  - Durée: 180ms
  - Easing: spring(tension: 300, friction: 30) [iOS]
  - Easing: ease-out [Android]
```

#### Indicateurs visuels pendant drag
```
Handle bar:
  - Couleur normale: #D1D5DB (neutral-300)
  - Couleur active (pendant drag): #6B7280 (neutral-500)
  - Légère scale: 1.0 → 1.05 pendant drag
  
Carte (fade):
  - État A: opacity 1.0
  - État B: opacity 1.0
  - État C: opacity 0.3-0.4
  - Transition linéaire pendant drag
```

### 3.3 Suivi GPS en temps réel

#### Position utilisateur

```
Fréquence de mise à jour:
  - Mode suivi actif: 1-2 secondes
  - Mode libre (carte pannée): 5 secondes (background)
  
Précision:
  - Haute précision (GPS + WiFi + Cell)
  - Accuracy: high (iOS) / highAccuracy (Android)
  
Indicateur visuel:
  - Cercle bleu rempli (centre = position)
  - Halo bleu pulsant (rayon = précision estimée)
  - Flèche de direction si vitesse > 1 m/s
```

#### Modes de carte

**Mode Follow (suivi actif):**
```
Comportement:
  - Carte se recentre automatiquement sur la position utilisateur
  - Rotation de la carte selon heading (optionnel)
  - Animation douce lors du recentrage (300ms)
  
Activation:
  - Par défaut à l'ouverture
  - Tap sur bouton recentrage
  
Désactivation:
  - Dès que l'utilisateur panne la carte manuellement
  - Indicateur visuel: bouton recentrage change de couleur
```

**Mode Free (exploration libre):**
```
Comportement:
  - Position utilisateur mise à jour mais pas de recentrage
  - Utilisateur contrôle la vue manuellement
  
Activation:
  - Pan manuel sur la carte
  
Retour au mode Follow:
  - Tap sur bouton recentrage
```

---

## 4. Gestion des conflits de gestures

### 4.1 Priorité des gestures

```
Priorité 1 (capture en premier):
  - Swipe vertical sur handle bar → toujours overlay
  - Pinch sur carte → toujours carte (si État A)
  
Priorité 2 (détection de direction):
  - Touch dans zone overlay:
    - Si mouvement vertical dominant (> 15° de la verticale): overlay scroll
    - Si mouvement horizontal dominant: propagation à la carte
  
Priorité 3 (contexte):
  - Touch dans zone carte visible (État A):
    - Pan horizontal/vertical sur carte
  - Touch dans zone carte réduite (État C):
    - Aucune action carte (désactivée)
```

### 4.2 Zones de capture

```
Handle bar zone:
  - Hauteur: 44px (touch target)
  - Largeur: 100% de l'écran
  - Toujours capture les touches verticales
  
Overlay content zone (État B/C):
  - Capture scroll vertical si liste scrollable
  - Si au top + pull down: transition overlay
  
Carte visible zone (État A):
  - Capture pan/pinch si overlay < 50% hauteur
```

---

## 5. Composants UI détaillés

### 5.1 Handle Bar (barre de préhension)

**Apparence:**
```
Largeur: 40px
Hauteur: 4px
Border radius: 2px (capsule)
Couleur: #D1D5DB (neutral-300)
Position: centré horizontalement, 8px du haut de l'overlay

Padding zone tactile:
  - Padding vertical: 20px (total 44px touch target)
  - Padding horizontal: 0px
```

**États:**
```
Normal: #D1D5DB, opacity 1.0
Active (drag): #6B7280, scale 1.05
Hover (web): #9CA3AF
```

### 5.2 Header Overlay

**Composition:**
```
[ Handle Bar ]
[ Titre / Compteur ]
[ Bouton Close (si État C) ]

Hauteur totale: 64px
Padding: 16px horizontal
Background: blanc avec ombre subtile en bas
```

**Exemple:**
```
┌─────────────────────────────┐
│         ━━━━━               │ ← Handle bar
│  "12 artisans disponibles"  │ ← Titre
│                      [X]    │ ← Close btn
└─────────────────────────────┘
```

### 5.3 Carte (MapView)

**Layers (z-index):**
```
1. Base map (Google Maps / Apple Maps)
2. Marqueurs artisans (custom pins)
3. Position utilisateur (cercle bleu + halo)
4. Contrôles UI:
   - Bouton recentrage (bottom right)
   - Boutons zoom +/- (right side)
```

**Contrôle de recentrage:**
```
Icon: Target / Crosshair
Position: 16px du bord droit, 120px du bas (État A)
Taille: 44x44px
Background: blanc, ombre portée
Border radius: 22px (cercle)

États:
  - Mode Follow: bleu (#0284C7), icon rempli
  - Mode Free: gris (#6B7280), icon outline
```

### 5.4 Voile assombrissant (État C)

**Spécifications:**
```
Position: absolue, au-dessus de la carte, sous l'overlay
Background: rgba(0, 0, 0, 0.4)
Opacité: 0 (État A/B) → 0.4 (État C)
Transition: synchronisée avec overlay translateY
Pointer events: none (laisse passer les touches à la carte si visible)
```

---

## 6. Cas limites et edge cases

### 6.1 Gestion des permissions

```
Permission GPS refusée:
  - Afficher carte centrée sur dernière position connue ou ville par défaut
  - Banner en haut: "Activez la localisation pour voir les artisans proches"
  - Bouton dans banner → ouvre settings système
  - Désactiver mode Follow

Permission GPS "While Using":
  - Mode Follow actif uniquement quand app au premier plan
  - Si app en background > 5min: suspendre updates GPS

Permission GPS "Always":
  - Mode Follow peut continuer en background (optionnel)
```

### 6.2 Performance et optimisation

```
Throttling des updates:
  - Position GPS: max 1 update/seconde
  - Overlay drag: 60fps natif (useNativeDriver)
  - Carte pan: throttle à 30fps si trop de marqueurs (>50)

Memory management:
  - Unload map tiles hors de viewport
  - Limite de 100 marqueurs visibles simultanément
  - Clustering automatique si > 50 artisans dans zone

Battery optimization:
  - Réduire fréquence GPS si batterie < 20%
  - Suspendre updates si app inactive > 2min
```

### 6.3 Erreurs et états dégradés

```
Erreur réseau (marqueurs artisans):
  - Afficher cache local si disponible
  - Message toast: "Mode hors ligne, données peuvent être obsolètes"
  - Retry automatique toutes les 30s

GPS inactif/imprécis:
  - Afficher position avec large halo de précision
  - Désactiver mode Follow
  - Message: "Signal GPS faible"

Carte ne charge pas:
  - Skeleton loader pendant 3s max
  - Fallback: vue liste seule, overlay à 100%
  - Retry button dans header
```

---

## 7. Spécifications techniques d'implémentation

### 7.1 Stack recommandé

```typescript
// React Native
- react-native-maps (carte native iOS/Android)
- react-native-gesture-handler (gestures)
- react-native-reanimated (animations performantes)
- expo-location (GPS)

// State management
- React hooks (useState, useRef, useEffect)
- Context API pour partage position GPS
```

### 7.2 Structure de composants

```
<ScreenContainer>
  ├─ <MapViewContainer>  ← z-index: 1
  │   ├─ <MapView>
  │   ├─ <UserLocationMarker>
  │   ├─ <ArtisanMarkers>
  │   └─ <MapControls>
  │       ├─ <RecenterButton>
  │       └─ <ZoomButtons>
  │
  ├─ <DimOverlay>  ← z-index: 5, opacity animé
  │
  └─ <BottomSheetOverlay>  ← z-index: 10
      ├─ <HandleBar>
      ├─ <OverlayHeader>
      └─ <ScrollableList>
          └─ <ArtisanCard> (x N)
```

### 7.3 Variables d'état principales

```typescript
// États de l'overlay
enum OverlayState {
  RETRACTED = 'retracted',  // État A (30-40%)
  HALF = 'half',            // État B (50%)
  EXPANDED = 'expanded'     // État C (90-95%)
}

// Hauteurs (en % de screen height)
const OVERLAY_HEIGHTS = {
  [OverlayState.RETRACTED]: 0.35,   // 35%
  [OverlayState.HALF]: 0.50,        // 50%
  [OverlayState.EXPANDED]: 0.92,    // 92%
};

// Mode carte
enum MapMode {
  FOLLOW = 'follow',   // Suivi actif
  FREE = 'free'        // Exploration libre
}

// État GPS
interface LocationState {
  coords: { latitude: number; longitude: number };
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}
```

### 7.4 Gestion des gestures (pseudo-code)

```typescript
// Détection de swipe sur overlay
const handlePanGesture = useCallback((event) => {
  const { translationY, velocityY, state } = event;
  
  if (state === 'active') {
    // Drag en cours: mettre à jour position overlay
    const newPosition = clamp(
      currentPosition + translationY,
      OVERLAY_HEIGHTS.RETRACTED * screenHeight,
      OVERLAY_HEIGHTS.EXPANDED * screenHeight
    );
    overlayPosition.value = newPosition;
    
    // Mettre à jour opacité carte
    const progress = (newPosition - minHeight) / (maxHeight - minHeight);
    mapOpacity.value = interpolate(progress, [0, 1], [1.0, 0.3]);
  }
  
  if (state === 'end') {
    // Fin du drag: snap à l'état le plus proche
    const targetState = determineSnapState(translationY, velocityY);
    animateToState(targetState);
  }
}, [currentPosition]);

// Détection de scroll dans liste
const handleListScroll = useCallback((event) => {
  const { contentOffset } = event;
  
  // Si scroll en haut de liste + pull down → fermer overlay
  if (contentOffset.y <= 0 && scrollDirection === 'down') {
    transitionToState(OverlayState.RETRACTED);
  }
  
  // Si scroll up significatif → expand overlay
  if (scrollDirection === 'up' && scrollDelta > 20) {
    transitionToState(OverlayState.EXPANDED);
  }
}, [scrollDirection]);

// Mode Follow: recentrer carte sur utilisateur
const handleLocationUpdate = useCallback((location) => {
  setUserLocation(location);
  
  if (mapMode === MapMode.FOLLOW) {
    animateCamera({
      center: location.coords,
      zoom: 14,
      duration: 300
    });
  }
}, [mapMode]);
```

---

## 8. Checklist de validation UX

### Interactions fluides
- [ ] Swipe up/down sur overlay: transition fluide 60fps
- [ ] Aucun lag lors du drag de l'overlay
- [ ] Snap aux états définis (A/B/C) fonctionne correctement
- [ ] Animations respectent les durées spécifiées (280-320ms)

### Gestures et conflits
- [ ] Pan sur carte fonctionne en État A
- [ ] Scroll dans liste fonctionne en État B/C
- [ ] Aucun conflit entre pan carte et scroll liste
- [ ] Pinch zoom fonctionne sur la carte quand visible
- [ ] Handle bar capture toujours les swipes verticaux

### Carte et GPS
- [ ] Position utilisateur affichée en temps réel
- [ ] Mode Follow recentre automatiquement la carte
- [ ] Mode Follow désactivé lors du pan manuel
- [ ] Bouton recentrage change d'état selon le mode
- [ ] Marqueurs artisans affichés correctement
- [ ] Tap sur marqueur ouvre la fiche artisan

### Overlay et contenu
- [ ] Liste des artisans scrollable correctement
- [ ] Compteur d'artisans affiché dans header
- [ ] Bouton close visible et fonctionnel en État C
- [ ] Handle bar visible et réactif en États A/B
- [ ] Safe area respectée (notch, barre nav)

### Performance
- [ ] Pas de frame drop lors des animations
- [ ] Batterie: consommation raisonnable (GPS throttlé)
- [ ] Memory: pas de leaks lors des transitions répétées
- [ ] Charge rapide de la carte (<2s)

### Accessibilité
- [ ] Zones tactiles ≥ 44x44px
- [ ] Contraste texte/fond ≥ WCAG AA
- [ ] VoiceOver/TalkBack: overlay et carte navigables
- [ ] Boutons ont des labels accessibles

### Edge cases
- [ ] Permission GPS refusée: banner + fallback
- [ ] Erreur réseau: message + retry
- [ ] Carte ne charge pas: skeleton + fallback liste
- [ ] Batterie faible: GPS throttlé
- [ ] Aucun artisan trouvé: empty state

---

## 9. Wireframes et états visuels

### État A — Carte dominante (35% overlay)
```
┌─────────────────────────────┐
│                             │
│         🗺️ CARTE            │
│                             │
│     [ Recentrer ]           │
│                             │  ← 65% hauteur
│         📍 You              │
│                             │
├─────────────────────────────┤
│         ━━━━━               │  ← Handle bar
│  "12 artisans disponibles"  │
│                             │
│  [ Card Artisan 1 ]         │  ← 35% hauteur
│  [ Card Artisan 2 ]         │
└─────────────────────────────┘
```

### État B — Équilibré (50-50)
```
┌─────────────────────────────┐
│                             │
│         🗺️ CARTE            │  ← 50% hauteur
│         📍 You              │
│                             │
├─────────────────────────────┤
│         ━━━━━               │
│  "12 artisans disponibles"  │
│                             │
│  [ Card Artisan 1 ]         │
│  [ Card Artisan 2 ]         │  ← 50% hauteur
│  [ Card Artisan 3 ]         │
│  [ Card Artisan 4 ]         │
└─────────────────────────────┘
```

### État C — Liste dominante (92% overlay)
```
┌─────────────────────────────┐
│         ━━━━━          [X]  │  ← Header + close
│  "12 artisans disponibles"  │
│  [ 🔍 Rechercher... ]       │
│                             │
│  [ Card Artisan 1 ]         │
│  [ Card Artisan 2 ]         │
│  [ Card Artisan 3 ]         │  ← 92% hauteur
│  [ Card Artisan 4 ]         │   (scrollable)
│  [ Card Artisan 5 ]         │
│  [ Card Artisan 6 ]         │
│  ...                        │
└─────────────────────────────┘
  (Carte masquée/assombrie en fond)
```

---

## 10. Références et inspirations

**Apps de référence:**
- Uber (ride request flow)
- Bolt (ride selection)
- Lyft (driver tracking)
- Google Maps (bottom sheet places)
- Apple Maps (place details sheet)

**Patterns UX:**
- Material Design: Bottom sheets
- iOS: Sheet presentation detents
- Gesture-driven interfaces

**Guides de design:**
- Apple HIG: Modality and sheets
- Material Design: Navigation and sheets

---

## 11. Prochaines étapes d'implémentation

### Phase 1: MVP de base
1. Créer composant MapView avec position utilisateur
2. Créer composant BottomSheetOverlay avec 3 états
3. Implémenter swipe up/down basique (sans vélocité)
4. Tester snap aux états définis

### Phase 2: Gestures avancés
5. Ajouter détection de vélocité pour snap rapide
6. Implémenter scroll-to-expand dans liste
7. Gérer conflits pan carte / scroll liste
8. Ajouter animations fluides (useNativeDriver)

### Phase 3: GPS et suivi
9. Intégrer expo-location pour GPS temps réel
10. Implémenter mode Follow avec recentrage auto
11. Ajouter bouton recentrage avec changement d'état
12. Optimiser throttling GPS

### Phase 4: Polish et performance
13. Ajouter voile assombrissant en État C
14. Implémenter loading states et error handling
15. Optimiser performance (60fps garanti)
16. Tests sur devices réels (iOS + Android)

### Phase 5: Accessibilité et edge cases
17. Ajouter labels accessibilité VoiceOver/TalkBack
18. Gérer permissions GPS (refusées/limitées)
19. Fallback mode hors ligne
20. Tests batterie et memory leaks

---

**FIN DE LA SPÉCIFICATION**

Cette spécification doit servir de référence unique pour l'implémentation. Toute modification doit être documentée et versionnée.

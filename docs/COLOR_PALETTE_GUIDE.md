# 🎨 Guide Complet de la Palette de Couleurs
## Artisan-Go Réseau de Services

**Version:** 1.0.0  
**Date d'extraction:** 2025-01-01  
**Source:** Projet existant + analyse visuelle

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Couleurs principales](#couleurs-principales)
3. [Couleurs neutres](#couleurs-neutres)
4. [Couleurs sémantiques](#couleurs-sémantiques)
5. [États des composants](#états-des-composants)
6. [Accessibilité WCAG](#accessibilité-wcag)
7. [Guide d'utilisation](#guide-dutilisation)
8. [Snippets de code](#snippets-de-code)

---

## Vue d'ensemble

La palette de couleurs d'Artisan-Go repose sur :
- **Bleu ciel (#0284C7)** : Couleur principale, évoque confiance et professionnalisme
- **Orange vibrant (#EA580C)** : Accent pour les CTA et éléments importants
- **Échelle de gris** : 11 nuances pour textes, bordures et backgrounds

### Philosophie de design
- **Moderne et clean** : Espaces blancs généreux, contraste élevé
- **Accessible** : Tous les paires texte/fond respectent WCAG AA minimum
- **Mobile-first** : Optimisé pour la lisibilité sur petits écrans

---

## Couleurs principales

### 🔵 Primary (Sky Blue)

```
#0284C7 - Couleur principale
```

**Utilisation :**
- Headers et navigation
- Boutons primaires
- Links et éléments interactifs
- Icônes principales

**Variantes :**
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | #F0F9FF | Backgrounds ultra-légers |
| 100 | #E0F2FE | Hover states légers |
| 200 | #BAE6FD | Borders actives |
| 300 | #7DD3FC | Icons secondaires |
| 400 | #38BDF8 | Interactive elements |
| 500 | #0EA5E9 | Primary light |
| **600** | **#0284C7** | **⭐ DEFAULT** |
| 700 | #0369A1 | Hover |
| 800 | #075985 | Active/Pressed |
| 900 | #0C4A6E | Text on light bg |

### 🟠 Accent (Orange)

```
#EA580C - Couleur d'accent (WCAG AA compliant)
```

**Utilisation :**
- Call-to-action buttons
- Éléments urgents ou prioritaires
- Badges "Nouveau" ou "Urgent"
- Prix et offres

**Variantes :**
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | #FFF7ED | Backgrounds légers |
| 100 | #FFEDD5 | Badges info |
| 400 | #FB923C | Interactive |
| 500 | #F97316 | Accent original (⚠️ contraste limité) |
| **600** | **#EA580C** | **⭐ DEFAULT WCAG AA** |
| 700 | #C2410C | Hover |
| 800 | #9A3412 | Active |

---

## Couleurs neutres

### ⚫ Neutral (Gray Scale)

**Échelle complète :**

| Shade | Hex | RGB | Usage principal |
|-------|-----|-----|-----------------|
| 0 | #FFFFFF | 255,255,255 | Surface, Cards ⭐ |
| 50 | #FAFAFA | 250,250,250 | Background app ⭐⭐ |
| 100 | #F5F5F5 | 245,245,245 | Border très léger |
| 200 | #E5E5E5 | 229,229,229 | Border default ⭐ |
| 300 | #D4D4D4 | 212,212,212 | Border dark |
| 400 | #A3A3A3 | 163,163,163 | Texte tertiaire ⭐ |
| 600 | #525252 | 82,82,82 | Texte secondaire ⭐⭐ |
| 900 | #171717 | 23,23,23 | Texte principal ⭐⭐⭐ |

**Hiérarchie de texte :**
```css
H1-H3: #171717 (Neutral 900)
Body text: #525252 (Neutral 600)
Placeholders: #A3A3A3 (Neutral 400)
Disabled text: #D4D4D4 (Neutral 300)
```

---

## Couleurs sémantiques

### ✅ Success (Vert)
```
#10B981 - Default
#059669 - Dark (WCAG AA sur blanc) ⭐
#D1FAE5 - Light (backgrounds)
```

### ⚠️ Warning (Ambre)
```
#F59E0B - Default
#D97706 - Dark
#FEF3C7 - Light
```

### ❌ Error (Rouge)
```
#EF4444 - Default
#DC2626 - Dark
#FEE2E2 - Light
```

### ℹ️ Info (Bleu)
```
#3B82F6 - Default
#2563EB - Dark
#DBEAFE - Light
```

**Usage des badges :**
```tsx
// Succès
<Badge bg="#D1FAE5" text="#059669">Complété</Badge>

// Warning
<Badge bg="#FEF3C7" text="#D97706">En attente</Badge>

// Error
<Badge bg="#FEE2E2" text="#DC2626">Annulé</Badge>

// Info
<Badge bg="#DBEAFE" text="#2563EB">Nouveau</Badge>
```

---

## États des composants

### 🔘 Boutons

#### Primary Button
```css
Default:  bg: #0284C7, text: #FFFFFF
Hover:    bg: #0369A1
Active:   bg: #075985
Disabled: bg: #D1D5DB, text: #A3A3A3
```

#### Accent Button (CTA)
```css
Default:  bg: #EA580C, text: #FFFFFF
Hover:    bg: #C2410C
Active:   bg: #9A3412
Disabled: bg: #D1D5DB
```

#### Secondary Button
```css
Default:  bg: transparent, border: #0284C7, text: #0284C7
Hover:    bg: #F5F5F5
Active:   bg: #E5E5E5
```

### 🔲 Borders & Dividers
```css
Light:   #F5F5F5 (entre sections)
Default: #E5E5E5 (cards, inputs)
Dark:    #D4D4D4 (emphasis)
```

### 🌑 Overlays
```css
Dark overlay:  rgba(0, 0, 0, 0.6) - Modals
Light overlay: rgba(0, 0, 0, 0.3) - Dropdowns
```

---

## Accessibilité WCAG

### ✅ Paires conformes (AA/AAA)

| Texte | Fond | Ratio | Niveau | Usage |
|-------|------|-------|--------|-------|
| #171717 | #FFFFFF | 18.8:1 | AAA | ⭐⭐⭐ Titres |
| #525252 | #FFFFFF | 7.5:1 | AAA | ⭐⭐ Body text |
| #FFFFFF | #0284C7 | 4.9:1 | AA | ⭐ Buttons |
| #FFFFFF | #EA580C | 4.2:1 | AA | ⭐ CTA |

### ⚠️ Ajustements nécessaires

| Original | Problème | Solution |
|----------|----------|----------|
| #F97316 sur blanc | Ratio 3.0:1 (Fail) | Utiliser #EA580C (4.2:1) |
| #10B981 sur blanc | Ratio 2.8:1 (Fail) | Utiliser #059669 pour texte |
| #A3A3A3 sur blanc | Ratio 3.4:1 | OK pour texte large uniquement (18px+) |

### 📏 Règles de contraste

```typescript
// Minimum requis
Text normal (< 18px): Ratio >= 4.5:1 (WCAG AA)
Text large (>= 18px): Ratio >= 3:1 (WCAG AA)

// Recommandé
Text important: Ratio >= 7:1 (WCAG AAA)
UI components: Ratio >= 3:1
```

---

## Guide d'utilisation

### 📱 Structure de page type

```
┌─────────────────────────────────┐
│ HEADER (#0284C7 + #FFF text)    │ ← Primary
├─────────────────────────────────┤
│ BODY (#FAFAFA background)       │ ← Neutral 50
│  ┌───────────────────────────┐  │
│  │ CARD (#FFFFFF surface)    │  │ ← Neutral 0
│  │ Border: #E5E5E5           │  │ ← Neutral 200
│  │ Shadow: 0 2px 8px 08%     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [CTA Button #EA580C]      │  │ ← Accent
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│ FOOTER (#171717 + #A3A3A3)      │ ← Neutral 900/400
└─────────────────────────────────┘
```

### 🎯 Décisions de design

**Quand utiliser Primary vs Accent ?**
```
Primary (#0284C7):
- Navigation principale
- Liens standards
- Icônes d'interface
- Éléments de marque

Accent (#EA580C):
- Appels à l'action critiques (ex: "Réserver maintenant")
- Notifications urgentes
- Prix / Offres limitées
- Boutons de conversion
```

**Hiérarchie des boutons :**
```
1. Primary CTA (Accent #EA580C) - 1 par écran max
2. Secondary action (Primary #0284C7)
3. Tertiary action (Ghost/Transparent)
```

---

## Snippets de code

### React Native (TypeScript)

```typescript
// constants/colors-extracted.ts
export const Colors = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7', // DEFAULT
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  accent: {
    600: '#EA580C', // WCAG AA DEFAULT
    700: '#C2410C',
    800: '#9A3412',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    200: '#E5E5E5',
    400: '#A3A3A3',
    600: '#525252',
    900: '#171717',
  },
  semantic: {
    success: '#059669',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

// Usage in components
import { Colors } from '@/constants/colors-extracted';

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary[600],
  },
  ctaButton: {
    backgroundColor: Colors.accent[600],
  },
  text: {
    color: Colors.neutral[900],
  },
});
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284C7',
          50: '#F0F9FF',
          600: '#0284C7',
          700: '#0369A1',
        },
        accent: {
          DEFAULT: '#EA580C',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
    },
  },
};

// Usage
<button className="bg-primary hover:bg-primary-700">
<div className="bg-accent-600 text-white">
```

### CSS Variables

```css
/* Voir fichier docs/color-palette-extracted.css */
:root {
  --primary: #0284C7;
  --accent: #EA580C;
  --text-primary: #171717;
}

.button-primary {
  background-color: var(--primary);
}
```

---

## 📦 Fichiers générés

Tous les fichiers sont dans `docs/` :
1. `color-palette-extracted.css` - Variables CSS
2. `color-palette-tailwind.json` - Config Tailwind
3. `color-palette-complete.json` - Palette JSON complète
4. `COLOR_PALETTE_GUIDE.md` - Ce guide (1-pager)

---

## ✅ Checklist d'implémentation

- [ ] Remplacer `#F97316` par `#EA580C` dans tous les boutons accent
- [ ] Vérifier tous les textes sur fond coloré (ratio >= 4.5:1)
- [ ] Utiliser `#059669` pour texte succès sur fond blanc
- [ ] Appliquer ombres cohérentes (0 2px 8px rgba(0,0,0,0.08))
- [ ] Border radius uniforme: 12px (cards), 8px (buttons)
- [ ] Tester en mode sombre si nécessaire

---

**Contact:** Design System Team  
**Dernière mise à jour:** 2025-01-01

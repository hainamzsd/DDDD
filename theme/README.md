# Theme System - Color Palette Guide

Complete color palette extracted from the LocationID Tracker design.

## Color Palette Overview

### Primary Colors - Forest Green (Government/Official Theme)

```typescript
colors.primary[50]  = '#f0fdf4'  // Lightest green background
colors.primary[100] = '#dcfce7'  // Very light green
colors.primary[200] = '#bbf7d0'  // Light green gradient
colors.primary[300] = '#86efac'  // Medium light green
colors.primary[400] = '#4ade80'  // Medium green
colors.primary[500] = '#15803d'  // ⭐ Primary green (main brand)
colors.primary[600] = '#0f5132'  // ⭐ Dark green (primary gradient start)
colors.primary[700] = '#145a3a'  // Dark green (primary gradient end)
colors.primary[800] = '#0d3b24'  // Very dark green
colors.primary[900] = '#082518'  // Darkest green
```

**Usage:**
- Headers and navigation: `primary[600]` to `primary[700]`
- Text on light backgrounds: `primary[600]`
- Borders and dividers: `primary[200]` to `primary[300]`
- Light backgrounds: `primary[50]` to `primary[100]`

---

### Secondary Colors - Red (Action/Alert)

```typescript
colors.secondary[50]  = '#fef2f2'  // Lightest red
colors.secondary[100] = '#fee2e2'  // Very light red
colors.secondary[200] = '#fecaca'  // Light red
colors.secondary[300] = '#fca5a5'  // Medium light red
colors.secondary[400] = '#f87171'  // Medium red
colors.secondary[500] = '#dc2626'  // ⭐ Primary red (main action)
colors.secondary[600] = '#b91c1c'  // ⭐ Dark red (gradient end)
colors.secondary[700] = '#991b1b'  // Very dark red
colors.secondary[800] = '#7f1d1d'  // Darkest red
colors.secondary[900] = '#450a0a'  // Almost black red
```

**Usage:**
- Primary action buttons: `secondary[500]` to `secondary[600]`
- Important badges and icons: `secondary[500]`
- Error states: `secondary[500]`
- Destructive actions: `secondary[600]`

---

### Accent Colors - Yellow/Amber (Highlights/Warnings)

```typescript
colors.accent[50]  = '#fffbeb'  // Lightest yellow
colors.accent[100] = '#fef3c7'  // Very light yellow
colors.accent[200] = '#fde68a'  // Light yellow
colors.accent[300] = '#fcd34d'  // Medium light yellow
colors.accent[400] = '#fbbf24'  // ⭐ Primary yellow (badges/highlight)
colors.accent[500] = '#f59e0b'  // ⭐ Amber (gradient end)
colors.accent[600] = '#d97706'  // Dark amber
colors.accent[700] = '#b45309'  // Very dark amber
colors.accent[800] = '#92400e'  // Darkest amber
colors.accent[900] = '#78350f'  // ⭐ Text on yellow backgrounds
```

**Usage:**
- Warning badges: `accent[400]`
- Highlights and emphasis: `accent[400]`
- Text on yellow backgrounds: `accent[900]`
- Decorative accents: `accent[400]` to `accent[500]`

---

### Neutral Colors - Gray (Text/Backgrounds)

```typescript
colors.neutral[50]  = '#f9fafb'  // Almost white
colors.neutral[100] = '#f1f5f9'  // ⭐ Main app background
colors.neutral[200] = '#e5e7eb'  // Light gray
colors.neutral[300] = '#d1d5db'  // Border gray
colors.neutral[400] = '#9ca3af'  // Medium gray
colors.neutral[500] = '#6b7280'  // ⭐ Secondary text
colors.neutral[600] = '#4b5563'  // ⭐ Labels and captions
colors.neutral[700] = '#374151'  // Darker gray
colors.neutral[800] = '#1f2937'  // ⭐ Primary text
colors.neutral[900] = '#111827'  // Almost black
colors.neutral[950] = '#171717'  // Phone frame black
```

**Usage:**
- App background: `neutral[100]`
- Primary text: `neutral[800]`
- Secondary text: `neutral[500]`
- Labels: `neutral[600]`
- Borders: `neutral[300]`

---

## Gradient Combinations

### Background Gradient (Warm Light)
```typescript
colors.gradients.background = {
  start: '#fef9f3',
  end: '#fef3e2',
}
```

### Primary Green Gradient
```typescript
colors.gradients.primary = {
  start: '#0f5132',
  end: '#145a3a',
}
```
**Used for:** Headers, badges, important containers

### Secondary Red Gradient
```typescript
colors.gradients.secondary = {
  start: '#dc2626',
  end: '#b91c1c',
}
```
**Used for:** Action buttons, alerts

### Accent Yellow Gradient
```typescript
colors.gradients.accent = {
  start: '#fbbf24',
  end: '#f59e0b',
}
```
**Used for:** Warning badges, highlights

### Light Green Gradient
```typescript
colors.gradients.lightGreen = {
  start: '#dcfce7',
  end: '#bbf7d0',
}
```
**Used for:** Survey icons, light backgrounds

---

## Semantic Colors

Quick access to semantic color meanings:

```typescript
colors.semantic.success = '#15803d'  // Green for success states
colors.semantic.warning = '#fbbf24'  // Yellow for warnings
colors.semantic.error   = '#dc2626'  // Red for errors
colors.semantic.info    = '#3b82f6'  // Blue for info
```

---

## Chart & Data Visualization Colors

### Photo/Media Colors
```typescript
colors.chart.photo = [
  '#6366f1',  // Indigo
  '#8b5cf6',  // Purple
  '#ec4899',  // Pink
  '#f97316',  // Orange
  '#10b981',  // Emerald
]
```

### Data Colors
```typescript
colors.chart.data = [
  '#fbbf24',  // Yellow
  '#15803d',  // Green
  '#dc2626',  // Red
  '#3b82f6',  // Blue
  '#f59e0b',  // Amber
]
```

---

## Special Colors

### Glass Effect
```typescript
colors.special.glass = {
  background: 'rgba(255, 255, 255, 0.15)',
  border: 'rgba(255, 255, 255, 0.3)',
}
```
**Used for:** Settings button, overlay effects

### Overlays
```typescript
colors.special.overlay = {
  light: 'rgba(255, 255, 255, 0.15)',
  dark: 'rgba(0, 0, 0, 0.5)',
}
```

---

## Color Pairing Guidelines

### Text on Backgrounds

```typescript
// Text colors for different backgrounds
colorPairs.text = {
  onPrimary: '#ffffff',    // White text on green
  onSecondary: '#ffffff',  // White text on red
  onAccent: '#78350f',     // Dark amber on yellow
  onLight: '#1f2937',      // Dark gray on light bg
  onDark: '#ffffff',       // White on dark bg
}
```

### Border Colors

```typescript
colorPairs.border = {
  primary: '#86efac',     // Light green border
  light: '#bbf7d0',       // Very light green
  accent: '#fbbf24',      // Yellow border
  neutral: '#d1d5db',     // Gray border
}
```

### Shadow Colors

```typescript
colorPairs.shadow = {
  primary: 'rgba(15, 81, 50, 0.2)',      // Green shadow
  secondary: 'rgba(220, 38, 38, 0.3)',   // Red shadow
  accent: 'rgba(251, 191, 36, 0.3)',     // Yellow shadow
  neutral: 'rgba(0, 0, 0, 0.08)',        // Neutral shadow
}
```

---

## Usage Examples

### Component Styling

```typescript
import { colors, colorPairs } from '../theme';

// Button with gradient
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.secondary[500],
    // For gradient, use LinearGradient with:
    // [colors.gradients.secondary.start, colors.gradients.secondary.end]
  },

  // Text colors
  primaryText: {
    color: colors.primary[600],
  },
  secondaryText: {
    color: colors.neutral[500],
  },

  // Borders
  inputBorder: {
    borderColor: colorPairs.border.primary,
    borderWidth: 2,
  },

  // Backgrounds
  screenBackground: {
    backgroundColor: colors.neutral[100],
  },
  cardBackground: {
    backgroundColor: colors.special.white,
  },
});
```

### LinearGradient Example

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

<LinearGradient
  colors={[
    colors.gradients.primary.start,
    colors.gradients.primary.end,
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ borderRadius: 20, padding: 20 }}
>
  {/* Header content */}
</LinearGradient>
```

---

## Color Accessibility

All color combinations have been designed with accessibility in mind:

- **Primary text on light backgrounds:** Meets WCAG AAA (contrast ratio > 7:1)
- **White text on primary/secondary colors:** Meets WCAG AA (contrast ratio > 4.5:1)
- **Dark amber on yellow backgrounds:** Meets WCAG AA

---

## Quick Reference - Most Used Colors

```typescript
// Backgrounds
colors.neutral[100]        // Main app background
colors.special.white       // Card backgrounds
colors.primary[50]         // Light green background

// Text
colors.primary[600]        // Primary headings
colors.neutral[800]        // Body text
colors.neutral[500]        // Secondary text

// Actions
colors.secondary[500]      // Primary buttons
colors.primary[600]        // Secondary buttons
colors.accent[400]         // Warnings/highlights

// Borders
colors.primary[200]        // Light borders
colors.primary[300]        // Medium borders
```

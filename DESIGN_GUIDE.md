# DomusVita OCR - Apple-Inspired Design Guide

## 🎨 Design-System

### Farbpalette

```css
/* Primary Colors */
--apple-blue: #007aff;
--apple-blue-hover: #0051d5;

/* Neutral Colors */
--foreground: #1d1d1f;        /* Text */
--apple-gray: #86868b;         /* Secondary Text */
--apple-gray-light: #f5f5f7;   /* Background */
--apple-gray-medium: #d2d2d7;  /* Borders */

/* Shadows */
--apple-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
--apple-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.12);
```

### Typography

**Font Stack:**
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
```

**Font Sizes:**
- Heading 1: `text-2xl` (mobile) → `text-4xl` (desktop)
- Heading 2: `text-xl` → `text-2xl`
- Body: `text-sm` → `text-base`
- Small: `text-xs` → `text-sm`

**Font Weights:**
- Bold: `font-bold` (700)
- Semibold: `font-semibold` (600)
- Medium: `font-medium` (500)

**Letter Spacing:**
- Headlines: `tracking-tight` (-0.01em)

## 🧩 Komponenten

### Glassmorphism Cards

```tsx
<div className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8">
  {/* Content */}
</div>
```

**Features:**
- Semi-transparent white background
- Backdrop blur (20px)
- Soft shadow
- Hover effect: translateY(-2px) + larger shadow

### Buttons

**Primary Button:**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3
                 rounded-xl font-semibold text-xs sm:text-sm
                 transition-all duration-200 btn-haptic shadow-sm hover:shadow-md">
  Button Text
</button>
```

**Features:**
- Rounded corners (12px-16px)
- Haptic feedback (scale on press)
- Smooth transitions
- Touch-optimized (min 44px height)

### Input Fields

```tsx
<input className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200 text-sm font-medium text-gray-900
                placeholder:text-gray-400" />
```

**Features:**
- Subtle borders
- Focus state with blue ring
- Smooth transitions
- Placeholder styling

### Select Dropdowns

```tsx
<select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 transition-all duration-200 text-sm font-medium text-gray-900">
  <option>Option 1</option>
</select>
```

## 🎭 Animationen

### Verfügbare Animationen

```css
/* Slide Up - für Cards beim Laden */
.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Fade In - für Content-Erscheinen */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Scale In - für Modal/Dialog */
.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Haptic Feedback (Buttons)

```css
.btn-haptic {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-haptic:active {
  transform: scale(0.97);
}
```

### Hover Effects

```css
.glass-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--apple-shadow-lg);
}
```

## 📱 Responsive Design

### Breakpoints

```css
/* Tailwind Default Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

### Mobile-First Approach

Immer mobile-first entwickeln:

```tsx
<div className="
  p-4          {/* Mobile: 16px padding */}
  sm:p-6       {/* Small: 24px padding */}
  lg:p-8       {/* Large: 32px padding */}
">
```

### Layout Grid

```tsx
{/* Stack auf Mobile, Grid auf Desktop */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

### Touch-Optimierung

```css
/* Mindesthöhe für Touch-Targets */
@media (hover: none) and (pointer: coarse) {
  button, a, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## 🎯 Best Practices

### 1. Weißraum nutzen

- Großzügige Padding-Werte (p-6, p-8)
- Spacing zwischen Elementen (gap-4, gap-6)
- Margin zwischen Sections (mb-6, mb-8)

### 2. Konsistente Border Radius

- Small: `rounded-xl` (12px)
- Medium: `rounded-2xl` (16px)
- Large: `rounded-3xl` (24px)

### 3. Subtile Schatten

```tsx
shadow-sm       // Sehr subtil
shadow-md       // Mittel (hover states)
shadow-lg       // Prominent
```

### 4. Smooth Transitions

Alle interaktiven Elemente:
```tsx
transition-all duration-200
```

### 5. Focus States

Immer fokussierbare Elemente mit deutlichem Focus Ring:
```tsx
focus:outline-none focus:ring-2 focus:ring-blue-500
```

## 🧰 Utility Classes

### Custom Classes (globals.css)

```css
.glass-card              /* Glassmorphism Card */
.glass-card-hover        /* Mit Hover Effect */
.btn-haptic              /* Button mit Haptic Feedback */
.animate-slide-up        /* Slide Up Animation */
.animate-fade-in         /* Fade In Animation */
.animate-scale-in        /* Scale In Animation */
```

## 📐 Spacing System

```css
p-4  = 16px    /* Mobile default */
p-6  = 24px    /* Desktop small */
p-8  = 32px    /* Desktop default */

gap-4  = 16px  /* Grid/Flex gap mobile */
gap-6  = 24px  /* Grid/Flex gap desktop */

mb-6  = 24px   /* Section margin mobile */
mb-8  = 32px   /* Section margin desktop */
```

## 🎨 Color Usage

### Text Colors

```tsx
text-gray-900    /* Primary text (headlines) */
text-gray-700    /* Secondary text (labels) */
text-gray-600    /* Tertiary text (descriptions) */
text-gray-400    /* Placeholder text */
```

### Background Colors

```tsx
bg-white         /* Cards, inputs */
bg-gray-50       /* Subtle backgrounds */
bg-blue-50       /* Info boxes */
bg-green-50      /* Success states */
bg-red-50        /* Error states */
```

### Border Colors

```tsx
border-gray-200  /* Default borders */
border-gray-300  /* Stronger borders */
border-blue-500  /* Focus states */
```

## 🚀 Performance

### CSS Optimierungen

- Tailwind CSS mit Tree-Shaking
- @import "tailwindcss" für v4
- Minimal Custom CSS

### Animation Performance

- Nur `transform` und `opacity` animieren
- Hardware-beschleunigt mit `will-change` wo nötig
- Cubic-bezier für natürliche Bewegungen

### Best Practices

1. Bilder mit `loading="lazy"`
2. SVG Icons wo möglich
3. Minimal JavaScript für Animationen
4. CSS-only Hover States

## 📱 Accessibility

### Keyboard Navigation

- Alle Buttons fokussierbar
- Tab-Order logisch
- Focus Indicators sichtbar

### Screen Readers

- Semantic HTML (section, header, nav)
- aria-label für Icon-Buttons
- Alt-Text für Bilder

### Color Contrast

- WCAG AA konform
- Mindestens 4.5:1 für normalen Text
- 3:1 für große Text

## 🔧 Entwickler-Tipps

### VSCode Extensions

- Tailwind CSS IntelliSense
- PostCSS Language Support

### Debugging

```tsx
{/* Responsive Debug */}
<div className="hidden sm:block">Small+</div>
<div className="hidden md:block">Medium+</div>
<div className="hidden lg:block">Large+</div>
```

### Komponenten-Struktur

```tsx
// Immer mobile-first
<div className="
  {/* Layout */}
  flex flex-col lg:flex-row

  {/* Spacing */}
  p-4 sm:p-6 lg:p-8
  gap-4 sm:gap-6

  {/* Styling */}
  bg-white rounded-2xl
  border border-gray-200

  {/* States */}
  hover:shadow-md
  transition-all duration-200
">
```

## 📝 Checklist für neue Komponenten

- [ ] Mobile-first Approach
- [ ] Touch-optimiert (min 44px)
- [ ] Focus States definiert
- [ ] Hover Effects smooth
- [ ] Animationen mit cubic-bezier
- [ ] Accessible (ARIA, semantic HTML)
- [ ] Konsistente Border Radius
- [ ] Spacing-System verwendet
- [ ] Text scales responsive
- [ ] Color Contrast WCAG-konform

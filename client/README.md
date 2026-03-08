# MapleEstate AI

A Canadian real estate intelligence platform with live 3D map visualization, AI-powered search, and comprehensive property data.

## 🎨 Design Philosophy

Inspired by arcki.tech with a focus on:
- **Dark mode throughout** — pure black background (#000000)
- **Typography-driven design** — large, confident serif headlines (Playfair Display)
- **Minimal, purposeful interface** — generous whitespace, no unnecessary decoration
- **Premium accent color** — cyan (#00d4ff) for active elements
- **Cinematic feel** — subtle animations, smooth transitions
- **Desktop-first responsive** — built for professionals

## 🚀 Tech Stack

- **Next.js 14** App Router with TypeScript (strict mode)
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for all animations
- **Mapbox GL JS** for 3D map visualization
- **Google Fonts**: Playfair Display (display) + Inter (body)

## 📦 Installation

```bash
cd client
npm install
```

## 🔑 Environment Variables

Create a `.env.local` file in the client directory:

```bash
# Get your token from https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Get your key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Build

```bash
npm run build
npm start
```

## 📂 Project Structure

```
client/
├── app/
│   ├── page.tsx              # Landing page with hero + features
│   ├── map/
│   │   └── page.tsx          # Map page (dynamic import)
│   ├── layout.tsx            # Root layout with fonts
│   └── globals.css           # Global styles (arcki.tech inspired)
├── components/
│   ├── Logo.tsx              # MapleEstate logo component
│   ├── Navbar.tsx            # Navigation with scroll detection
│   ├── HeroBackground.tsx    # Animated canvas background
│   ├── MapView.tsx           # Main map component with Mapbox
│   ├── HouseMarker.tsx       # Custom property marker with pulse
│   ├── PropertyPanel.tsx     # Slide-in property detail panel
│   └── SearchBar.tsx         # Search input component
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── utils.ts              # Utility functions (formatPrice, etc.)
└── public/
    └── listings.json         # Property data (converted from CSV)
```

## ✨ Key Features

### Landing Page
- **Hero section** with animated particle background
- **Scroll-triggered animations** using Framer Motion's `useInView`
- **Feature blocks** with numbered sections (01, 02, 03)
- **Responsive design** with mobile-first breakpoints
- **Smooth scrolling** to sections

### Map Page
- **3D Mapbox terrain** with pitch and bearing
- **Custom React markers** rendered via `createRoot()`
- **Pulsing marker animation** using CSS keyframes
- **Property detail panel** that slides in from right
- **Tabbed interface** (Overview, Details, Agent)
- **Fly-to animation** when marker is clicked
- **Real-time property count** badge

## 🎯 Technical Highlights

### Mapbox Integration
- Dynamic import with `ssr: false` to prevent server-side rendering
- 3D buildings with fill-extrusion layer
- Terrain with DEM exaggeration
- Custom sky layer with atmosphere
- NavigationControl for zoom/bearing

### React Marker Rendering
```typescript
const el = document.createElement('div')
const root = createRoot(el)
root.render(<HouseMarker price={price} active={active} onClick={handleClick} />)
const marker = new mapboxgl.Marker({ element: el })
  .setLngLat([lng, lat])
  .addTo(map)
```

### Animation System
- **Page load**: staggered fade-up with delays
- **Scroll trigger**: `useInView` with `-80px` margin
- **Transitions**: cubic-bezier `[0.16, 1, 0.3, 1]` for smoothness
- **Hover states**: scale and transform only
- **No spring animations** — precision over bounce

### Marker Pulse Effect
```css
@keyframes markerPulse {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.8); opacity: 0;   }
}
```
Double-ring with staggered delay for radar effect.

## 🎨 Color Palette

```css
--accent: #00d4ff      /* Cyan — used for CTAs, markers, highlights */
Background: #000000     /* Pure black */
Text: #ffffff          /* White */
Muted: rgba(255,255,255,0.5)  /* 50% white */
Surface: rgba(255,255,255,0.05)  /* 5% white for cards */
```

## 📊 Data Format

Properties are loaded from `public/listings.json`:

```json
{
  "data": {
    "properties": [
      {
        "property_id": "prop_0",
        "list_price": 999888,
        "address": {
          "latitude": 43.679882,
          "longitude": -79.544266,
          "street_number": "86",
          "street": "Waterford Dr",
          "city": "Toronto",
          "state_code": "ON",
          "postal_code": "M4B2K8"
        },
        "description": {
          "beds": 3,
          "baths": 2,
          "sqft_living": 1800,
          "lot_size": 5000,
          "year_built": 1995,
          "property_type": "single_family_residential"
        },
        "photo": "https://picsum.photos/seed/0/800/600",
        "status": "for_sale",
        "listing_id": "MLS12345678",
        "agent": {
          "name": "Sarah Johnson",
          "office": "RE/MAX Real Estate"
        },
        "open_house": "2026-03-15T14:00:00"
      }
    ]
  }
}
```

## 🔧 Configuration

### Tailwind
Uses custom font variables:
```js
fontFamily: {
  display: ['var(--font-display)'],
  sans: ['var(--font-sans)'],
}
```

### TypeScript
Strict mode enabled. No `any` types allowed.

## 🚨 Important Notes

1. **Mapbox markers**: Always clean up with `marker.remove()` in useEffect cleanup
2. **Map initialization**: Use `mapInitialized.current` ref to prevent double-init
3. **3D buildings**: Only add in `map.on('load')` callback
4. **Dynamic imports**: Mark map page as `'use client'` for SSR false to work
5. **AnimatePresence**: Wrap components that mount/unmount (panel, tabs)

## 📄 License

© 2026 MapleEstate AI · Waterloo, Canada

---

Built by a senior full-stack engineer for the modern real estate professional.

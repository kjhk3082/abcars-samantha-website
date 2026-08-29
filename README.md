# Samantha Used Car - Official Website

> **SOFA Vehicle Specialist** - Premium US-Spec vehicles for US Military personnel in Korea

## 🚗 Project Overview

Samantha Used Car is a professional car dealership website targeting US Military personnel stationed in Korea. Samantha works at Gorilla Motors Main Office (Anjeong-ro, Paengseong-eup, Pyeongtaek — near Camp Humphreys). The site features a modern, responsive design with smooth animations and intuitive navigation.

**Slogan:** *"Our vehicles and services are second to none!"*

---

## ✅ Completed Features

### Pages
| Page | File | Description |
|------|------|-------------|
| **Home** | `index.html` | Hero section with animated car illustration, services overview, footer |
| **Inventory** | `vehicles.html` | Live inventory synced from Gorilla Motors (filter chips, search, sort) |
| **Vehicle Detail** | `car.html?id=<productId>` | Per-car page: photo gallery, specs, blurb, sticky CALL/WhatsApp — shareable link |
| **Digital Card** | `business-card.html` | Interactive 3D business card with Three.js |
| **Contact** | `contact.html` | Contact info, business hours, Google Maps, services list |

### Design Features
- ✅ **Fully Responsive** - Mobile, Tablet, Desktop optimized
- ✅ **Mobile Hamburger Menu** - Full-screen overlay navigation
- ✅ **Custom Cursor** - Desktop only (1024px+)
- ✅ **Animated Hero Section** - SVG car illustration with floating animation
- ✅ **Image Reveal Effects** - Grayscale to color on hover
- ✅ **Scroll Animations** - IntersectionObserver-based reveals
- ✅ **Facebook Integration** - All vehicles link to Facebook page

### Performance Optimizations
- ✅ Removed heavy libraries (GSAP, Lenis, ScrollTrigger)
- ✅ CSS-based animations instead of JavaScript
- ✅ Lazy loading for images
- ✅ Custom cursor only on desktop with mouse
- ✅ RequestAnimationFrame for smooth cursor movement

---

## 📁 File Structure

```
/
├── index.html              # Home page
├── vehicles.html           # Vehicle inventory
├── contact.html            # Contact information
├── business-card.html      # 3D Digital business card
├── README.md               # This file
│
├── css/
│   └── style.css           # Main stylesheet (v2.0)
│
├── js/
│   └── business-card.js    # Three.js 3D card (faces drawn on canvas, WhatsApp QR)
│
├── data/
│   ├── sync-config.json    # Which Gorilla Motors cars to sync (categories / include / exclude)
│   └── vehicles.json       # Auto-generated live inventory (do not edit by hand)
│
├── scripts/
│   └── sync_vehicles.py    # Scraper that refreshes data/vehicles.json
│
└── .github/workflows/
    └── sync-vehicles.yml   # Cron every 3 hours + manual "Run workflow" sync
```

---

## 🔗 Functional URIs

| Page | Path | Description |
|------|------|-------------|
| Home | `/index.html` | Main landing page |
| Inventory | `/vehicles.html` | Vehicle listings |
| Contact | `/contact.html` | Contact & location info |
| Digital Card | `/business-card.html` | 3D interactive card |

### External Links
- **Facebook**: https://www.facebook.com/Samanthacars/
- **WhatsApp**: https://api.whatsapp.com/send?phone=821071704513
- **Google Maps**: Gorilla Motors, 401-1 Songhwa-ri location
- **Waze**: Navigation link

---

## 📍 Business Information

| Info | Details |
|------|---------|
| **Address** | 186-3, Songhwa 2-gil, Paengseong-eup, Pyeongtaek-si (경기도 평택시 팽성읍 송화2길 186-3 · 지번 송화리 410-1, Gorilla Motors) |
| **Phone** | 010-7170-4513 |
| **Email** | flowerdudtlr@gmail.com |
| **Hours** | Mon-Fri 9:00-18:00 · Sat 9:00-17:00 · Sun 9:00-16:00 (open 7 days) |
| **Google** | ★ 4.8 · 231 reviews — https://share.google/Qmi8x4GN4Q4EXiSHd |

---

## 🛠 Services Offered

1. ✓ Reliable vehicle maintenance and servicing
2. ✓ SOFA vehicle registration service
3. ✓ 1 month warranty for engine & transmission
4. ✓ Free car rental while fixing vehicles
5. ✓ Free junk and resale service
6. ✓ Pick up, towing & emergency roadside service

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Features |
|------------|-------|----------|
| **Mobile** | < 640px | Single column, hamburger menu, no custom cursor |
| **Small Mobile** | 640px+ | Slightly larger fonts |
| **Tablet** | 768px+ | 2-column grids, larger images |
| **Desktop** | 1024px+ | Full navigation, custom cursor enabled |
| **Large Desktop** | 1280px+ | Hero car illustration visible |
| **XL Desktop** | 1536px+ | Maximum layout width |

---

## 🔄 Live Inventory Sync

`vehicles.html` renders `data/vehicles.json`, which a GitHub Action refreshes **every
3 hours** from the Gorilla Motors site (gorillamotors.co.kr). Cars removed there (sold)
disappear from this site on the next run; new listings appear with their full photo gallery.

- **Change which cars appear**: edit `data/sync-config.json`
  - `source_categories` — Gorilla Motors category pages to scan (default: all categories = full inventory)
  - `filter.mode: "all"` — every scanned car (current default); `"include"` + `filter.include: [productIds]` — only those exact cars
  - `filter.exclude: [productIds]` — hide specific cars
- **Refresh immediately**: GitHub → Actions → "Sync vehicles from Gorilla Motors" → Run workflow
- The scraper never overwrites the inventory with an empty list, so a Gorilla Motors outage
  or redesign leaves the last good data in place.

### Fully-automatic Facebook mode (optional)

Facebook blocks anonymous scraping, so full automation needs an official Meta **Page Access
Token** for the "Samantha Used car" page (one-time setup by the page admin at
https://developers.facebook.com: create an app → Graph API → page token with
`pages_read_engagement`). Then add it in GitHub → Settings → Secrets → Actions as
`FB_PAGE_TOKEN` (optional `FB_PAGE_ID`). From then on the daily job reads her latest posts,
matches them to Gorilla Motors inventory by model/price/year (`scripts/fb_update_include.py`),
and maintains `filter.include` by itself. Without the secret, that step skips silently and the
hand-maintained include list is used.

---

## 🚀 Technologies Used

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **Custom CSS** - Additional styles in `css/style.css`
- **Vanilla JavaScript** - No jQuery dependency
- **Three.js** - 3D business card (business-card.html only)
- **Google Analytics** - GA4 tracking (G-VF1YRTLKDW)

---

## ⚠️ Removed/Deprecated

The following have been removed from the codebase:
- ~~GSAP (GreenSock Animation Platform)~~
- ~~Lenis Smooth Scroll~~
- ~~ScrollTrigger~~
- ~~js/main.js (old navigation script)~~
- ~~cursor-none classes throughout HTML~~

---

## 📝 Future Improvements

1. [ ] Add vehicle detail pages
2. [ ] Implement contact form with email functionality
3. [ ] Add more vehicle inventory from Facebook
4. [ ] Create admin panel for vehicle management
5. [ ] Add Korean language toggle
6. [ ] Implement PWA features for mobile

---

## 📄 License

© 2026 Samantha Used Car. All rights reserved.

---

*Last Updated: August 29, 2026*

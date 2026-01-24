# ABCars Samantha - Official Website

> **SOFA Vehicle Specialist** - Premium US-Spec vehicles for US Military personnel in Korea

## 🚗 Project Overview

ABCars Samantha is a professional car dealership website targeting US Military personnel stationed in Korea. The site features a modern, responsive design with smooth animations and intuitive navigation.

**Slogan:** *"Our vehicles and services are second to none!"*

---

## ✅ Completed Features

### Pages
| Page | File | Description |
|------|------|-------------|
| **Home** | `index.html` | Hero section with animated car illustration, services overview, footer |
| **Inventory** | `vehicles.html` | Vehicle listings (Sedan, SUV, Compact, Sports) with real photos |
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
│   └── business-card.js    # Three.js 3D card script
│
└── images/                 # Image assets (if any)
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
- **Google Maps**: Samantha ABCars location
- **Waze**: Navigation link

---

## 📍 Business Information

| Info | Details |
|------|---------|
| **Address** | 경기도 평택시 팽성읍 송화2길 186-1 |
| **Phone** | 010-7170-4513 |
| **Email** | samanthacars707@gmail.com |
| **Hours** | Mon-Sat: 9:30 AM - 6:00 PM |
| **Closed** | Sunday |

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

## 🖼 Vehicle Images Used

| Category | Vehicle | Image Source |
|----------|---------|--------------|
| Sedan | Renault Samsung SM5 | genspark.ai (ASCfibMm) |
| SUV | Chevrolet Captiva | genspark.ai (nwY5axIu) |
| Compact | Chevrolet Spark | genspark.ai (vWUW0SOL) |
| Sports | Genesis Coupe | genspark.ai (MFVTsQDR) |

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

© 2026 ABCars Samantha. All rights reserved.

---

*Last Updated: January 24, 2026*

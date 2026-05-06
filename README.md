# 🏍️ RiderTribe

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199903?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

**Smart Motorcycle Group Ride Navigation & Tracking Platform**

RiderTribe is a comprehensive ecosystem designed for motorcycle enthusiasts to coordinate, track, and share their group riding experiences. From planning complex multi-day tours to real-time safety monitoring of group members, RiderTribe solves the logistical challenges of riding together.

---

## 🌟 Key Features

### 📍 Intelligent Navigation & Tracking
*   **Live Group Tracking:** See all riders on a single interactive map with real-time position updates.
*   **Google Maps–Style Navigation:** In-app turn-by-turn routing using OpenRouteService API.
*   **Simulation Mode:** High-performance movement engine for demonstrating ride flows without real GPS.
*   **Rider Separation Alerts:** Automatic distance monitoring with real-time notifications when a rider falls >2km behind the leader.

### ⛽ Fuel & Logistics
*   **Nearby Fuel Finder:** One-tap search for gas stations along your current route or simulation path.
*   **Direct Route Navigation:** Seamlessly navigate from your current location to any selected fuel stop.

### 🤝 Community & Social
*   **Ride Discovery:** Find and join rides created by the community.
*   **Memories System:** Upload photos and logs to preserve the highlights of every journey.
*   **Persistent Profiles:** Detailed rider identities with riding styles, favorite bikes, and vehicle management.

---

## 🚀 Tech Stack

### Frontend
*   **React 18** + **Vite** for a blazing fast UI.
*   **React Leaflet** for high-performance map rendering.
*   **Bootstrap 5** for modern, responsive layouts.
*   **React Icons** for clean, consistent iconography.

### Backend
*   **Django 4.x** with **Django REST Framework (DRF)**.
*   **MySQL** for production-grade data persistence.
*   **JWT (SimpleJWT)** for secure, stateless authentication.

### APIs & Maps
*   **OpenStreetMap (OSM)** for base map layers.
*   **OpenRouteService (ORS)** for routing and distance matrices.
*   **Overpass API** for real-time infrastructure (Fuel Station) data.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)
*   MySQL Server

### Backend Setup
1. Clone the repository and navigate to `backend/`.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` file:
   ```env
   DB_NAME=ridertribe
   DB_USER=root
   DB_PASSWORD=your_password
   ORS_API_KEY=your_openrouteservice_key
   ```
5. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📱 Usage Guide

1.  **Dashboard:** Get a birds-eye view of your upcoming rides and recent memories.
2.  **Create Ride:** Define your route by selecting origin and destination.
3.  **Live Tracking:** Select a ride and click **"Start Tracking"**. Use the **Simulation Speed** controls to speed up the demo.
4.  **Fuel Finder:** While tracking, click on "Fuel Finder" to scan for stations near your bike's current location.
5.  **Profile:** Customize your rider style and manage your bikes in the Profile section.

---

## 🔮 Future Enhancements
*   **Voice Intercom Integration:** In-app audio communication for riders.
*   **AI Route Optimization:** Automatically suggest scenic routes based on riding style.
*   **SOS System:** One-tap emergency alert that sends coordinates to the group and emergency contacts.
*   **Weather Overlays:** Real-time weather radar integrated into the navigation map.

---

## 🚀 Deployment Guide

### Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `backend`.
4. Environment Variables to configure:
   - `SECRET_KEY`: A secure random string.
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: Your Render URL (e.g., `ridertribe-api.onrender.com`).
   - `DATABASE_URL`: Connection string for your production MySQL/Postgres.
   - `ORS_API_KEY`: Your OpenRouteService key.
5. The `render.yaml` and `Procfile` will handle the rest.

### Frontend (Netlify)
1. Create a new site on Netlify.
2. Connect your GitHub repository.
3. Set the Base Directory to `frontend`.
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., `https://ridertribe-api.onrender.com/api`).
   - `VITE_ORS_API_KEY`: Your OpenRouteService key.

---

## 👨‍💻 Developer
**Balakrishna Kini**  
*Full Stack Developer & Motorcycle Enthusiast*

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

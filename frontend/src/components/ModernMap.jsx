import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Icons
const createCustomIcon = (color, type) => {
  const isStart = type === 'start' || type === 'rider';
  const isFuel = type === 'fuel';
  
  let svg = '';
  if (isStart) {
    svg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.2"/>
        <circle cx="12" cy="12" r="5" fill="${color}"/>
        <circle cx="12" cy="12" r="7" stroke="${color}" stroke-width="2"/>
      </svg>`;
  } else if (isFuel) {
    svg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 22L21 22M4 7L4 22M20 7L20 22M18 5L6 5M6 5L4 7M18 5L20 7M9 12H15M9 16H15"/>
        <rect x="7" y="9" width="10" height="10" rx="1"/>
      </svg>`;
  } else {
    svg = `<svg width="32" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21L12 21.01M12 21C11 21 7 15 7 11C7 8.23858 9.23858 6 12 6C14.7614 6 17 8.23858 17 11C17 15 13 21 12 21Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="11" r="2" fill="${color}"/>
      </svg>`;
  }

  return L.divIcon({
    html: `<div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${svg}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: isFuel ? [28, 28] : isStart ? [32, 32] : [32, 40],
    iconAnchor: isFuel ? [14, 14] : isStart ? [16, 16] : [16, 40],
  });
};

const START_ICON = createCustomIcon('#22C55E', 'start');
const END_ICON = createCustomIcon('#EF4444', 'end');
const RIDER_ICON = (color) => createCustomIcon(color || '#FF6B00', 'start');

// Map Controller for fitBounds and animations
const MapController = ({ bounds, center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      if (bounds && Array.isArray(bounds) && bounds.length > 0) {
        // Filter out any invalid coordinates
        const validBounds = bounds.filter(b => b && Array.isArray(b) && typeof b[0] === 'number' && typeof b[1] === 'number');
        if (validBounds.length > 0) {
          map.invalidateSize(); // Fix for container size issues
          map.fitBounds(validBounds, { padding: [50, 50], animate: true, duration: 1.5 });
        }
      } else if (center && Array.isArray(center) && typeof center[0] === 'number' && typeof center[1] === 'number') {
        map.flyTo(center, zoom || 13, { animate: true, duration: 1.5 });
      }
    } catch (e) {
      console.warn("Map animation failed:", e);
    }
  }, [bounds, center, zoom, map]);

  return null;
};

const ModernMap = React.forwardRef(({ 
  center = [20.5937, 78.9629], 
  zoom = 13, 
  bounds, 
  markers = [], 
  polyline,
  height = "100%",
  interactive = true
}, ref) => {
  return (
    <div style={{ height, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#888', zIndex: 0, fontSize: '0.9rem' }}>
        <span className="spinner-border spinner-border-sm me-2" /> Loading map...
      </div>
      <MapContainer 
        ref={ref}
        center={center} 
        zoom={zoom} 
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {interactive && <ZoomControl position="bottomright" />}
        
        <MapController bounds={bounds} center={center} zoom={zoom} />

        {markers.map((m, i) => (
          <Marker 
            key={i} 
            position={m.position} 
            icon={m.type === 'start' ? START_ICON : m.type === 'end' ? END_ICON : RIDER_ICON(m.color)}
          />
        ))}

        {polyline && polyline.length > 0 && (
          <Polyline 
            positions={polyline} 
            color="#FF6B00" 
            weight={5} 
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapContainer>

      <style>{`
        .leaflet-container {
          background: #111 !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .leaflet-bar a {
          background-color: #222 !important;
          color: #fff !important;
          border-bottom: 1px solid #333 !important;
        }
        .leaflet-bar a:hover {
          background-color: #333 !important;
        }
      `}</style>
    </div>
  );
});

export default ModernMap;

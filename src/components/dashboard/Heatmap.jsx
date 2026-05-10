// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    const heatLayer = L.heatLayer(points, {
      radius: 35, blur: 20, maxZoom: 13,
      gradient: { 0.2: '#bef264', 0.5: '#facc15', 0.8: '#fb923c', 1.0: '#fca5a5' }
    }).addTo(map);
    return () => { if (map && heatLayer) map.removeLayer(heatLayer); };
  }, [map, points]);
  return null;
}

const Heatmap = () => {
  const [points, setPoints] = useState([]);
  const goaCenter = [15.3593, 74.0540];

  return (
    <div className="w-full h-full relative font-sans">
      
      {/* Neo-Brutalist Floating Badges Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
        <div className="bg-white px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
           <span className="w-3 h-3 bg-[#fca5a5] border-2 border-black animate-pulse"></span>
           <span className="text-xs font-black text-black tracking-widest uppercase">Major Issue</span>
        </div>
        <div className="bg-white px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
           <span className="w-3 h-3 bg-[#facc15] border-2 border-black"></span>
           <span className="text-xs font-black text-black tracking-widest uppercase">Moderate</span>
        </div>
        <div className="bg-white px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
           <span className="w-3 h-3 bg-[#bef264] border-2 border-black"></span>
           <span className="text-xs font-black text-black tracking-widest uppercase">Resolved Area</span>
        </div>
      </div>

      {/* Map Wrapper: absolute inset-0 forces it to completely fill the parent, killing the gray strip */}
      <div className="absolute inset-0 bg-gray-100 z-0">
        <MapContainer
          center={goaCenter}
          zoom={10.5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap'
          />
          {points.length > 0 && <HeatmapLayer points={points} />}
        </MapContainer>
      </div>

    </div>
  );
};

export default Heatmap;
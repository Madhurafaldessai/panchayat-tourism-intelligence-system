// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js';

// Fix Leaflet marker icons (Crucial for the markers to show up on the map)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🔥 Heatmap Layer Component (Remains structurally same, but logic now handles empty state)
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    // Correctly handles empty state, preventing crashes
    if (!map || !points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 35, 
      blur: 20,
      maxZoom: 13,
      gradient: {
        0.2: '#2ca469', // Emerald (Low)
        0.5: '#eab308', // Yellow (Medium)
        0.8: '#f97316', // Orange (High)
        1.0: '#ef4444'  // Red (Critical Density)
      }
    }).addTo(map);

    return () => {
      if (map && heatLayer) map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

const Heatmap = () => {
  // States are initialized to empty arrays, decoupling from any initial data source.
  const [points, setPoints] = useState([]);
  const [rawMarkers, setRawMarkers] = useState([]);

  // Centered on Goa for the Panchayat project
  const goaCenter = [15.3593, 74.0540];

  // The dummy data block ('mockReports') has been completely removed.
  // The useEffect hook that was processing the data has been removed.

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col h-full font-sans">
      
      {/* Title Area matching the Dashboard UI */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-lg font-black text-gray-900 tracking-widest uppercase flex items-center gap-2">
          REGIONAL ISSUES
        </h1>

        {/* Live Active Incidents Badge (Correctly displays 0 now) */}
        <div className="backdrop-blur-md text-[#05110b] px-4 py-2.5 rounded-xl text-[15px] font-black uppercase flex items-center gap-2 shadow-sm border border-white">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          {rawMarkers.length} Active Incidents
        </div>
      </div>

      {/* Glassmorphism Map Container */}
      <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/60 shadow-xl shadow-black/5 flex-1 relative flex flex-col min-h-[600px]">
        
        {/* The Map Frame with a clean background placeholder */}
        <div className="w-full h-full rounded-4xl overflow-hidden border border-white/80 shadow-inner relative z-0 bg-slate-50 flex items-center justify-center">
          
          {/* A slight visual placeholder so it doesn't look like a mistake */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
             <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
               <div className="text-gray-400 text-3xl p-4 bg-gray-50 rounded-2xl border border-gray-100">📡</div>
               <p className="text-[10px] font-black text-[#112a20] uppercase tracking-widest">Awaiting Live Connection...</p>
             </div>
          </div>

          <MapContainer
            center={goaCenter}
            zoom={10.5}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            scrollWheelZoom={true}
          >
            {/* Bright OpenStreetMap tiles */}
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; OpenStreetMap'
            />

            {/* Render the Heatmap Glow (Will not render anything now) */}
            {points.length > 0 && <HeatmapLayer points={points} />}

            {/* Individual Pins (Will not render anything now) */}
            {rawMarkers.map((marker) => (
              // Marker logic remains but handles empty state correctly.
              <Marker
                key={marker.id}
                position={[marker.latitude, marker.longitude]}
              >
                {/* Custom popup logic is preserved for when data returns */}
                <Popup className="custom-popup border-none rounded-xl overflow-hidden shadow-lg">
                  <div className="p-1 min-w-37.5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-emerald-50 text-[#2ca469] px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                        {marker.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{marker.title}</h4>
                    <p className="text-gray-500 font-bold text-[9px] uppercase tracking-wider mt-2">
                      📍 {marker.village}, {marker.taluka}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
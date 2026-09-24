import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat/dist/leaflet-heat.js';
import { supabase } from '../../supabaseClient';

const severityWeight = {
  critical: 1,
  urgent: 0.9,
  high: 0.8,
  medium: 0.6,
  moderate: 0.6,
  low: 0.4,
};

const toHeatPoint = (issue) => {
  const latitude = Number(issue.latitude);
  const longitude = Number(issue.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  const severity = String(issue.severity || issue.status || '').toLowerCase();
  return [latitude, longitude, severityWeight[severity] || 0.5];
};

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;

    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 20,
      maxZoom: 13,
      gradient: { 0.2: '#bef264', 0.5: '#facc15', 0.8: '#fb923c', 1: '#fca5a5' },
    }).addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [map, points]);

  return null;
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map]);

  return null;
}

const Heatmap = ({ villageId }) => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const goaCenter = [15.3593, 74.054];

  const loadPoints = useCallback(async () => {
    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from('issues')
      .select('latitude, longitude, severity, status')
      .eq('village_id', villageId)
      .limit(1000);

    if (queryError) {
      setError('Map data is unavailable.');
      setPoints([]);
      setIsLoading(false);
      return;
    }

    setPoints((data || []).map(toHeatPoint).filter(Boolean));
    setError(null);
    setIsLoading(false);
  }, [villageId]);

  useEffect(() => {
    void loadPoints();

    const channel = supabase
      .channel('admin-issues-heatmap')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues', filter: `village_id=eq.${villageId}` },
        loadPoints,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPoints, villageId]);

  return (
    <div className="relative h-full w-full font-sans">
      <div className="pointer-events-none absolute right-4 top-4 z-[1000] hidden flex-col gap-3 md:flex" aria-label="Heatmap legend">
        <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
          <span className="h-3 w-3 animate-pulse border-2 border-black bg-[#fca5a5]" />
          <span className="text-xs font-black uppercase tracking-widest text-black">Major issue</span>
        </div>
        <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
          <span className="h-3 w-3 border-2 border-black bg-[#facc15]" />
          <span className="text-xs font-black uppercase tracking-widest text-black">Moderate</span>
        </div>
        <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_0_#000]">
          <span className="h-3 w-3 border-2 border-black bg-[#bef264]" />
          <span className="text-xs font-black uppercase tracking-widest text-black">Low density</span>
        </div>
      </div>

      {(isLoading || error || !isLoading) && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] border-2 border-black bg-white px-3 py-2 text-xs font-bold shadow-[3px_3px_0_0_#000]" role="status">
          {isLoading ? 'Loading reports…' : error || `${points.length} mapped reports`}
        </div>
      )}

      <div className="absolute inset-0 z-0 bg-gray-100">
        <MapContainer center={goaCenter} zoom={10.5} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl={false}>
          <MapResize />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <HeatmapLayer points={points} />
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;

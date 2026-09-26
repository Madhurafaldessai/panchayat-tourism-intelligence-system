import { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
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

const severityColor = {
  high: '#ef4444',
  medium: '#facc15',
  moderate: '#facc15',
  low: '#bef264',
};

const clusterReports = (reports) => {
  const grouped = new Map();

  reports.forEach((report) => {
    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const bucketLat = Math.round(latitude / 0.005) * 0.005;
    const bucketLng = Math.round(longitude / 0.005) * 0.005;
    const key = `${bucketLat.toFixed(4)}:${bucketLng.toFixed(4)}`;

    if (!grouped.has(key)) {
      grouped.set(key, { latitude: bucketLat, longitude: bucketLng, count: 0, severity: 'low', category: report.category || 'General issue' });
    }

    const cluster = grouped.get(key);
    cluster.count += 1;

    const severity = String(report.severity || report.status || '').toLowerCase();
    const severityRank = { low: 1, medium: 2, high: 3, moderate: 2 };
    if ((severityRank[severity] || 0) > (severityRank[cluster.severity] || 0)) {
      cluster.severity = severity;
    }
    if (cluster.count > 1) {
      cluster.category = report.category || cluster.category;
    }
  });

  return Array.from(grouped.values()).map((cluster) => ({
    ...cluster,
    id: `${cluster.latitude}-${cluster.longitude}`,
    title: `${cluster.count} reports in this area`,
  }));
};

const getIssueKind = (issue) => {
  const category = String(issue.category || issue.title || '').toLowerCase();

  if (category.includes('water') || category.includes('drinking') || category.includes('sanitation')) {
    return '💧';
  }

  if (category.includes('waste') || category.includes('garbage') || category.includes('litter') || category.includes('trash')) {
    return '🗑️';
  }

  if (category.includes('noise') || category.includes('sound') || category.includes('music')) {
    return '🔊';
  }

  if (category.includes('traffic') || category.includes('congestion') || category.includes('parking') || category.includes('road')) {
    return '🚗';
  }

  if (category.includes('crowd') || category.includes('festival') || category.includes('event')) {
    return '👥';
  }

  return '⚠️';
};

const toHeatPoint = (issue) => {
  const latitude = Number(issue.latitude);
  const longitude = Number(issue.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  const severity = String(issue.severity || issue.status || '').toLowerCase();
  return {
    ...issue,
    latitude,
    longitude,
    intensity: severityWeight[severity] || 0.5,
  };
};

function HeatmapLayer({ reports }) {
  const map = useMap();
  const points = reports.map((report) => [report.latitude, report.longitude, report.intensity]);

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

function ReportMarkers({ reports }) {
  return clusterReports(reports).map((cluster) => {
    const severity = String(cluster.severity || 'medium').toLowerCase();
    const color = severityColor[severity] || '#facc15';
    const iconSize = Math.min(48, 24 + cluster.count * 6);
    const icon = L.divIcon({
      className: 'issue-map-marker',
      html: `
        <div style="
          width: ${iconSize}px;
          height: ${iconSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 3px solid #000;
          background: ${color};
          box-shadow: 3px 3px 0 rgba(0,0,0,1);
          font-size: ${cluster.count > 1 ? '12px' : '16px'};
          font-weight: 900;
          line-height: 1;
          color: #000;
          transform: translateY(-2px);
        ">${cluster.count > 1 ? cluster.count : getIssueKind(cluster)}</div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -10],
    });

    return (
      <Marker key={cluster.id} position={[cluster.latitude, cluster.longitude]} icon={icon}>
        <Popup>
          <strong>{cluster.title}</strong>
          <br />
          {cluster.category}
          <br />
          Severity: {severity}
        </Popup>
      </Marker>
    );
  });
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
  const [mappedReports, setMappedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const goaCenter = [15.3593, 74.054];

  const loadPoints = useCallback(async () => {
    if (!villageId) {
      setError('This administrator does not have a village assigned.');
      setMappedReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from('reports')
      .select('id, category, title, latitude, longitude, severity, status')
      .eq('village_id', villageId)
      .limit(1000);

    if (queryError) {
      setError('Map data is unavailable.');
      setMappedReports([]);
      setIsLoading(false);
      return;
    }

    setMappedReports((data || []).map(toHeatPoint).filter(Boolean));
    setError(null);
    setIsLoading(false);
  }, [villageId]);

  useEffect(() => {
    void loadPoints();

    if (!villageId) return undefined;

    const channel = supabase
      .channel('admin-issues-heatmap')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `village_id=eq.${villageId}` },
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
          {isLoading ? 'Loading reports…' : error || `${mappedReports.length} mapped reports`}
        </div>
      )}

      <div className="absolute inset-0 z-0 bg-gray-100">
        <MapContainer center={goaCenter} zoom={10.5} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl={false}>
          <MapResize />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <HeatmapLayer reports={mappedReports} />
          <ReportMarkers reports={mappedReports} />
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;

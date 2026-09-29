import React, { useState } from 'react';
import { CivicIssue, LocationData } from '../../types';
import { MapPin, Navigation, ExternalLink, Globe, Layers, Flame, Compass } from 'lucide-react';
import { GlobalCivicActivityHeatMap } from './GlobalCivicActivityHeatMap';
import { SUPPORTED_LANGUAGES } from '../../services/i18n';

interface GlobalMapProps {
  issues?: CivicIssue[];
  selectedIssue?: CivicIssue | null;
  onSelectIssue?: (issue: CivicIssue) => void;
  interactiveLocation?: LocationData;
  onLocationChange?: (location: LocationData) => void;
  mode?: 'view' | 'picker';
  activeLayer?: 'all' | 'critical' | 'underrepresented' | 'hotspots';
  heightClass?: string;
  zoomLevel?: 'city' | 'global';
  initialViewMode?: 'd3_global' | 'gps_local';
}

export const GlobalMap: React.FC<GlobalMapProps> = ({
  issues = [],
  selectedIssue = null,
  interactiveLocation,
  mode = 'view',
  heightClass = 'h-96',
  zoomLevel = 'global',
  initialViewMode = 'gps_local',
}) => {
  const [viewMode, setViewMode] = useState<'d3_global' | 'gps_local'>(
    mode === 'picker' || zoomLevel === 'city' ? 'gps_local' : initialViewMode
  );
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [zoom, setZoom] = useState<number>(16);

  // Target coordinates resolution with smart city alignment
  let lat = interactiveLocation?.lat ?? selectedIssue?.location?.lat ?? 11.0168;
  let lng = interactiveLocation?.lng ?? selectedIssue?.location?.lng ?? 76.9558;
  let address =
    interactiveLocation?.address ||
    selectedIssue?.location?.address ||
    '100 Feet Road, Ward 42, Gandhipuram, Coimbatore, Tamil Nadu';

  const combinedLocationText = `${address} ${selectedIssue?.location?.city || ''} ${interactiveLocation?.city || ''}`.toLowerCase();
  const isCoimbatore = combinedLocationText.includes('coimbatore') || combinedLocationText.includes('gandhipuram') || combinedLocationText.includes('kovai');
  const isChennai = !isCoimbatore && (combinedLocationText.includes('chennai') || combinedLocationText.includes('anna nagar'));

  if (isCoimbatore) {
    lat = 11.0168;
    lng = 76.9558;
    if (!address.includes('Coimbatore')) {
      address = '100 Feet Road, Ward 42, Gandhipuram, Coimbatore, Tamil Nadu';
    }
  } else if (isChennai) {
    lat = 13.0827;
    lng = 80.2707;
  }

  // Google Maps embed URL centered on resolved GPS coordinates
  const embedQuery = encodeURIComponent(`${lat},${lng}`);
  const mapTypeParam = mapType === 'satellite' ? 'k' : 'm';
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${embedQuery}&t=${mapTypeParam}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  const externalGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-3">
      {/* View Mode Switcher Header (hidden in picker mode) */}
      {mode !== 'picker' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 p-1 bg-black/70 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('gps_local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'gps_local'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Local Street & Satellite GPS Pin</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('d3_global')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'd3_global'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Global Activity View</span>
            </button>
          </div>

          {viewMode === 'gps_local' && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPS: {lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: REAL-TIME GLOBAL CIVIC ACTIVITY D3 HEAT MAP */}
      {viewMode === 'd3_global' ? (
        <GlobalCivicActivityHeatMap
          currentLanguage={SUPPORTED_LANGUAGES[0]}
          onSelectCountry={(code) => {
            console.log('Selected country for drill-down:', code);
          }}
        />
      ) : (
        /* VIEW 2: LOCAL GPS STREET & SATELLITE MAP */
        <div
          className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl flex flex-col`}
        >
          {/* Top Map HUD Bar */}
          <div className="absolute top-2 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 text-xs shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-red-400" />
                <span>Google Maps GPS Location</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-emerald-400 font-bold">
                {lat.toFixed(4)}°, {lng.toFixed(4)}°
              </span>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg text-xs">
              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mapType === 'roadmap'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🗺️ Street
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mapType === 'satellite'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🛰️ Satellite
              </button>

              <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

              {/* Zoom controls */}
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(19, z + 1))}
                className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(10, z - 1))}
                className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold"
                title="Zoom Out"
              >
                -
              </button>

              <a
                href={externalGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center"
                title="Open in Google Maps App"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </a>
            </div>
          </div>

          {/* Embedded Google Map iframe */}
          <div className="relative flex-1 w-full h-full bg-slate-950">
            <iframe
              title="Google Map Location"
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0 filter contrast-[1.05]"
              loading="lazy"
            />

            {/* Coimbatore Ward 42 Critical Red Hotspot Callout Overlay */}
            {isCoimbatore && (
              <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md pointer-events-auto bg-gradient-to-r from-red-950/95 via-black/90 to-red-950/95 border-2 border-red-500 rounded-xl p-2.5 shadow-[0_0_20px_rgba(239,68,68,0.6)] backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <span className="text-[11px] font-extrabold text-red-300 uppercase tracking-wide">
                    COIMBATORE WARD 42: HIGH DENSITY HOTSPOT (2 COMPLAINTS)
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-white">
                  <span className="font-semibold text-red-200">🚨 Critical Situation: Road Block & Waterlogging</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-600/40 border border-red-400/50 text-[10px] font-bold text-red-300">
                    2 Defect Marks Detected
                  </span>
                </div>
              </div>
            )}

            {/* Center Target Crosshair Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
              <div className="relative">
                {isCoimbatore && (
                  <span className="absolute -inset-4 rounded-full bg-red-600/30 animate-ping" />
                )}
                <MapPin className="w-8 h-8 text-red-500 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-bounce" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-black/60 rounded-full blur-[1px]" />
              </div>
              {isCoimbatore && (
                <div className="mt-1 px-2 py-0.5 rounded bg-red-600 border border-red-400 text-[10px] font-extrabold text-white shadow-lg whitespace-nowrap">
                  Coimbatore Ward 42 Hotspot
                </div>
              )}
            </div>
          </div>

          {/* Bottom Address Footer Bar */}
          <div className="p-2.5 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-xs px-4">
            <div className="flex items-center gap-2 truncate text-slate-300">
              <Navigation className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate font-medium">{address}</span>
            </div>
            <a
              href={externalGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Open Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

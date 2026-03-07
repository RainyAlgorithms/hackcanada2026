'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import listingData from '../data/listing.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
    property_id: string;
    list_price: number;
    address: {
        street_number: string;
        street: string;
        unit: string | null;
        city: string;
        state_code: string;
        postal_code: string;
        latitude: number;
        longitude: number;
    };
    description: {
        beds: number;
        baths: number;
        sqft_living: number;
        lot_size: number;
        year_built: number;
        property_type: string;
    };
    photo: string;
    status: string;
    listing_id: string;
    agent: { name: string; office: string };
    open_house: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_PROPS: Property[] = (listingData as any).data.properties;
const CITIES = ['All Cities', ...Array.from(new Set(ALL_PROPS.map(p => p.address.city))).sort()];
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(n: number): string {
    return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
}
function priceColor(n: number): string {
    if (n > 1_000_000) return '#a855f7';
    if (n > 500_000) return '#f59e0b';
    return '#22c55e';
}
function fmtType(t: string): string {
    return t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
function fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('en-CA', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}
function buildGeoJSON(props: Property[]) {
    return {
        type: 'FeatureCollection' as const,
        features: props.map(p => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.address.longitude, p.address.latitude] },
            properties: { id: p.property_id },
        })),
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PropertyMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, { marker: any; el: HTMLElement }>>(new Map());
    const filteredRef = useRef<Property[]>(ALL_PROPS);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapStyleRef = useRef<'dark' | 'light' | 'satellite'>('dark');

    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [hoveredProp, setHoveredProp] = useState<Property | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [minBeds, setMinBeds] = useState(0);
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [priceMin, setPriceMin] = useState(300_000);
    const [priceMax, setPriceMax] = useState(2_200_000);
    const [mapStyle, setMapStyle] = useState<'dark' | 'light' | 'satellite'>('dark');
    const [is3D, setIs3D] = useState(true);
    const [mapZoom, setMapZoom] = useState(13);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // ─── Derived filter ─────────────────────────────────────────────────────────
    const filtered = ALL_PROPS.filter(p => {
        if (p.list_price < priceMin || p.list_price > priceMax) return false;
        if (minBeds > 0 && p.description.beds < minBeds) return false;
        if (selectedCity !== 'All Cities' && p.address.city !== selectedCity) return false;
        return true;
    });
    filteredRef.current = filtered;

    // ─── Map setup helpers ───────────────────────────────────────────────────────
    function addMapLayers(map: any) {
        const geojsonData = buildGeoJSON(filteredRef.current);

        // GeoJSON source with clustering
        if (!map.getSource('listings')) {
            map.addSource('listings', {
                type: 'geojson',
                data: geojsonData,
                cluster: true,
                clusterMaxZoom: 11,
                clusterRadius: 50,
            });
        }

        // Cluster circles
        if (!map.getLayer('clusters')) {
            map.addLayer({
                id: 'clusters', type: 'circle', source: 'listings',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': ['step', ['get', 'point_count'], '#22c55e', 10, '#f59e0b', 20, '#a855f7'],
                    'circle-radius': ['step', ['get', 'point_count'], 24, 10, 34, 20, 44],
                    'circle-opacity': 0.88,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.18)',
                },
            });
        }

        // Cluster count labels
        if (!map.getLayer('cluster-count')) {
            map.addLayer({
                id: 'cluster-count', type: 'symbol', source: 'listings',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                },
                paint: { 'text-color': '#ffffff' },
            });
        }

        // 3D buildings
        const style = mapStyleRef.current;
        if (style !== 'satellite' && !map.getLayer('3d-buildings')) {
            const layers = map.getStyle().layers;
            let firstSymbolId = '';
            for (const layer of layers) {
                if (layer.type === 'symbol') { firstSymbolId = layer.id; break; }
            }
            map.addLayer({
                id: '3d-buildings', source: 'composite', 'source-layer': 'building',
                filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 12,
                paint: {
                    'fill-extrusion-color': [
                        'interpolate', ['linear'], ['get', 'height'],
                        0, '#1a1a2e', 50, '#16213e', 100, '#0f3460', 200, '#533483',
                    ],
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.85,
                },
            }, firstSymbolId);
        }

        // Sky layer
        if (!map.getLayer('sky')) {
            map.addLayer({
                id: 'sky', type: 'sky',
                paint: {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 90.0],
                    'sky-atmosphere-sun-intensity': 15,
                },
            });
        }

        // Terrain
        if (!map.getSource('mapbox-dem')) {
            try {
                map.addSource('mapbox-dem', {
                    type: 'raster-dem',
                    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                    tileSize: 512, maxzoom: 14,
                });
                map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
            } catch (_) { }
        }

        // Cluster click → expand
        map.on('click', 'clusters', (e: any) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            if (!features.length) return;
            const clusterId = features[0].properties.cluster_id;
            (map.getSource('listings') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                if (err) return;
                map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1, duration: 600 });
            });
        });
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    }

    // ─── Marker management ───────────────────────────────────────────────────────
    const createMarkerEl = useCallback((p: Property): HTMLElement => {
        const color = priceColor(p.list_price);
        const el = document.createElement('div');
        el.className = 'ps-marker';
        el.dataset.id = p.property_id;
        el.style.cssText = 'cursor:pointer;z-index:10;position:relative;';
        el.innerHTML = `
      <div class="ps-pill" style="
        background:rgba(10,11,24,0.92);
        border:1.5px solid ${color};
        border-radius:20px;
        padding:5px 12px 5px 9px;
        color:${color};
        font-size:12px;
        font-weight:700;
        font-family:'DM Sans',sans-serif;
        white-space:nowrap;
        backdrop-filter:blur(10px);
        box-shadow:0 2px 14px rgba(0,0,0,0.5);
        letter-spacing:-0.01em;
        display:flex;
        align-items:center;
        gap:6px;
        transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.18s ease;
        user-select:none;
      ">
        <span style="width:7px;height:7px;background:${color};border-radius:50%;display:inline-block;flex-shrink:0;box-shadow:0 0 6px ${color};"></span>
        ${fmtPrice(p.list_price)}
      </div>`;
        return el;
    }, []);

    const updateMarkers = useCallback((props: Property[], zoom?: number) => {
        const map = mapRef.current;
        if (!map) return;
        const z = zoom ?? map.getZoom();
        const showCustom = z >= 11;
        const bounds = map.getBounds();
        const activeIds = new Set(props.map(p => p.property_id));

        // Remove markers no longer in filter list
        markersRef.current.forEach((v, id) => {
            if (!activeIds.has(id) || !showCustom) {
                v.marker.remove();
                markersRef.current.delete(id);
            }
        });

        if (!showCustom) return; // Clusters handle it

        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) return;

        props.forEach(p => {
            const { longitude: lng, latitude: lat } = p.address;
            if (!bounds.contains([lng, lat])) return; // viewport culling
            if (markersRef.current.has(p.property_id)) return; // already exists

            const el = createMarkerEl(p);
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
                .setLngLat([lng, lat])
                .addTo(map);

            const pill = el.querySelector<HTMLElement>('.ps-pill')!;

            el.addEventListener('mouseenter', (e: MouseEvent) => {
                if (!el.dataset.selected) {
                    pill.style.transform = 'scale(1.2)';
                    pill.style.boxShadow = `0 4px 20px ${priceColor(p.list_price)}60`;
                }
                setHoveredProp(p);
                setTooltipPos({ x: e.clientX, y: e.clientY });
            });
            el.addEventListener('mousemove', (e: MouseEvent) => {
                setTooltipPos({ x: e.clientX, y: e.clientY });
            });
            el.addEventListener('mouseleave', () => {
                if (!el.dataset.selected) {
                    pill.style.transform = 'scale(1)';
                    pill.style.boxShadow = '0 2px 14px rgba(0,0,0,0.5)';
                }
                setHoveredProp(null);
            });
            el.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                activateMarker(p.property_id);
                setSelectedProp(p);
                setSidebarVisible(true);
                setHoveredProp(null);
                map.flyTo({
                    center: [lng, lat],
                    zoom: 16.5, pitch: 65,
                    bearing: Math.random() * 60 - 30,
                    duration: 1800, essential: true,
                });
            });

            markersRef.current.set(p.property_id, { marker, el });
        });
    }, [createMarkerEl]);

    function activateMarker(id: string) {
        markersRef.current.forEach(({ el }, mId) => {
            const pill = el.querySelector<HTMLElement>('.ps-pill')!;
            if (mId === id) {
                el.dataset.selected = 'true';
                pill.style.transform = 'scale(1.25)';
                pill.style.animation = 'psPulse 2s ease-in-out infinite';
                pill.style.zIndex = '999';
            } else {
                delete el.dataset.selected;
                pill.style.transform = 'scale(1)';
                pill.style.animation = '';
                pill.style.boxShadow = '0 2px 14px rgba(0,0,0,0.5)';
            }
        });
    }

    function deactivateAllMarkers() {
        markersRef.current.forEach(({ el }) => {
            const pill = el.querySelector<HTMLElement>('.ps-pill');
            if (pill) { delete (el as any).dataset.selected; pill.style.transform = 'scale(1)'; pill.style.animation = ''; }
        });
    }

    // ─── Map init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        if ((window as any).mapboxgl) { initMap(); return; }

        // Inject Mapbox CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
        document.head.appendChild(link);

        // Inject Mapbox JS
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
        script.onload = () => initMap();
        document.head.appendChild(script);

        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
            markersRef.current.forEach(v => v.marker.remove());
            markersRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initMap() {
        if (!mapContainerRef.current || mapRef.current) return;
        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = TOKEN;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLES.dark,
            center: [-79.3832, 43.6532],
            zoom: 13, pitch: 55, bearing: -20, antialias: true,
        });
        mapRef.current = map;

        // Native controls
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
        }), 'bottom-right');

        map.on('load', () => {
            addMapLayers(map);
            setMapLoaded(true);
            setTimeout(() => updateMarkers(filteredRef.current, map.getZoom()), 100);
        });

        map.on('zoom', () => {
            const z = map.getZoom();
            setMapZoom(z);
            updateMarkers(filteredRef.current, z);
        });

        map.on('moveend', () => {
            if (map.getZoom() >= 11) {
                updateMarkers(filteredRef.current, map.getZoom());
            }
        });

        map.on('click', () => {
            setSelectedProp(null);
            setSidebarVisible(false);
            deactivateAllMarkers();
        });
    }

    // ─── Update filters → source + markers ────────────────────────────────────────
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            const src = map.getSource('listings');
            if (src) src.setData(buildGeoJSON(filteredRef.current));
            // Purge markers not in new filter
            markersRef.current.forEach((v, id) => {
                if (!filteredRef.current.find(p => p.property_id === id)) {
                    v.marker.remove();
                    markersRef.current.delete(id);
                }
            });
            updateMarkers(filteredRef.current, map.getZoom());
        }, 300);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceMin, priceMax, minBeds, selectedCity, mapLoaded]);

    // ─── Map style change ─────────────────────────────────────────────────────────
    const changeStyle = useCallback((s: 'dark' | 'light' | 'satellite') => {
        const map = mapRef.current;
        if (!map) return;
        mapStyleRef.current = s;
        setMapStyle(s);
        markersRef.current.forEach(v => v.marker.remove());
        markersRef.current.clear();
        map.setStyle(MAP_STYLES[s]);
        map.once('style.load', () => {
            addMapLayers(map);
            setTimeout(() => updateMarkers(filteredRef.current, map.getZoom()), 200);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateMarkers]);

    // ─── Camera actions ───────────────────────────────────────────────────────────
    const toggle3D = useCallback(() => {
        setIs3D(prev => {
            const next = !prev;
            if (mapRef.current) mapRef.current.easeTo({ pitch: next ? 55 : 0, duration: 700 });
            return next;
        });
    }, []);

    const resetView = useCallback(() => {
        setSelectedProp(null);
        setSidebarVisible(false);
        deactivateAllMarkers();
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [-79.3832, 43.6532],
                zoom: 13, pitch: 55, bearing: -20, duration: 1400,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── CSS ─────────────────────────────────────────────────────────────────────
    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    :root {
      --bg: #0a0a0f;
      --glass: rgba(10,11,24,0.88);
      --indigo: #6366f1; --indigo-dim: rgba(99,102,241,0.2);
      --green: #22c55e; --amber: #f59e0b; --purple: #a855f7;
      --t1: #f1f5f9; --t2: #94a3b8; --border: rgba(99,102,241,0.18);
    }
    @keyframes psPulse {
      0%,100% { box-shadow: 0 0 0 0 currentColor; }
      50%      { box-shadow: 0 0 0 8px transparent; }
    }
    @keyframes slideRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
    @keyframes spin       { to { transform: rotate(360deg); } }
    .mapboxgl-ctrl-bottom-right { bottom: 80px !important; right: 14px !important; }
    .mapboxgl-ctrl-group {
      background: var(--glass) !important;
      border: 1px solid var(--border) !important;
      border-radius: 12px !important;
      backdrop-filter: blur(14px) !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
      overflow: hidden;
    }
    .mapboxgl-ctrl-group button {
      background: transparent !important;
      width: 38px !important; height: 38px !important;
    }
    .mapboxgl-ctrl-group button + button { border-color: var(--border) !important; }
    .mapboxgl-ctrl-group button:hover { background: var(--indigo-dim) !important; }
    .mapboxgl-ctrl-icon { filter: brightness(0) invert(0.7) !important; }
    .mapboxgl-ctrl-attrib { font-size: 9px !important; background: var(--glass) !important; color: var(--t2) !important; border-radius: 6px !important; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  `;

    // ─── Shared UI helpers ────────────────────────────────────────────────────────
    const glass: React.CSSProperties = {
        background: 'rgba(10,11,24,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 14,
    };

    const inputBase: React.CSSProperties = {
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10,
        color: '#f1f5f9',
        fontSize: 12,
        fontFamily: "'DM Sans', sans-serif",
        padding: '7px 11px',
        outline: 'none',
        cursor: 'pointer',
        fontWeight: 500,
    };

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif" }}>
            <style>{css}</style>

            {/* Map */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* ── Loading Overlay ── */}
            {!mapLoaded && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0a0a0f,#0d1030)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 20, zIndex: 100, animation: 'fadeIn 0.3s ease',
                }}>
                    <div style={{ position: 'relative', width: 64, height: 64 }}>
                        <div style={{
                            position: 'absolute', inset: 0, border: '2px solid transparent',
                            borderTop: '2px solid #6366f1', borderRadius: '50%',
                            animation: 'spin 0.9s linear infinite',
                        }} />
                        <div style={{
                            position: 'absolute', inset: 8, border: '2px solid transparent',
                            borderBottom: '2px solid #a855f7', borderRadius: '50%',
                            animation: 'spin 1.2s linear infinite reverse',
                        }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.02em' }}>
                            Property<span style={{ color: '#818cf8' }}>Seek</span>
                        </div>
                        <div style={{ color: '#475569', fontSize: 12, marginTop: 6 }}>Loading 3D map…</div>
                    </div>
                </div>
            )}

            {/* ── Top Toolbar ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
                ...glass, borderRadius: 0,
                borderBottom: '1px solid rgba(99,102,241,0.15)',
                padding: '0 20px',
                height: 64,
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{
                        width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 14px rgba(99,102,241,0.5)',
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: '#f1f5f9', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
                        Property<span style={{ color: '#818cf8' }}>Seek</span>
                    </span>
                </div>

                <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

                {/* Price Range */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Price</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} style={{ ...inputBase, width: 84 }}>
                            {[300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 1_000_000].map(v => (
                                <option key={v} value={v}>{fmtPrice(v)}</option>
                            ))}
                        </select>
                        <span style={{ color: '#475569', fontSize: 11 }}>–</span>
                        <select value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} style={{ ...inputBase, width: 90 }}>
                            {[700_000, 900_000, 1_200_000, 1_500_000, 1_800_000, 2_200_000, 3_000_000].map(v => (
                                <option key={v} value={v}>{fmtPrice(v)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Beds */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Beds</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[['Any', 0], ['2+', 2], ['3+', 3], ['4+', 4]].map(([label, value]) => (
                            <button key={value} onClick={() => setMinBeds(Number(value))} style={{
                                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'DM Sans',sans-serif", border: '1px solid',
                                background: minBeds === Number(value) ? 'rgba(99,102,241,0.25)' : 'transparent',
                                borderColor: minBeds === Number(value) ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: minBeds === Number(value) ? '#a5b4fc' : '#64748b',
                                transition: 'all 0.15s',
                            }}>{label}</button>
                        ))}
                    </div>
                </div>

                {/* City */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>City</div>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ ...inputBase, width: 130 }}>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

                {/* Map Style */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Style</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['dark', 'light', 'satellite'] as const).map(s => (
                            <button key={s} onClick={() => changeStyle(s)} style={{
                                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'DM Sans',sans-serif", border: '1px solid', textTransform: 'capitalize',
                                background: mapStyle === s ? 'rgba(99,102,241,0.25)' : 'transparent',
                                borderColor: mapStyle === s ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: mapStyle === s ? '#a5b4fc' : '#64748b',
                                transition: 'all 0.15s',
                            }}>{s}</button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1 }} />

                {/* Results count */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ color: '#6366f1', fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
                        {filtered.length}
                    </span>
                    <span style={{ color: '#475569', fontSize: 12, marginLeft: 5 }}>
                        / {ALL_PROPS.length} properties
                    </span>
                </div>

                {/* Price legend pills */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    {([['#22c55e', '<$500K'], ['#f59e0b', '$500K–$1M'], ['#a855f7', '>$1M']] as const).map(([color, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                            <span style={{ color: '#64748b', fontSize: 11 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Custom Map Controls ── */}
            {mapLoaded && (
                <div style={{
                    position: 'absolute', bottom: 24, left: 20, zIndex: 20,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <button onClick={resetView} style={{
                        ...glass, width: 44, height: 44, border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s',
                    }}
                        title="Reset view"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>

                    <button onClick={toggle3D} style={{
                        ...glass, width: 44, height: 44,
                        border: `1px solid ${is3D ? '#6366f1' : 'rgba(99,102,241,0.25)'}`,
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: is3D ? '#a5b4fc' : '#94a3b8',
                        fontSize: 10, fontWeight: 800, fontFamily: "'DM Sans',sans-serif",
                        letterSpacing: '0.04em', transition: 'all 0.2s',
                    }} title="Toggle 3D">
                        {is3D ? '3D' : '2D'}
                    </button>
                </div>
            )}

            {/* ── Property Detail Sidebar ── */}
            {sidebarVisible && selectedProp && (
                <div style={{
                    position: 'absolute', top: 64, right: 0, bottom: 0, width: 380, zIndex: 25,
                    ...glass, borderRadius: '16px 0 0 16px',
                    borderRight: 'none', overflowY: 'auto',
                    animation: 'slideRight 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                    {/* Property Image */}
                    <div style={{ position: 'relative', height: 220, overflow: 'hidden', flexShrink: 0 }}>
                        <img
                            src={selectedProp.photo}
                            alt={selectedProp.address.street}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'; }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,11,24,0.9) 0%, transparent 55%)' }} />

                        {/* Close */}
                        <button onClick={() => { setSelectedProp(null); setSidebarVisible(false); deactivateAllMarkers(); }} style={{
                            position: 'absolute', top: 12, right: 12, width: 32, height: 32,
                            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '50%', color: '#f1f5f9', fontSize: 18, lineHeight: 1,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(8px)',
                        }}>×</button>

                        {/* FOR SALE badge */}
                        <div style={{
                            position: 'absolute', top: 12, left: 12,
                            background: 'rgba(99,102,241,0.9)', borderRadius: 8,
                            padding: '4px 10px', fontSize: 10, fontWeight: 700,
                            color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase',
                            backdropFilter: 'blur(8px)',
                        }}>For Sale</div>

                        {/* Price */}
                        <div style={{
                            position: 'absolute', bottom: 12, left: 16,
                            fontSize: 28, fontWeight: 800, fontFamily: "'Syne',sans-serif",
                            color: priceColor(selectedProp.list_price),
                            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                            letterSpacing: '-0.03em',
                        }}>{fmtPrice(selectedProp.list_price)}</div>
                    </div>

                    {/* Details */}
                    <div style={{ padding: 20 }}>
                        {/* Address */}
                        <h2 style={{ color: '#f1f5f9', fontSize: 17, fontWeight: 700, fontFamily: "'Syne',sans-serif", margin: '0 0 4px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                            {selectedProp.address.street_number} {selectedProp.address.street}
                        </h2>
                        <p style={{ color: '#6366f1', fontSize: 13, margin: '0 0 18px', fontWeight: 500 }}>
                            {selectedProp.address.city}, {selectedProp.address.state_code} · {selectedProp.address.postal_code}
                        </p>

                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                            {[
                                { icon: '🛏', v: selectedProp.description.beds, l: 'Beds' },
                                { icon: '🚿', v: selectedProp.description.baths, l: 'Baths' },
                                { icon: '📐', v: selectedProp.description.sqft_living.toLocaleString(), l: 'Sq Ft' },
                            ].map(({ icon, v, l }) => (
                                <div key={l} style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                                    <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>{v}</div>
                                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                                </div>
                            ))}
                        </div>

                        {/* Info rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                            {[
                                ['Property Type', fmtType(selectedProp.description.property_type)],
                                ['Year Built', selectedProp.description.year_built],
                                ['Lot Size', `${selectedProp.description.lot_size.toLocaleString()} sq ft`],
                                ['Listing ID', selectedProp.listing_id],
                            ].map(([label, value]) => (
                                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Agent */}
                        <div style={{
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 12, padding: '12px 14px', marginBottom: 14,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0,
                                }}>
                                    {selectedProp.agent.name[0]}
                                </div>
                                <div>
                                    <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{selectedProp.agent.name}</div>
                                    <div style={{ color: '#64748b', fontSize: 11 }}>{selectedProp.agent.office}</div>
                                </div>
                            </div>
                        </div>

                        {/* Open House */}
                        {selectedProp.open_house && (
                            <div style={{
                                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: 12, padding: '10px 14px', marginBottom: 14,
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 18 }}>📅</span>
                                <div>
                                    <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Open House</div>
                                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 1 }}>{fmtDate(selectedProp.open_house)}</div>
                                </div>
                            </div>
                        )}

                        {/* CTAs */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button style={{
                                flex: 1, padding: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                                boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
                            }}>
                                View Listing →
                            </button>
                            <button style={{
                                flex: 1, padding: '12px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12, color: '#94a3b8', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                            }}>
                                🛣️ Street View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hover Tooltip ── */}
            {hoveredProp && !sidebarVisible && (() => {
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                const tx = tooltipPos.x + 180 > vw ? tooltipPos.x - 185 : tooltipPos.x + 12;
                const ty = tooltipPos.y + 140 > vh ? tooltipPos.y - 145 : tooltipPos.y + 12;
                return (
                    <div style={{
                        position: 'fixed', left: tx, top: ty, zIndex: 50, pointerEvents: 'none',
                        ...glass, borderRadius: 14, overflow: 'hidden', width: 170,
                        animation: 'fadeIn 0.15s ease', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    }}>
                        <img
                            src={hoveredProp.photo}
                            alt=""
                            style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'; }}
                        />
                        <div style={{ padding: '10px 12px' }}>
                            <div style={{ color: priceColor(hoveredProp.list_price), fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.02em' }}>
                                {fmtPrice(hoveredProp.list_price)}
                            </div>
                            <div style={{ color: '#f1f5f9', fontSize: 11, marginTop: 2, fontWeight: 500 }} className="truncate">
                                {hoveredProp.address.street_number} {hoveredProp.address.street}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                                🛏 {hoveredProp.description.beds} &nbsp;·&nbsp;🚿 {hoveredProp.description.baths} &nbsp;·&nbsp;📐 {hoveredProp.description.sqft_living.toLocaleString()}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Zoom level hint ── */}
            {mapLoaded && mapZoom < 11 && (
                <div style={{
                    position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    ...glass, padding: '8px 18px', borderRadius: 50, fontSize: 12, color: '#94a3b8',
                    animation: 'fadeIn 0.3s ease', pointerEvents: 'none',
                }}>
                    📍 Zoom in to see individual listings
                </div>
            )}
        </div>
    );
}

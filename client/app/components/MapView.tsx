'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import listingData from '../data/listing.json';

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
    agent: {
        name: string;
        office: string;
    };
    open_house: string | null;
}

const properties: Property[] = (listingData as any).data.properties;

function formatPrice(price: number): string {
    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
}

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [activeCity, setActiveCity] = useState<string>('All');
    const [filteredCount, setFilteredCount] = useState(properties.length);
    const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

    const cities = ['All', ...Array.from(new Set(properties.map(p => p.address.city))).sort()];

    const getPriceColor = (price: number): string => {
        if (price >= 1500000) return '#ff4757';
        if (price >= 1000000) return '#ff6b81';
        if (price >= 700000) return '#ffa502';
        if (price >= 500000) return '#2ed573';
        return '#1e90ff';
    };

    const addMarkersToMap = useCallback((map: any, filter: string) => {
        // Clear existing markers
        markersRef.current.forEach(m => m.marker.remove());
        markersRef.current = [];

        const filtered = filter === 'All'
            ? properties
            : properties.filter(p => p.address.city === filter);

        setFilteredCount(filtered.length);

        filtered.forEach((property) => {
            const color = getPriceColor(property.list_price);

            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'property-marker';
            el.style.cssText = `
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
        z-index: 10;
      `;

            el.innerHTML = `
        <div class="marker-pin" style="
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          width: 36px;
          height: 36px;
          box-shadow: 0 4px 15px ${color}80;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        ">
          <svg style="transform: rotate(45deg); opacity:0.95;" width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div class="marker-label" style="
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10,10,20,0.92);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 8px;
          white-space: nowrap;
          border: 1px solid ${color}60;
          letter-spacing: 0.3px;
          backdrop-filter: blur(8px);
        ">${formatPrice(property.list_price)}</div>
      `;

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.25) translateY(-4px)';
                el.style.zIndex = '100';
                setHoveredMarker(property.property_id);
            });

            el.addEventListener('mouseleave', () => {
                if (selectedProperty?.property_id !== property.property_id) {
                    el.style.transform = 'scale(1)';
                    el.style.zIndex = '10';
                }
                setHoveredMarker(null);
            });

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelectedProperty(property);

                // Fly to property with 3D tilt
                map.flyTo({
                    center: [property.address.longitude, property.address.latitude],
                    zoom: 15,
                    pitch: 55,
                    bearing: -20,
                    duration: 1800,
                    easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                });

                // Reset all markers
                markersRef.current.forEach(m => {
                    m.el.style.transform = 'scale(1)';
                    m.el.style.zIndex = '10';
                });
                el.style.transform = 'scale(1.3) translateY(-6px)';
                el.style.zIndex = '200';
            });

            const { maplibregl } = (window as any);
            if (!maplibregl) return;

            const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([property.address.longitude, property.address.latitude])
                .addTo(map);

            markersRef.current.push({ marker, el, property });
        });
    }, [selectedProperty]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Dynamically load maplibre-gl
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
        script.onload = () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
            document.head.appendChild(link);

            const { maplibregl } = window as any;

            const map = new maplibregl.Map({
                container: mapContainerRef.current!,
                style: {
                    version: 8,
                    sources: {
                        'carto-dark': {
                            type: 'raster',
                            tiles: [
                                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                            ],
                            tileSize: 256,
                            attribution: '© CARTO © OpenStreetMap',
                            maxzoom: 20,
                        },
                    },
                    layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
                },
                center: [-95.5, 56.0],
                zoom: 3.8,
                pitch: 35,
                bearing: 0,
                antialias: true,
            });

            mapRef.current = map;

            map.addControl(
                new maplibregl.NavigationControl({ visualizePitch: true }),
                'bottom-right'
            );

            map.on('load', () => {
                setMapLoaded(true);

                // Add 3D buildings layer if zoomed in
                map.on('zoom', () => {
                    const z = map.getZoom();
                    if (z > 13 && !map.getLayer('3d-buildings')) {
                        // Subtle atmosphere effect via fog
                        if (map.setFog) {
                            map.setFog({
                                color: 'rgb(10, 12, 28)',
                                'high-color': 'rgb(20, 30, 60)',
                                'horizon-blend': 0.02,
                            });
                        }
                    }
                });

                // Close popup on map click
                map.on('click', () => setSelectedProperty(null));

                addMarkersToMap(map, 'All');
            });
        };
        document.head.appendChild(script);

        return () => {
            markersRef.current.forEach(m => m.marker.remove());
            markersRef.current = [];
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Re-render markers when city filter changes
    useEffect(() => {
        if (mapRef.current && mapLoaded) {
            addMarkersToMap(mapRef.current, activeCity);
            setSelectedProperty(null);

            if (activeCity !== 'All') {
                const cityProps = properties.filter(p => p.address.city === activeCity);
                if (cityProps.length > 0) {
                    const lats = cityProps.map(p => p.address.latitude);
                    const lngs = cityProps.map(p => p.address.longitude);
                    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                    mapRef.current.flyTo({
                        center: [centerLng, centerLat],
                        zoom: 11,
                        pitch: 40,
                        duration: 1500,
                    });
                }
            } else {
                mapRef.current.flyTo({
                    center: [-95.5, 56.0],
                    zoom: 3.8,
                    pitch: 35,
                    duration: 1500,
                });
            }
        }
    }, [activeCity, mapLoaded]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Map Container */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading Overlay */}
            {!mapLoaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #0a0c1c 0%, #0d1530 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '16px', zIndex: 50,
                }}>
                    <div style={{
                        width: 64, height: 64,
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTop: '3px solid #6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontSize: 14, letterSpacing: '0.05em' }}>
                        Loading map...
                    </p>
                </div>
            )}

            {/* Legend */}
            <div style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(5,8,22,0.88)',
                backdropFilter: 'blur(20px)',
                borderRadius: 14, padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
                zIndex: 20,
            }}>
                <p style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Price Range</p>
                {[
                    { label: '$1.5M+', color: '#ff4757' },
                    { label: '$1M–$1.5M', color: '#ff6b81' },
                    { label: '$700K–$1M', color: '#ffa502' },
                    { label: '$500K–$700K', color: '#2ed573' },
                    { label: 'Under $500K', color: '#1e90ff' },
                ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                        <span style={{ color: '#cbd5e1', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Stats bar */}
            <div style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(5,8,22,0.88)',
                backdropFilter: 'blur(20px)',
                borderRadius: 50, padding: '8px 20px',
                border: '1px solid rgba(255,255,255,0.08)',
                zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 16,
                whiteSpace: 'nowrap',
            }}>
                <span style={{ color: '#6366f1', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                    {filteredCount}
                </span>
                <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                    properties {activeCity !== 'All' ? `in ${activeCity}` : 'across Canada'}
                </span>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                    🏠 All for sale
                </span>
            </div>

            {/* City Filter */}
            <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto',
                maxWidth: 'calc(100vw - 120px)',
                zIndex: 20,
                padding: '4px 2px 8px',
            }}>
                {cities.map(city => (
                    <button
                        key={city}
                        onClick={() => setActiveCity(city)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 50,
                            border: activeCity === city
                                ? '1px solid #6366f1'
                                : '1px solid rgba(255,255,255,0.1)',
                            background: activeCity === city
                                ? 'rgba(99,102,241,0.25)'
                                : 'rgba(5,8,22,0.80)',
                            color: activeCity === city ? '#a5b4fc' : '#94a3b8',
                            fontSize: 12,
                            fontWeight: activeCity === city ? 700 : 400,
                            cursor: 'pointer',
                            backdropFilter: 'blur(12px)',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            boxShadow: activeCity === city ? '0 0 14px rgba(99,102,241,0.3)' : 'none',
                        }}
                    >
                        {city}
                    </button>
                ))}
            </div>

            {/* Property Detail Card */}
            {selectedProperty && (
                <div style={{
                    position: 'absolute', top: '50%', left: 16,
                    transform: 'translateY(-50%)',
                    width: 300,
                    background: 'rgba(5,8,22,0.95)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: 20,
                    border: '1px solid rgba(99,102,241,0.25)',
                    overflow: 'hidden',
                    zIndex: 30,
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                    {/* Photo */}
                    <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                        <img
                            src={selectedProperty.photo}
                            alt={selectedProperty.address.street}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'; }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(5,8,22,0.8) 0%, transparent 60%)',
                        }} />
                        <div style={{
                            position: 'absolute', top: 10, right: 10,
                            background: 'rgba(99,102,241,0.9)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '0.03em',
                        }}>
                            FOR SALE
                        </div>
                        <button
                            onClick={() => setSelectedProperty(null)}
                            style={{
                                position: 'absolute', top: 10, left: 10,
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none', borderRadius: '50%',
                                width: 28, height: 28, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 18, lineHeight: 1,
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            ×
                        </button>
                        <div style={{
                            position: 'absolute', bottom: 10, left: 12,
                            color: 'white',
                            fontSize: 22,
                            fontWeight: 800,
                            fontFamily: 'Inter, sans-serif',
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        }}>
                            {formatPrice(selectedProperty.list_price)}
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ padding: '16px' }}>
                        <h3 style={{
                            color: '#f1f5f9', fontSize: 15, fontWeight: 700,
                            fontFamily: 'Inter, sans-serif', margin: '0 0 4px',
                            lineHeight: 1.3,
                        }}>
                            {selectedProperty.address.street_number} {selectedProperty.address.street}
                        </h3>
                        <p style={{ color: '#6366f1', fontSize: 12, fontFamily: 'Inter, sans-serif', margin: '0 0 14px', fontWeight: 500 }}>
                            {selectedProperty.address.city}, {selectedProperty.address.state_code} {selectedProperty.address.postal_code}
                        </p>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                            {[
                                { icon: '🛏', label: 'Beds', value: selectedProperty.description.beds },
                                { icon: '🚿', label: 'Baths', value: selectedProperty.description.baths },
                                { icon: '📐', label: 'SqFt', value: selectedProperty.description.sqft_living.toLocaleString() },
                            ].map(({ icon, label, value }) => (
                                <div key={label} style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: 10,
                                    padding: '8px 6px',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                                    <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{value}</div>
                                    <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Additional info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Year Built</span>
                                <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{selectedProperty.description.year_built}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Listing ID</span>
                                <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{selectedProperty.listing_id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Agent</span>
                                <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600, textAlign: 'right', maxWidth: 160 }}>{selectedProperty.agent.name}</span>
                            </div>
                            {selectedProperty.open_house && (
                                <div style={{
                                    marginTop: 4,
                                    background: 'rgba(46,213,115,0.1)',
                                    border: '1px solid rgba(46,213,115,0.25)',
                                    borderRadius: 8,
                                    padding: '6px 10px',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <span style={{ fontSize: 12 }}>📅</span>
                                    <div>
                                        <div style={{ color: '#2ed573', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open House</div>
                                        <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                                            {new Date(selectedProperty.open_house).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button style={{
                            width: '100%',
                            padding: '11px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: 12,
                            color: 'white',
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            letterSpacing: '0.03em',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            transition: 'all 0.2s',
                        }}>
                            View Full Listing →
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(calc(-50% + 20px)); }
          to { opacity: 1; transform: translateY(-50%); }
        }
        .maplibregl-ctrl-bottom-right { bottom: 80px !important; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 2px; }
      `}</style>
        </div>
    );
}

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { IMAGE_BASE_URL } from '../services';
import { useTheme } from '../context/ThemeContext';

// Custom coral marker icon SVG
const coralMarkerSvg = `
<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.154.55 4.18 1.516 5.95L12.5 41l10.984-22.55A12.42 12.42 0 0025 12.5C25 5.596 19.404 0 12.5 0z" fill="#FF7F50"/>
  <circle cx="12.5" cy="12.5" r="5" fill="white"/>
</svg>
`;

// Dimmed marker for non-matching locations
const dimmedMarkerSvg = `
<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.154.55 4.18 1.516 5.95L12.5 41l10.984-22.55A12.42 12.42 0 0025 12.5C25 5.596 19.404 0 12.5 0z" fill="#AAAAAA" opacity="0.6"/>
  <circle cx="12.5" cy="12.5" r="5" fill="white" opacity="0.6"/>
</svg>
`;

// Create marker icon with optional badge
const createMarkerIcon = (isMatch, matchCount = 0) => {
    const svg = isMatch ? coralMarkerSvg : dimmedMarkerSvg;
    const badgeHtml = isMatch && matchCount > 0 
        ? `<span class="marker-badge">${matchCount}</span>` 
        : '';
    
    return L.divIcon({
        html: `<div class="marker-with-badge">${svg}${badgeHtml}</div>`,
        className: isMatch ? 'coral-marker' : 'coral-marker dimmed-marker',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
};

// Default coral icon (for when no filter is active)
const coralIcon = L.divIcon({
    html: coralMarkerSvg,
    className: 'coral-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Custom cluster icon with coral color
const createClusterCustomIcon = (cluster) => {
    const count = cluster.getChildCount();
    let size = 'small';
    let dimension = 36;
    
    if (count >= 10) {
        size = 'large';
        dimension = 48;
    } else if (count >= 5) {
        size = 'medium';
        dimension = 42;
    }
    
    return L.divIcon({
        html: `<div class="coral-cluster coral-cluster-${size}"><span>${count}</span></div>`,
        className: 'coral-cluster-wrapper',
        iconSize: L.point(dimension, dimension, true),
    });
};

// Component to fit map bounds to all markers
function FitBounds({ positions }) {
    const map = useMap();
    
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [map, positions]);
    
    return null;
}

/**
 * OverviewMap component - Shows an interactive map with multiple markers
 * Uses Nominatim API for geocoding addresses to coordinates
 * 
 * @param {Object} props
 * @param {Array} props.locations - Array of {id, name, address, type: 'business'|'project', count?, businessName?, isFilterMatch?, matchCount?}
 * @param {boolean} [props.showOnlyMatches=false] - If true, only show matching locations
 * @param {string} [props.height="300px"] - Height of the map container
 * @param {string} [props.className] - Additional CSS classes
 */
export default function OverviewMap({ locations = [], showOnlyMatches = false, height = "300px", className = "" }) {
    const { isDark } = useTheme();
    const [geocodedLocations, setGeocodedLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Default center (Netherlands)
    const defaultCenter = [52.1326, 5.2913];
    
    // Map tile URLs - light and dark variants
    const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    const tileAttribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    // Geocode all locations
    useEffect(() => {
        if (!locations || locations.length === 0) {
            setLoading(false);
            return;
        }

        const geocodeLocations = async () => {
            setLoading(true);
            setError(null);

            const results = [];
            
            // Process locations in batches to avoid rate limiting
            for (const loc of locations) {
                if (!loc.address) continue;
                
                try {
                    // Check cache first (simple in-memory cache)
                    const cacheKey = `geocode_${loc.address}`;
                    const cached = sessionStorage.getItem(cacheKey);
                    
                    if (cached) {
                        const coords = JSON.parse(cached);
                        results.push({ ...loc, lat: coords.lat, lng: coords.lng });
                        continue;
                    }

                    const encodedAddress = encodeURIComponent(loc.address);
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
                        {
                            headers: {
                                'User-Agent': 'Projojo-App/1.0'
                            }
                        }
                    );

                    const data = await response.json();

                    if (data && data.length > 0) {
                        const coords = {
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        };
                        
                        // Cache the result
                        sessionStorage.setItem(cacheKey, JSON.stringify(coords));
                        
                        results.push({ ...loc, ...coords });
                    }

                    // Small delay to respect Nominatim rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (err) {
                    console.error('Geocoding error for', loc.address, err);
                }
            }

            setGeocodedLocations(results);
            setLoading(false);
        };

        geocodeLocations();
    }, [locations]);

    // Memoize positions for FitBounds
    const positions = useMemo(() => 
        geocodedLocations.filter(loc => loc.lat && loc.lng),
        [geocodedLocations]
    );

    // Filter positions based on showOnlyMatches
    const visiblePositions = useMemo(() => {
        if (!showOnlyMatches) return positions;
        return positions.filter(loc => loc.isFilterMatch !== false);
    }, [positions, showOnlyMatches]);

    // Check if any location has filter info (to decide if we should show badges)
    const hasFilterInfo = useMemo(() => 
        positions.some(loc => loc.isFilterMatch !== undefined),
        [positions]
    );

    if (!locations || locations.length === 0) {
        return (
            <div className={`neu-pressed rounded-xl flex items-center justify-center ${className}`} style={{ height }}>
                <div className="text-center">
                    <span className="material-symbols-outlined text-3xl text-[var(--text-muted)] mb-2">location_off</span>
                    <p className="text-sm text-[var(--text-muted)]">Geen locaties beschikbaar</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`neu-pressed rounded-xl overflow-hidden relative z-0 ${className}`} style={{ height }}>
            {loading ? (
                <div className="flex items-center justify-center h-full bg-neu-bg">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        <span className="text-sm font-medium">Locaties laden...</span>
                    </div>
                </div>
            ) : positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full bg-neu-bg gap-2">
                    <span className="material-symbols-outlined text-[var(--text-muted)] text-2xl">location_off</span>
                    <span className="text-sm text-[var(--text-muted)]">Geen locaties gevonden</span>
                </div>
            ) : (
                <MapContainer
                    center={defaultCenter}
                    zoom={8}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
                >
                    <TileLayer
                        attribution={tileAttribution}
                        url={tileUrl}
                        key={isDark ? 'dark' : 'light'}
                    />
                    
                    <FitBounds positions={positions} />
                    
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        maxClusterRadius={50}
                        spiderLegPolylineOptions={{ weight: 2, color: '#FF7F50', opacity: 0.5 }}
                    >
                        {visiblePositions.map((loc) => {
                            // Determine the icon to use
                            const isMatch = loc.isFilterMatch !== false;
                            const icon = hasFilterInfo 
                                ? createMarkerIcon(isMatch, isMatch ? loc.matchCount : 0)
                                : coralIcon;
                            
                            return (
                            <Marker 
                                key={`${loc.type}-${loc.id}`} 
                                position={[loc.lat, loc.lng]}
                                icon={icon}
                            >
                                <Popup>
                                    <div className="font-sans min-w-[200px]">
                                        <div className="flex items-start gap-3">
                                            {/* Business logo */}
                                            {loc.image && (
                                                <img 
                                                    src={`${IMAGE_BASE_URL}${loc.image}`}
                                                    alt=""
                                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <strong className="block text-gray-900 text-sm leading-tight">
                                                    {loc.name}
                                                </strong>
                                                {loc.businessName && (
                                                    <span className="text-gray-500 text-xs block">
                                                        {loc.businessName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            {loc.address}
                                        </span>
                                        <div className="flex items-center gap-3 mt-2">
                                            {loc.count !== undefined && loc.count > 0 && (
                                                <span className="text-xs font-bold" style={{ color: '#156064' }}>
                                                    {loc.count} {loc.count === 1 ? 'project' : 'projecten'}
                                                </span>
                                            )}
                                            {loc.matchCount > 0 && (
                                                <span className="text-xs font-bold flex items-center gap-0.5" style={{ color: '#00C49A' }}>
                                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    {loc.matchCount} {loc.matchCount === 1 ? 'match' : 'matches'}
                                                </span>
                                            )}
                                        </div>
                                        <Link 
                                            to={loc.type === 'project' ? `/projects/${loc.id}` : `/business/${loc.id}`}
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                            style={{ color: '#FF7F50' }}
                                        >
                                            Bekijk {loc.type === 'project' ? 'project' : 'bedrijf'}
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                            );
                        })}
                    </MarkerClusterGroup>
                </MapContainer>
            )}
            
            {/* Legend */}
            {!loading && visiblePositions.length > 0 && (
                <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-[#2D221C]/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]">
                    {visiblePositions.length} {visiblePositions.length === 1 ? 'locatie' : 'locaties'}
                </div>
            )}
        </div>
    );
}

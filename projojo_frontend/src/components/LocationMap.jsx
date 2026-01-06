import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * LocationMap component - Shows an interactive OpenStreetMap with a marker
 * Uses Nominatim API for geocoding addresses to coordinates
 * 
 * @param {Object} props
 * @param {string} props.address - Address to display and geocode
 * @param {string} [props.name] - Name to show in the popup (e.g., business/project name)
 * @param {{lat: number, lng: number}} [props.coordinates] - Optional pre-defined coordinates
 * @param {string} [props.height="200px"] - Height of the map container
 * @param {string} [props.className] - Additional CSS classes
 */
export default function LocationMap({ address, name, coordinates, height = "200px", className = "" }) {
    const [position, setPosition] = useState(coordinates || null);
    const [loading, setLoading] = useState(!coordinates);
    const [error, setError] = useState(null);

    // Default center (Netherlands) if no address/coordinates
    const defaultCenter = [52.1326, 5.2913];
    // Zoom level 8 shows a good portion of the Netherlands region
    const defaultZoom = 8;

    useEffect(() => {
        // If coordinates are provided, use them directly
        if (coordinates) {
            setPosition(coordinates);
            setLoading(false);
            return;
        }

        // If no address, don't try to geocode
        if (!address) {
            setLoading(false);
            return;
        }

        // Geocode the address using Nominatim (OpenStreetMap's free geocoding service)
        const geocodeAddress = async () => {
            setLoading(true);
            setError(null);

            try {
                const encodedAddress = encodeURIComponent(address);
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
                    setPosition({
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon)
                    });
                } else {
                    setError('Locatie niet gevonden');
                }
            } catch (err) {
                console.error('Geocoding error:', err);
                setError('Kon locatie niet laden');
            } finally {
                setLoading(false);
            }
        };

        geocodeAddress();
    }, [address, coordinates]);

    // Don't render if no address and no coordinates
    if (!address && !coordinates) {
        return null;
    }

    return (
        <div className={`neu-flat overflow-hidden relative z-0 ${className}`} style={{ height }}>
            {loading ? (
                <div className="flex items-center justify-center h-full bg-neu-bg">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        <span className="text-sm font-medium">Kaart laden...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full bg-neu-bg gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-2xl">location_off</span>
                    <span className="text-sm text-[var(--text-muted)]">{error}</span>
                    {address && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <span>Open in Google Maps</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                    )}
                </div>
            ) : position ? (
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={defaultZoom}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[position.lat, position.lng]}>
                        <Popup>
                            <div className="font-sans">
                                {name && <strong className="block text-[var(--text-primary)]">{name}</strong>}
                                <span className="text-[var(--text-secondary)] text-sm">{address}</span>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full bg-neu-bg gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-2xl">map</span>
                    <span className="text-sm text-[var(--text-muted)]">Geen locatie beschikbaar</span>
                </div>
            )}
            
            {/* Quick link to external maps */}
            {position && address && (
                <div className="absolute bottom-2 right-2 z-[1000]">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn !py-1.5 !px-2.5 text-xs !rounded-lg opacity-90 hover:opacity-100"
                        title="Open in Google Maps"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                </div>
            )}
        </div>
    );
}

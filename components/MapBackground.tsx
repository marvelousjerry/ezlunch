'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to update map center
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (map) map.setView(center, 16);
    }, [center, map]);
    return null;
}

export default function MapBackground() {
    const [position, setPosition] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => {
                    console.error("Location access denied", err);
                    // Default: Seoul City Hall
                    setPosition([37.5665, 126.9780]);
                }
            );
        } else {
            setPosition([37.5665, 126.9780]);
        }
    }, []);

    if (!position) return <div className="fixed inset-0 bg-gray-100 z-[-1]" />;

    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-60 grayscale-[30%]">
            <MapContainer
                center={position}
                zoom={16}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                className="w-full h-full"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                />
                <ChangeView center={position} />
            </MapContainer>

            {/* Overlay Gradient for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-white/80 backdrop-blur-[2px]"></div>
        </div>
    );
}

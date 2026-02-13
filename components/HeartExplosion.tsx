'use client';

import { useEffect, useState } from 'react';

export default function HeartExplosion({ active, x, y }: { active: boolean; x: number; y: number }) {
    if (!active) return null;

    return (
        <div
            className="fixed pointer-events-none z-[9999] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
        >
            <div className="relative">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-red-500 rounded-full animate-explosion-particle"
                        style={{
                            transform: `rotate(${i * 30}deg) translateY(0px)`,
                            '--angle': `${i * 30}deg`
                        } as any}
                    ></div>
                ))}
                <div className="text-4xl animate-heart-pump">❤️</div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';

const Confetti = ({ active }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (active) {
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                top: -10,
                size: Math.random() * 8 + 4,
                color: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
                delay: Math.random() * 2,
                duration: Math.random() * 2 + 2,
                rotation: Math.random() * 360
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [active]);

    if (!active || particles.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="confetti-particle"
                    style={{
                        position: 'absolute',
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transform: `rotate(${p.rotation}deg)`,
                        animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`
                    }}
                />
            ))}
            <style>
                {`
                @keyframes confetti-fall {
                    0% {
                        top: -10%;
                        transform: translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    25% {
                        transform: translateX(15px) rotate(90deg);
                    }
                    50% {
                        transform: translateX(-15px) rotate(180deg);
                    }
                    75% {
                        transform: translateX(15px) rotate(270deg);
                    }
                    100% {
                        top: 110%;
                        transform: translateX(-15px) rotate(360deg);
                        opacity: 0;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default Confetti;

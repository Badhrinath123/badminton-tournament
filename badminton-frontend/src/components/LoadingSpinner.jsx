import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'var(--primary)' }) => {
    const sizes = {
        sm: '20px',
        md: '40px',
        lg: '60px'
    };

    return (
        <div className="spinner" style={{
            width: sizes[size],
            height: sizes[size],
            border: `3px solid #e2e8f0`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
    );
};

export const SkeletonCard = () => {
    return (
        <div className="glass-card skeleton-pulse" style={{
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="card-red-cap" />
            <div style={{ padding: '2.25rem' }}>
                {/* Title skeleton */}
                <div style={{
                    height: '24px',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    width: '70%'
                }} />

                {/* Badges skeleton */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        height: '24px',
                        width: '80px',
                        background: '#e2e8f0',
                        borderRadius: '8px'
                    }} />
                    <div style={{
                        height: '24px',
                        width: '100px',
                        background: '#e2e8f0',
                        borderRadius: '8px'
                    }} />
                </div>

                {/* Footer skeleton */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #f1f5f9'
                }}>
                    <div style={{
                        height: '20px',
                        width: '100px',
                        background: '#e2e8f0',
                        borderRadius: '6px'
                    }} />
                    <div style={{
                        height: '20px',
                        width: '80px',
                        background: '#e2e8f0',
                        borderRadius: '6px'
                    }} />
                </div>
            </div>
        </div>
    );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            gap: '1.5rem'
        }}>
            <LoadingSpinner size="lg" />
            <p style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--text-dark)'
            }}>
                {message}
            </p>
        </div>
    );
};

export default LoadingSpinner;

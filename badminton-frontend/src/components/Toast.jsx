import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '400px'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ message, type, duration, onClose }) => {
    const [progress, setProgress] = React.useState(100);

    React.useEffect(() => {
        if (duration <= 0) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev - (100 / (duration / 50));
                return newProgress < 0 ? 0 : newProgress;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [duration]);

    const colors = {
        success: { bg: '#10b981', border: '#059669', icon: '✓' },
        error: { bg: '#ef4444', border: '#dc2626', icon: '✕' },
        warning: { bg: '#f59e0b', border: '#d97706', icon: '⚠' },
        info: { bg: '#3b82f6', border: '#2563eb', icon: 'ℹ' }
    };

    const color = colors[type] || colors.info;

    return (
        <div className="toast-slide-in" style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            minWidth: '300px',
            border: `2px solid ${color.border}`,
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: color.bg,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    flexShrink: 0
                }}>
                    {color.icon}
                </div>
                <div style={{ flex: 1, fontWeight: '500', color: '#1e293b' }}>
                    {message}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    ×
                </button>
            </div>
            {duration > 0 && (
                <div style={{
                    height: '3px',
                    background: '#e2e8f0',
                    position: 'relative'
                }}>
                    <div style={{
                        height: '100%',
                        background: color.bg,
                        width: `${progress}%`,
                        transition: 'width 50ms linear'
                    }} />
                </div>
            )}
        </div>
    );
};

export default ToastProvider;

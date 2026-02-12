import React from 'react';

const Notification = ({ type, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.1)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass-card" style={{
                maxWidth: '450px',
                width: '90%',
                padding: '0',
                background: 'white',
                border: 'none',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
                        {type === 'confirm' ? 'CONFIRMATION' : 'ATTENTION'}
                    </h3>
                </div>

                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '2.5rem', color: 'var(--text-dark)', fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.6' }}>
                        {message}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {type === 'confirm' ? (
                            <>
                                <button className="btn-primary" onClick={onConfirm} style={{ flex: 1, padding: '1rem' }}>
                                    {confirmText}
                                </button>
                                <button className="btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '1rem' }}>
                                    {cancelText}
                                </button>
                            </>
                        ) : (
                            <button className="btn-primary" onClick={onCancel} style={{ minWidth: '180px', padding: '1rem' }}>
                                GO BACK
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Notification;

import { useCallback, useEffect, useId, useRef } from "react";

export default function Modal({ 
    isModalOpen, 
    setIsModalOpen, 
    modalHeader, 
    modalSubtitle,
    modalIcon,
    maxWidth = "max-w-md", 
    children 
}) {
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previousActiveElement = useRef(null);
    const titleId = useId();

    const handleClickOutside = (event) => {
        if (!modalRef.current.contains(event.target)) {
            setIsModalOpen(false);
        }
    };

    // Handle ESC key to close modal
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            setIsModalOpen(false);
        }

        // Focus trap - keep focus within modal
        if (event.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift + Tab: if on first element, go to last
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab: if on last element, go to first
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        }
    }, [setIsModalOpen]);

    useEffect(() => {
        if (isModalOpen) {
            // Store currently focused element to restore later
            previousActiveElement.current = document.activeElement;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Add keyboard listener
            document.addEventListener('keydown', handleKeyDown);
            
            // Focus the close button after a short delay to ensure modal is rendered
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
        } else {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
            
            // Restore focus to previously focused element
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, handleKeyDown]);

    if (!isModalOpen) {
        return null;
    }

    return (
        <div 
            className="overflow-y-auto overflow-x-hidden fixed inset-0 z-50 flex justify-center items-center px-4 py-12 bg-black/40 backdrop-blur-md"
            onClick={handleClickOutside}
        >
            <div className={`relative w-full ${maxWidth} max-h-full`}>
                <div 
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="rounded-3xl overflow-hidden bg-[var(--neu-bg)] border border-[var(--neu-border)]"
                    style={{ 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 10px 20px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    {/* Header met gradient accent */}
                    <div 
                        className="px-6 py-5 border-b border-[var(--neu-border)]"
                        style={{ background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.05) 0%, transparent 100%)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {modalIcon && (
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-orange-600"
                                        style={{ boxShadow: '0 4px 12px rgba(255, 127, 80, 0.3)' }}
                                    >
                                        <span className="material-symbols-outlined text-white text-lg" aria-hidden="true">{modalIcon}</span>
                                    </div>
                                )}
                                <div>
                                    <h2 id={titleId} className="text-lg font-bold text-[var(--text-primary)]">
                                        {modalHeader}
                                    </h2>
                                    {modalSubtitle && (
                                        <p className="text-xs text-[var(--text-muted)] font-medium">{modalSubtitle}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                ref={closeButtonRef}
                                onClick={() => setIsModalOpen(false)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--gray-200)]/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                                type="button"
                                aria-label="Modal sluiten"
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
                <div className="h-12" onClick={handleClickOutside}></div>
            </div>
        </div>
    );
}
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const openModalStack = [];
const modalStackSubscribers = new Set();

function notifyModalStackChange() {
    modalStackSubscribers.forEach((subscriber) => subscriber());
}

function updateBodyScrollLock() {
    document.body.style.overflow = openModalStack.length === 0 ? 'auto' : 'hidden';
}

function addModalToStack(modalId) {
    if (!openModalStack.includes(modalId)) {
        openModalStack.push(modalId);
        updateBodyScrollLock();
        notifyModalStackChange();
    }
    return openModalStack.indexOf(modalId);
}

function removeModalFromStack(modalId) {
    const index = openModalStack.indexOf(modalId);
    if (index !== -1) {
        openModalStack.splice(index, 1);
        updateBodyScrollLock();
        notifyModalStackChange();
    }
}

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
    const modalInstanceId = useId();
    const titleId = useId();
    const [stackIndex, setStackIndex] = useState(0);
    const [, setStackVersion] = useState(0);

    const forceModalStackRender = useCallback(() => {
        setStackVersion((version) => version + 1);
    }, []);

    const isTopModal = useCallback(() => openModalStack[openModalStack.length - 1] === modalInstanceId, [modalInstanceId]);

    const handleClickOutside = () => {
        // This handler only fires for clicks on the backdrop
        // Clicks inside the modal are stopped by stopPropagation on the modal content
        if (!isTopModal()) return;
        setIsModalOpen(false);
    };

    // Handle ESC key to close modal
    const handleKeyDown = useCallback((event) => {
        if (!isTopModal()) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            setIsModalOpen(false);
        }

        // Focus trap - keep focus within modal
        if (event.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length === 0) {
                event.preventDefault();
                modalRef.current.focus();
                return;
            }
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
    }, [isTopModal, setIsModalOpen]);

    useEffect(() => {
        modalStackSubscribers.add(forceModalStackRender);
        return () => {
            modalStackSubscribers.delete(forceModalStackRender);
            removeModalFromStack(modalInstanceId);
        };
    }, [forceModalStackRender, modalInstanceId]);

    // Focus lifecycle, keyed on isModalOpen alone. handleKeyDown is a fresh
    // function on every render, so keeping focus restoration out of the stack
    // effect below (which depends on it) is deliberate: focus is captured once
    // when the modal opens and restored exactly once when it closes or unmounts.
    // It is never re-grabbed on an unrelated re-render of the modal's parent.
    useEffect(() => {
        if (!isModalOpen) {
            return;
        }

        // Remember what was focused so it can be restored on close, then move
        // focus onto the close button once the modal has painted.
        previousActiveElement.current = document.activeElement;
        const focusTimer = setTimeout(() => {
            closeButtonRef.current?.focus();
        }, 0);

        return () => {
            clearTimeout(focusTimer);
            previousActiveElement.current?.focus();
        };
    }, [isModalOpen]);

    // Stack membership and the keydown listener. This re-runs on every render
    // (handleKeyDown changes each time), which is harmless: joining the stack and
    // (re)binding the listener are idempotent and carry no focus side effect.
    useEffect(() => {
        if (isModalOpen) {
            setStackIndex(addModalToStack(modalInstanceId));
            document.addEventListener('keydown', handleKeyDown);
        } else {
            removeModalFromStack(modalInstanceId);
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, handleKeyDown, modalInstanceId]);

    if (!isModalOpen) {
        return null;
    }

    const isCurrentTop = openModalStack.length === 0 || isTopModal();

    return createPortal(
        <div
            className="overflow-y-auto overflow-x-hidden fixed inset-0 flex justify-center items-center px-4 py-12 bg-black/40 backdrop-blur-md"
            style={{ zIndex: 50 + stackIndex * 10 }}
            aria-hidden={isCurrentTop ? undefined : "true"}
            inert={isCurrentTop ? undefined : ""}
            onMouseDown={handleClickOutside}
        >
            <div className={`relative w-full ${maxWidth} max-h-full`}>
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal={isCurrentTop ? "true" : undefined}
                    aria-labelledby={titleId}
                    tabIndex={-1}
                    className="rounded-3xl overflow-hidden bg-[var(--neu-bg)] border border-[var(--neu-border)]"
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 10px 20px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                <div className="h-12" onMouseDown={handleClickOutside}></div>
            </div>
        </div>,
        document.body
    );
}

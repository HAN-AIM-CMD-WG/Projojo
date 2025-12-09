import { useEffect, useRef } from "react";

export default function Modal({ isModalOpen, setIsModalOpen, modalHeader, maxWidth = "max-w-md", children }) {
    const modalRef = useRef(null);

    const handleClickOutside = (event) => {
        if (!modalRef.current.contains(event.target)) {
            setIsModalOpen(false);
        }
    }

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isModalOpen]);

    return (
        <div>
            <div id="crud-modal" onClick={handleClickOutside} aria-hidden={!isModalOpen} className={`${isModalOpen ? 'flex' : 'hidden'} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-dvh max-h-full px-4 py-12 bg-black/40 backdrop-blur-sm`}>
                <div className={`relative w-full ${maxWidth} max-h-full`}>
                    <div ref={modalRef} className="neu-card-lg">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 rounded-t">
                            <h3 className="text-xl font-bold text-text-primary">
                                {modalHeader}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl text-sm w-10 h-10 inline-flex justify-center items-center transition-colors"
                                type="button">
                                <span className="material-symbols-outlined">close</span>
                                <span className="sr-only">Sluiten</span>
                            </button>
                        </div>
                        <div className="pt-4">
                            {children}
                        </div>
                    </div>
                    <div className="h-12" onClick={handleClickOutside}></div>
                </div>
            </div>
        </div>
    );
}
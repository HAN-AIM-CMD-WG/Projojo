import { useEffect, useRef } from "react";

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
            <div 
                id="crud-modal" 
                onClick={handleClickOutside} 
                aria-hidden={!isModalOpen} 
                className={`${isModalOpen ? 'flex' : 'hidden'} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-dvh max-h-full px-4 py-12 bg-black/40 backdrop-blur-md`}
            >
                <div className={`relative w-full ${maxWidth} max-h-full`}>
                    <div 
                        ref={modalRef} 
                        className="rounded-3xl overflow-hidden"
                        style={{ 
                            background: 'linear-gradient(145deg, #f5f4f4, #ffffff)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)'
                        }}
                    >
                        {/* Header met gradient accent */}
                        <div 
                            className="px-6 py-5 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.03) 0%, transparent 100%)' }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {modalIcon && (
                                        <div 
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-orange-600"
                                            style={{ boxShadow: '0 4px 12px rgba(255, 127, 80, 0.3)' }}
                                        >
                                            <span className="material-symbols-outlined text-white text-lg">{modalIcon}</span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {modalHeader}
                                        </h3>
                                        {modalSubtitle && (
                                            <p className="text-xs text-gray-500 font-medium">{modalSubtitle}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                    <span className="sr-only">Sluiten</span>
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
        </div>
    );
}
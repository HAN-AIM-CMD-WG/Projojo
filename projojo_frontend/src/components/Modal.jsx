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
            <div id="crud-modal" onClick={handleClickOutside} aria-hidden={!isModalOpen} className={`${isModalOpen ? 'flex' : 'hidden'} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-dvh max-h-full px-4 py-12 bg-black/30`}>
                <div className={`relative w-full ${maxWidth} max-h-full`}>
                    <div ref={modalRef} className="relative bg-white rounded-lg shadow ">
                        <div className="flex items-center justify-between p-4 border-b rounded-t">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {modalHeader}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center"
                                type="button">
                                <svg className="w-3 h-3" aria-hidden="true" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span className="sr-only">Sluiten</span>
                            </button>
                        </div>
                        <div className="p-4">
                            {children}
                        </div>
                    </div>
                    <div className="h-12" onClick={handleClickOutside}></div>
                </div>
            </div>
        </div>
    );
}
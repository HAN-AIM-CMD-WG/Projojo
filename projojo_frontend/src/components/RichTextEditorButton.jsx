
export default function RichTextEditorButton({ icon, onClick, isActive, label }) {
    return (
        <button
            onClick={() => onClick()}
            aria-label={label}
            title={label}
            role='button'
            type='button'
            className={`
                font-semibold w-9 h-9 flex items-center justify-center
                border-none cursor-pointer rounded-lg transition-all duration-200
                ${isActive 
                    ? 'bg-primary text-white shadow-md scale-95' 
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-primary hover:scale-105 shadow-sm'
                }
            `}
            style={isActive ? { boxShadow: '0 2px 8px rgba(255, 127, 80, 0.4)' } : {}}
        >
            {icon}
        </button>
    )
};
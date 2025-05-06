
export default function RichTextEditorButton({ icon, onClick, isActive, label }) {
    return (
        <button
            onClick={() => onClick()}
            aria-label={label}
            title={label}
            role='button'
            type='button'
            className={`font-semibold px-4 py-2 h-10 border-none cursor-pointer rounded transition-colors ${isActive ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
            {icon}
        </button>
    )
};
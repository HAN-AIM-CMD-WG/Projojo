/**
 * FilterChip - A dropdown chip for filtering
 * 
 * @param {Object} props
 * @param {string} props.label - Label shown when no value selected
 * @param {string} [props.icon] - Material icon name
 * @param {string} [props.value] - Currently selected value
 * @param {string[]} props.options - Available options
 * @param {boolean} props.isOpen - Whether dropdown is open
 * @param {Function} props.onToggle - Toggle dropdown visibility
 * @param {Function} props.onSelect - Called when option is selected
 * @param {Function} props.onClear - Called when value is cleared
 */
export default function FilterChip({ 
    label, 
    icon,
    value, 
    options, 
    isOpen, 
    onToggle, 
    onSelect, 
    onClear 
}) {
    // Don't render if no options available
    if (!options || options.length === 0) return null;
    
    return (
        <div className="relative">
            <button
                className={`flex items-center gap-2 neu-btn !py-2 !px-3 text-sm ${
                    value ? 'ring-2 ring-primary/30' : ''
                }`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {icon && (
                    <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
                )}
                <span className="font-bold">{value || label}</span>
                {value && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        1
                    </span>
                )}
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>
            
            {/* Dropdown */}
            {isOpen && options.length > 0 && (
                <div 
                    className="absolute top-full mt-2 left-0 z-50 min-w-[200px] neu-flat rounded-xl p-2 shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                    aria-label={`${label} opties`}
                >
                    {/* Clear option */}
                    {value && (
                        <button
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors mb-1 border-b border-[var(--neu-border)]"
                            onClick={() => onClear()}
                            role="option"
                        >
                            <span className="material-symbols-outlined text-sm mr-1.5 align-middle" aria-hidden="true">close</span>
                            Filter wissen
                        </button>
                    )}
                    {options.map(option => (
                        <button
                            key={option}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                                hover:bg-primary/10 transition-colors
                                ${value === option ? 'bg-primary/10 text-primary font-bold' : 'text-[var(--text-primary)]'}`}
                            onClick={() => onSelect(option)}
                            role="option"
                            aria-selected={value === option}
                        >
                            {value === option && (
                                <span className="material-symbols-outlined text-sm mr-1.5 align-middle" aria-hidden="true">check</span>
                            )}
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

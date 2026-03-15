import { Link } from "react-router-dom";

/**
 * Neumorphic breadcrumb navigation component.
 * 
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 * items - Array of breadcrumb items. Last item is rendered as plain text (current page).
 *         Earlier items are rendered as links.
 */
export default function Breadcrumb({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-1.5">
                            {index > 0 && (
                                <span 
                                    className="material-symbols-outlined text-xs text-[var(--text-muted)]" 
                                    aria-hidden="true"
                                >
                                    chevron_right
                                </span>
                            )}
                            {isLast || !item.to ? (
                                <span 
                                    className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]"
                                    aria-current="page"
                                    title={item.label}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.to}
                                    className="font-medium text-[var(--text-muted)] hover:text-primary transition-colors duration-200 truncate max-w-[200px]"
                                    title={item.label}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

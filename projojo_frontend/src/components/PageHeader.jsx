export default function PageHeader({ name, subtitle, icon }) {
    return (
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                {icon && (
                    <span className="material-symbols-outlined text-primary text-4xl">
                        {icon}
                    </span>
                )}
                <span>{name}</span>
            </h1>
            {subtitle && (
                <p className="text-sm text-[var(--text-muted)] font-semibold mt-2">{subtitle}</p>
            )}
        </div>
    )
}


export default function InfoBox({ children, className }) {
    return (
        <div className={`px-4 py-3 w-full neu-pressed rounded-xl text-sm font-medium text-text-secondary ${className}`}>
            {children}
        </div>
    );
}
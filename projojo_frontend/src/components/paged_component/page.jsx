/**
 * Creates a Page component
 */
export default function Page({ children, className, hidden = false }) {
    return (
        <div data-testid="page" hidden={hidden} className={`${className ?? ''} ${hidden ? "hidden" : ""}`}>
            {children}
        </div>
    );
}
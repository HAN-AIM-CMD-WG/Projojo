import { Link } from "react-router-dom";

/**
 * Creates a NotFound component
 */
export default function NotFound() {
    return (
        <div className="mx-auto max-w-screen-sm py-12 lg:py-20 text-center px-4">
            <div className="neu-card-lg">
                <div className="mb-6">
                    <span className="material-symbols-outlined text-8xl lg:text-9xl text-primary/30">search_off</span>
                </div>
                <h1 className="mb-4 text-6xl tracking-tight font-extrabold lg:text-8xl text-primary">404</h1>
                <p className="mb-4 text-2xl tracking-tight font-bold text-text-primary md:text-3xl">Pagina niet gevonden</p>
                <p className="mb-8 text-lg text-text-muted">Sorry, de pagina waar je naar zoekt kan niet gevonden worden.</p>
                <Link to="/home" className="neu-btn-primary inline-flex items-center gap-2">
                    <span className="material-symbols-outlined">home</span>
                    Terug naar homepagina
                </Link>
            </div>
        </div>
    );
}
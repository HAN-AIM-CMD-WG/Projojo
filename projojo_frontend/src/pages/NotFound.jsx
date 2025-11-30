import { Link } from "react-router-dom";

/**
 * Creates a NotFound component
 */
export default function NotFound() {
    return (
        <div className="mx-auto max-w-screen-sm py-8 lg:py-16 text-center">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600">404</h1>
            <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl">Pagina kan niet gevonden worden</p>
            <p className="mb-8 text-lg text-gray-500">Sorry, de pagina waar je naar zoekt kan niet gevonden worden.</p>
            <Link to="/home" className="btn-primary">Terug naar homepagina</Link>
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPortfolio } from '../services';

/**
 * PublicPortfolioPage (PF-task-013)
 *
 * Minimal, chrome-less route shell for a world-public student portfolio at /portfolio/:slug.
 * It fetches the reduced, student-safe public shape without authentication and renders it bare;
 * richer presentation is layered on by later portfolio-page tasks. A 404 (unknown or
 * non-world-public slug) is caught locally and shown as an in-page not-found state, so it never
 * surfaces as a global error toast.
 */
export default function PublicPortfolioPage() {
    const { slug } = useParams();
    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setNotFound(false);
        setLoadError(false);
        setPortfolio(null);

        getPublicPortfolio(slug)
            .then((data) => {
                if (active) setPortfolio(data);
            })
            .catch((err) => {
                if (!active) return;
                // A 404 (private/unknown slug) is the expected "not public" outcome and renders the
                // in-page not-found state. Any other failure (500, network) is a real error, kept
                // separate here so the fully-realised page (PF-task-017) can show a distinct retry
                // state rather than mislabelling a transient backend fault as "does not exist".
                // Either way the rejection is handled locally and never reaches the global
                // unhandledrejection toast.
                if (err?.statusCode === 404) {
                    setNotFound(true);
                } else {
                    setLoadError(true);
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [slug]);

    return (
        <div data-testid="public-portfolio-page" className="min-h-screen bg-neu-bg px-4 py-8">
            {isLoading && (
                <p data-testid="public-portfolio-loading" className="text-text-secondary">
                    Portfolio laden...
                </p>
            )}

            {!isLoading && notFound && (
                <section data-testid="public-portfolio-not-found" className="neu-flat mx-auto max-w-xl p-6 text-center">
                    <h1 className="text-xl font-semibold text-text-primary">Portfolio niet gevonden</h1>
                    <p className="mt-2 text-text-secondary">
                        Dit portfolio bestaat niet of is niet openbaar.
                    </p>
                </section>
            )}

            {!isLoading && loadError && (
                <section data-testid="public-portfolio-error" className="neu-flat mx-auto max-w-xl p-6 text-center">
                    <h1 className="text-xl font-semibold text-text-primary">Portfolio kon niet worden geladen</h1>
                    <p className="mt-2 text-text-secondary">
                        Er ging iets mis bij het laden van dit portfolio. Probeer het later opnieuw.
                    </p>
                </section>
            )}

            {!isLoading && !notFound && portfolio && (
                <article className="mx-auto max-w-3xl">
                    <h1 data-testid="public-portfolio-name" className="text-2xl font-semibold text-text-primary">
                        {portfolio.student?.full_name}
                    </h1>
                    {portfolio.student?.portfolio_summary && (
                        <p data-testid="public-portfolio-summary" className="mt-3 text-text-secondary">
                            {portfolio.student.portfolio_summary}
                        </p>
                    )}

                    <ul data-testid="public-portfolio-items" className="mt-6 space-y-4">
                        {portfolio.items?.map((item) => (
                            <li key={item.id} data-testid="public-portfolio-item" className="neu-flat p-4">
                                <h2 className="font-semibold text-text-primary">{item.task?.name}</h2>
                                <p className="text-text-secondary">{item.project?.name}</p>
                            </li>
                        ))}
                    </ul>
                </article>
            )}
        </div>
    );
}

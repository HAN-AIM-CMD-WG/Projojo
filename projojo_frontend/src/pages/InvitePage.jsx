import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { validateInvite, API_BASE_URL, IMAGE_BASE_URL } from '../services';
import { notification } from '@/components/notifications/NotifySystem';

export default function InvitePage() {
    const { token } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [business, setBusiness] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let ignore = false;
        validateInvite(token)
            .then(data => {
                if (ignore) return;
                setBusiness(data.business);
                setIsLoading(false);
            })
            .catch(error => {
                if (ignore) return;
                notification.error(error.message);
                navigate('/', { replace: true });
            });

        return () => {
            ignore = true;
        };
    }, [token]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold mb-6">Uitnodiging gevonden</h2>

            <div className="mb-8">
                <p className="text-gray-600 mb-4">Je bent uitgenodigd om supervisor te worden voor:</p>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    {business.imagePath && (
                        <img
                            src={`${IMAGE_BASE_URL}${business.imagePath}`}
                            alt={business.name}
                            className="w-24 h-24 object-cover rounded-full mb-3"
                        />
                    )}
                    <h3 className="text-xl font-semibold">{business.name}</h3>
                </div>
            </div>

            <p className="text-gray-600 mb-6">Registreer met een van de volgende services om je account te koppelen:</p>

            <div className="space-y-3">
                <a
                    href={`${API_BASE_URL}auth/login/google?invite_token=${token}`}
                    className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3"
                >
                    <img src="/assets/icons/google.svg" alt="Google" className="h-5 w-5" />
                    Registreren met Google
                </a>
                <a
                    href={`${API_BASE_URL}auth/login/microsoft?invite_token=${token}`}
                    className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3"
                >
                    <img src="/assets/icons/microsoft.svg" alt="Microsoft" className="h-5 w-5" />
                    Registreren met Microsoft
                </a>
                <a
                    href={`${API_BASE_URL}auth/login/github?invite_token=${token}`}
                    className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3"
                >
                    <img src="/assets/icons/github.svg" alt="GitHub" className="h-5 w-5" />
                    Registreren met GitHub
                </a>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm hover:underline flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 -mb-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Annuleren en terug naar home
                </Link>
            </div>
        </div>
    );
}

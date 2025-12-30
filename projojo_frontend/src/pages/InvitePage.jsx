import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { validateInvite, API_BASE_URL, IMAGE_BASE_URL } from '../services';

export default function InvitePage() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, valid, error
    const [business, setBusiness] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let ignore = false;
        validateInvite(token)
            .then(data => {
                if (ignore) return;
                setBusiness(data.business);
                setStatus('valid');
            })
            .catch(err => {
                if (ignore) return;
                setStatus('error');
                setError(err.message || "Ongeldige of verlopen uitnodiging");
            });

        return () => {
            ignore = true;
        };
    }, [token]);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
                <div className="text-red-500 text-5xl mb-4">
                    <i className="fas fa-exclamation-circle"></i>
                </div>
                <h2 className="text-2xl font-bold mb-2">Uitnodiging ongeldig</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <a href="/" className="text-primary hover:underline">Terug naar home</a>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold mb-6">Uitnodiging voor Supervisor</h2>

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
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
                    Registreren met Google
                </a>
                <a
                    href={`${API_BASE_URL}auth/login/microsoft?invite_token=${token}`}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <img src="https://www.svgrepo.com/show/452062/microsoft.svg" alt="Microsoft" className="h-5 w-5 mr-2" />
                    Registreren met Microsoft
                </a>
                <a
                    href={`${API_BASE_URL}auth/login/github?invite_token=${token}`}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="h-5 w-5 mr-2" />
                    Registreren met GitHub
                </a>
            </div>
        </div>
    );
}

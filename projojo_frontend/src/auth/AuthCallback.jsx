import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notification } from "../components/notifications/NotifySystem";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const isNewUser = searchParams.get('is_new_user') === 'true';
        const error = searchParams.get('error');
        const message = searchParams.get('message');
        const inviteToken = searchParams.get('invite_token');

        // Handle error cases
        if (error) {
            let errorMessage = message || "Authenticatie mislukt. Probeer het opnieuw.";

            if (!message) {
                if (error === 'unsupported_provider') {
                    errorMessage = "Deze login methode wordt niet ondersteund.";
                } else if (error === 'auth_failed') {
                    errorMessage = "Authenticatie mislukt. Probeer het opnieuw.";
                } else if (error === 'access_denied') {
                    errorMessage = "Je hebt de login geannuleerd.";
                }
            }

            notification.error(errorMessage);
            if (inviteToken) {
                navigate(`/invite/${inviteToken}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
            return;
        }

        // Handle successful authentication
        if (accessToken) {
            localStorage.setItem('token', accessToken);

            // Show appropriate welcome message
            if (isNewUser) {
                notification.success("Welkom! Je account is succesvol aangemaakt.");
            } else {
                notification.success("Welkom terug!");
            }

            navigate('/home', { replace: true });
        } else {
            // No token and no error - something went wrong
            navigate('/', { replace: true });
            notification.error("Authenticatie mislukt. Probeer het opnieuw.");
        }
    }, [navigate, searchParams]);

    return null;
}

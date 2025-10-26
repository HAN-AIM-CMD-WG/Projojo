import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notification } from "../components/notifications/NotifySystem";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const isNewUser = searchParams.get('is_new_user') === 'true';

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
            navigate('/', { replace: true });
            notification.error("Authenticatie mislukt. Probeer het opnieuw.");
        }
    }, [navigate, searchParams]);

    return null;
}

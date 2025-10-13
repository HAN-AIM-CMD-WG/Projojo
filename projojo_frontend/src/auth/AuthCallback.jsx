import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notification } from "../components/notifications/NotifySystem";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');

        if (accessToken) {
            localStorage.setItem('token', accessToken);
            navigate('/home', { replace: true });
        } else {
            navigate('/', { replace: true });
            notification.error("Authenticatie mislukt. Probeer het opnieuw.");
        }
    }, [navigate, searchParams]);

    return null;
}

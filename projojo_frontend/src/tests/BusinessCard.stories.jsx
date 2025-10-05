import { expect, within, fn } from '@storybook/test';
import BusinessCard from '../components/BusinessCard';
import { useAuth, AuthProvider } from '../auth/AuthProvider';

export default {
    title: 'Components/BusinessCard',
    component: BusinessCard,
    args: {
        name: 'Gemeente Arnhem',
        location: 'Arnhem',
        image: '/image.png',
        businessId: 1,
        topSkills: [{ name: 'Adobe Premiere', id: 1 }, { name: 'Camerabediening', id: 2 }, { name: 'PHP', id: 3 }],
    },
};

export const Default = {
    name: 'Default',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByRole('img')).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', '/business/1');
        expect(canvas.getByText('Gemeente Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Arnhem')).toBeInTheDocument();
        expect(canvas.getByAltText('Bedrijfslogo')).toBeInTheDocument();
        expect(canvas.getByText('Bekijk bedrijf')).toBeInTheDocument();
        expect(canvas.getByText('Top 3 skills in dit bedrijf:')).toBeInTheDocument();
        expect(canvas.getByText('Adobe Premiere')).toBeInTheDocument();
        expect(canvas.getByText('Camerabediening')).toBeInTheDocument();
        expect(canvas.getByText('PHP')).toBeInTheDocument();
    }
};

export const SkillsUndefined = {
    args: {
        topSkills: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Top 0 skills in dit bedrijf:')).toBeInTheDocument();
    }
};

export const MoreSkills = {
    args: {
        topSkills: [
            { name: 'PHP', id: 1 },
            { name: 'Java', id: 2 },
            { name: 'React', id: 3 },
            { name: 'Tailwind', id: 4 },
            { name: 'Bootstrap', id: 5 },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Top 5 skills in dit bedrijf:')).toBeInTheDocument();
        expect(canvas.getByText('PHP')).toBeInTheDocument();
        expect(canvas.getByText('Java')).toBeInTheDocument();
        expect(canvas.getByText('React')).toBeInTheDocument();
        expect(canvas.getByText('Tailwind')).toBeInTheDocument();
        expect(canvas.getByText('Bootstrap')).toBeInTheDocument();
    }
};

export const AddColleagueLoading = {
    args: {
        showUpdateButton: true,
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { setAuthData } = useAuth();
                setAuthData({ businessId: 1, userId: 1, type: 'supervisor' });

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        window.fetch = fn(() =>
            new Promise(() => { })
        );

        const addButton = canvas.getByText('Collega toevoegen');
        addButton.click();

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(canvas.getByText('Collega toevoegen')).toBeInTheDocument();
        expect(canvas.getByText(/Aan het laden.../)).toBeInTheDocument();
        expect(window.fetch).toHaveBeenCalledTimes(1);
    }
};

export const AddColleagueSuccesfully = {
    args: {
        showUpdateButton: true,
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { setAuthData } = useAuth();
                setAuthData({ businessId: 1, userId: 1, type: 'supervisor' });

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await new Promise((resolve) => setTimeout(resolve, 100));

        window.fetch = fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ link: 'http://localhost:5173/invite/BUY35IMO6MUBY54UY6M54HU6BN54IN6HN54I6NInyu45uni5n4i6nNIIUNI54UI6', timestamp: '2024-12-20 13:45:35.254181' }),
            })
        );

        const addButton = canvas.getByText('Collega toevoegen');
        addButton.click();

        await expect(canvas.findByText('Deel de volgende link met je collega:')).resolves.toBeInTheDocument();
        expect(canvas.getByDisplayValue('http://localhost:5173/invite/BUY35IMO6MUBY54UY6M54HU6BN54IN6HN54I6NInyu45uni5n4i6nNIIUNI54UI6')).toBeInTheDocument();
        expect(canvas.getByText(/27 december 2024 om 13:45/)).toBeInTheDocument();
        expect(window.fetch).toHaveBeenCalledTimes(1);
    }
};

export const AddColleagueFails = {
    args: {
        showUpdateButton: true,
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { setAuthData } = useAuth();
                setAuthData({ businessId: 1, userId: 1, type: 'supervisor' });

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await new Promise((resolve) => setTimeout(resolve, 100));

        window.fetch = fn(() =>
            Promise.reject(new Error('Er is een onverwachte fout opgetreden.'))
        );

        const addButton = canvas.getByText('Collega toevoegen');
        addButton.click();

        await expect(canvas.findByText('Er is iets misgegaan.')).resolves.toBeInTheDocument();
        expect(canvas.getByText('Er is een onverwachte fout opgetreden.')).toBeInTheDocument();
        expect(window.fetch).toHaveBeenCalledTimes(1);
    }
};
export const AddTeacherLoading = {
    args: {
        showUpdateButton: true,
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { setAuthData } = useAuth();
                setAuthData({ businessId: 0, userId: 1, type: 'teacher' });

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await new Promise((resolve) => setTimeout(resolve, 100));

        window.fetch = fn(() =>
            new Promise(() => { })
        );

        const addButton = canvas.getByText('Collega toevoegen');
        addButton.click();

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(canvas.getByText('Collega toevoegen')).toBeInTheDocument();
        expect(canvas.getByText(/Aan het laden.../)).toBeInTheDocument();
        expect(window.fetch).toHaveBeenCalledTimes(1);
    }
};
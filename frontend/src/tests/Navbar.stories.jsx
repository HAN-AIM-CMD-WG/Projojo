import { expect, fn, within } from '@storybook/test';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import Navbar from '../components/Navbar';

export default {
    title: 'Components/Navbar',
    component: Navbar,
};

export const NavbarStudent = {
    decorators: [
        (Story) => {
            // Set up the mock for the "student" role
            window.fetch = fn()
                .mockResolvedValue({
                    ok: true,
                    json: fn().mockResolvedValue({ id: 1, name: "Student Name", profilePicture: { path: "" } }),
                }); // Mock /student/:id

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "student", userId: 1, businessId: null, profilePicture: { path: "" } });

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

        // Wait for the component to reflect the mock
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(canvas.getByText("Mijn profiel")).toBeInTheDocument();
    },
};

export const NavbarSupervisor = {
    decorators: [
        (Story) => {
            // Set up the mock for the "supervisor" role
            window.fetch = fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: fn().mockResolvedValueOnce({ id: 2, name: "Supervisor Name" }),
                }); // Mock /student/:id

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "supervisor", userId: 1, businessId: 1 });

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

        // Wait for the component to reflect the mock
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(canvas.getByText("Mijn bedrijf")).toBeInTheDocument();
    },
};

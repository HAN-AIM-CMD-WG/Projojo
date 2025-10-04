import { expect, within } from 'storybook/test';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import Task from '../components/Task';

export default {
    title: 'Components/Task',
    component: Task,
    args: {
        task: {
            taskId: 1,
            title: 'Titel',
            description: 'Beschrijving van de taak',
            skills: [
                { skillId: 1, name: 'Skill 1' },
                { skillId: 2, name: 'Skill 2' },
                { skillId: 3, name: 'Skill 3' },
            ],
            totalNeeded: 5,
            totalRegistered: 1,
        },
        businessId: 1,
        allSkills: [
            { skillId: 1, name: 'Skill 1' },
            { skillId: 2, name: 'Skill 2' },
            { skillId: 3, name: 'Skill 3' },
            { skillId: 4, name: 'Skill 4' },
            { skillId: 5, name: 'Skill 5' },
        ]
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { authData } = useAuth();

                authData.type = "student";
                authData.userId = 1;
                authData.businessId = null;

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
};

export const LoggedInAsUnregisteredStudent = {
    args: {
        isNotAllowedToRegister: false
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Titel')).toBeInTheDocument();
        expect(canvas.getByText('Beschrijving van de taak')).toBeInTheDocument();
        expect(canvas.getAllByText(/Skill \d/)).toHaveLength(3);

        const button = canvas.getByText('Aanmelden')
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
    },
}

export const LoggedInAsRegisteredStudent = {
    args: {
        isNotAllowedToRegister: true
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Titel')).toBeInTheDocument();
        expect(canvas.getByText('Beschrijving van de taak')).toBeInTheDocument();
        expect(canvas.getAllByText(/Skill \d/)).toHaveLength(3);

        const button = canvas.getByText('Aanmelding ontvangen')
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(button).toHaveClass("cursor-not-allowed opacity-50");
    },
}

export const LoggedInAsSupervisor = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Bekijk aanmeldingen')).toBeInTheDocument();
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { authData } = useAuth();

                authData.type = "supervisor";
                authData.userId = 2;
                authData.businessId = 1;

                return <Story />;
            };

            return (
                <AuthProvider>
                    <Wrapper />
                </AuthProvider>
            );
        },
    ],
}

import { expect, fn, userEvent, within } from 'storybook/test';
import StudentProfileSkill from '../components/StudentProfileSkill';

export default {
    title: 'Components/StudentProfileSkill',
    component: StudentProfileSkill,
    args: {
        skill: {
            skill: {
                skillId: 1,
                name: 'JavaScript'
            },
            description: 'I have mastered JavaScript by building multiple projects.'
        },
        isOwnProfile: true,
    },
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('JavaScript')).toBeInTheDocument();

        expect(canvas.getByText('I have mastered JavaScript by building multiple projects.')).toBeInTheDocument();

        expect(canvas.getByText(/Onderbouwing/)).toBeInTheDocument();
    },
};

export const EnterEditMode = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const editButton = canvas.getByText(/Onderbouwing/);
        await userEvent.click(editButton);

        expect(canvas.getByRole('textbox')).toBeInTheDocument();

        expect(canvas.getByText(/Opslaan/)).toBeInTheDocument();
        expect(canvas.getByText(/Annuleren/)).toBeInTheDocument();
    },
};

export const CancelEdit = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const editButton = canvas.getByText(/Onderbouwing/);
        await userEvent.click(editButton);

        const textarea = canvas.getByRole('textbox');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Updated description.');

        const cancelButton = canvas.getByText(/Annuleren/);
        await userEvent.click(cancelButton);

        expect(canvas.getByText('I have mastered JavaScript by building multiple projects.')).toBeInTheDocument();
    },
};

export const SaveEdit = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const editButton = canvas.getByText(/Onderbouwing/);
        await userEvent.click(editButton);

        const textarea = canvas.getByRole('textbox');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Updated description.');

        const saveButton = canvas.getByText(/Opslaan/);
        await userEvent.click(saveButton);

        expect(canvas.getByText('Updated description.')).toBeInTheDocument();
    },
};

export const ShowErrorOnSaveFailure = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        window.fetch = fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: 'Er is iets misgegaan bij het opslaan van de Onderbouwing.' }),
            })
        );

        const editButton = canvas.getByText(/Onderbouwing/);
        await userEvent.click(editButton);

        const textarea = canvas.getByRole('textbox');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'falende onderbouwing.');


        const saveButton = canvas.getByText(/Opslaan/);
        await userEvent.click(saveButton);


        expect(canvas.getByText('Er is iets misgegaan bij het opslaan van de Onderbouwing.')).toBeInTheDocument();


        window.fetch.mockRestore();
    },
};

export const NotLoggedInAsStudent = {
    args: {
        isOwnProfile: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.queryByText(/Onderbouwing/)).not.toBeInTheDocument();
    },
};
import { expect, fn, userEvent, within } from '@storybook/test';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import SkillsEditor from '../components/SkillsEditor';

const onSaveMock = fn()
const onCancelMock = fn()
const setErrorMock = fn()

export default {
    title: 'Components/SkillsEditor',
    component: SkillsEditor,
    decorators: [
        (Story) => {
            window.fetch = fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: fn().mockResolvedValueOnce({ skills: [{ skill: { skillId: 2 } }] }),
                });

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "student", userId: 1, businessId: null, profilePicture: { path: "" } });

                return <Story />;
            };

            return (
                <AuthProvider>
                    <div className="w-96">
                        <Wrapper />
                    </div>
                </AuthProvider>
            )
        },
    ],
    args: {
        allSkills: [
            { skillId: 1, name: 'React' },
            { skillId: 2, name: 'JavaScript' },
            { skillId: 3, name: 'CSS' },
            { skillId: 4, name: 'Tailwind CSS' },
            { skillId: 5, name: 'PHP' },
        ],
        initialSkills: [
            { skillId: 1, name: 'React' },
            { skillId: 3, name: 'CSS' },
        ],
        isEditing: true,
        onSave: onSaveMock,
        onCancel: onCancelMock,
        setError: setErrorMock,
        isAllowedToAddSkill: false,
        isAbsolute: false,
        maxSkillsDisplayed: 20,
        showOwnSkillsOption: false,
    },
    render: (args) => <SkillsEditor {...args} >
        Text when isEditing is false
    </SkillsEditor>,
}

export const Default = {
    args: {
        isEditing: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Text when isEditing is false')).toBeInTheDocument();

        // to check if above text is the only text in the canvas
        expect(canvas.queryAllByText(/./)).toHaveLength(1);
    },
}

export const EditSkills = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('React')).toBeInTheDocument();
        expect(canvas.getByText('CSS')).toBeInTheDocument();

        expect(canvas.getByPlaceholderText(/Zoek/)).toBeInTheDocument();

        expect(canvas.getByText('JavaScript')).toBeInTheDocument();
        expect(canvas.getByText('Tailwind CSS')).toBeInTheDocument();
        expect(canvas.getByText('PHP')).toBeInTheDocument();

        expect(canvas.getByText(/Opslaan/)).toBeInTheDocument();
        expect(canvas.getByText(/Annuleren/)).toBeInTheDocument();
    },
}

export const SaveEdit = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByRole('textbox');
        await userEvent.type(searchInput, 'test');
        expect(searchInput).toHaveValue('test');

        const saveButton = canvas.getByText(/Opslaan/);
        await userEvent.click(saveButton);

        expect(onSaveMock).toHaveBeenCalledWith([
            { skillId: 1, name: 'React' },
            { skillId: 3, name: 'CSS' },
        ]);
        expect(searchInput).toHaveValue('');
    },
}

export const CancelEdit = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByRole('textbox');
        await userEvent.type(searchInput, 'test');
        expect(searchInput).toHaveValue('test');

        const cancelButton = canvas.getByText(/Annuleren/);
        await cancelButton.click();

        expect(searchInput).toHaveValue('');
        expect(onCancelMock).toHaveBeenCalled();
    },
}

export const AddSkill = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const addJavaScriptButton = canvas.getByText('JavaScript');
        await userEvent.click(addJavaScriptButton);

        const saveButton = canvas.getByText(/Opslaan/);
        await userEvent.click(saveButton);

        expect(onSaveMock).toHaveBeenCalledWith([
            { skillId: 1, name: 'React' },
            { skillId: 3, name: 'CSS' },
            { skillId: 2, name: 'JavaScript' },
        ]);
    },
}

export const RemoveSkill = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const removeButton = canvas.getByText('React');
        await userEvent.click(removeButton);

        const saveButton = canvas.getByText(/Opslaan/);
        await userEvent.click(saveButton);

        expect(onSaveMock).toHaveBeenCalledWith([
            { skillId: 3, name: 'CSS' },
        ]);
    },
}

export const NoSkillsSelected = {
    args: {
        initialSkills: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Er zijn geen skills geselecteerd.')).toBeInTheDocument();
    }
}

export const FilterSkills = {
    args: {
        initialSkills: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByRole('textbox');
        await userEvent.type(searchInput, 'tailwind');

        expect(canvas.getByText('Tailwind CSS')).toBeInTheDocument();

        expect(canvas.queryByText('React')).not.toBeInTheDocument();
        expect(canvas.queryByText('JavaScript')).not.toBeInTheDocument();
        expect(canvas.queryByText('CSS')).not.toBeInTheDocument();
        expect(canvas.queryByText('PHP')).not.toBeInTheDocument();
    },
}

export const FilterSkillsNotFound = {
    args: {
        initialSkills: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByRole('textbox');
        await userEvent.type(searchInput, 'lorem ipsum');

        expect(canvas.getByText('Geen skills gevonden.')).toBeInTheDocument();
    },
}

export const CreateSkill = {
    args: {
        isAllowedToAddSkill: true,
    },
    play: async ({ canvasElement }) => {
        window.fetch = fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ skillId: 6, name: 'Lorem Ipsum' }),
            })
        );

        const canvas = within(canvasElement);

        const searchInput = canvas.getByRole('textbox');
        await userEvent.type(searchInput, 'lorem ipsum');

        expect(canvas.getByText('Geen skills gevonden.')).toBeInTheDocument();

        const addButton = canvas.getByText(/toevoegen/);
        await userEvent.click(addButton);

        expect(searchInput).toHaveValue('');
        expect(canvas.getByText('Lorem Ipsum')).toBeInTheDocument();
    },
}

export const NoAvailableSkills = {
    args: {
        allSkills: [],
        initialSkills: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Geen skills beschikbaar.')).toBeInTheDocument();
    },
}

export const absolutePosition = {
    args: {
        isAbsolute: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByRole('dialog')).toHaveClass('absolute');
    },
}

export const notAbsolutePosition = {
    args: {
        isAbsolute: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByRole('dialog')).not.toHaveClass('absolute');
    },
}

export const MoreThanMaxAmountOfSkillsDisplayed = {
    args: {
        maxSkillsDisplayed: 1,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('React')).toBeInTheDocument();
        expect(canvas.getByText('CSS')).toBeInTheDocument();
        expect(canvas.queryByText('JavaScript')).toBeInTheDocument();

        expect(canvas.queryByText('PHP')).not.toBeInTheDocument();
        expect(canvas.queryByText('Tailwind CSS')).not.toBeInTheDocument();

        const showMoreButton = canvas.getByText('+2 tonen');
        expect(showMoreButton).toBeInTheDocument();
        await userEvent.click(showMoreButton);

        expect(canvas.getByText('PHP')).toBeInTheDocument();
        expect(canvas.getByText('Tailwind CSS')).toBeInTheDocument();

        await userEvent.click(canvas.getByText('Minder tonen'));
        expect(canvas.queryByText('PHP')).not.toBeInTheDocument();
        expect(canvas.queryByText('Tailwind CSS')).not.toBeInTheDocument();
    },
}

export const OnlyShowOwnSkills = {
    args: {
        showOwnSkillsOption: true,
    },
    play: async ({ canvasElement }) => {
        await new Promise(r => setTimeout(() => r(), 100));

        const canvas = within(canvasElement);

        expect(canvas.getByText('Laat alleen mijn eigen skills zien')).toBeInTheDocument();
        expect(canvas.getByText('PHP')).toBeInTheDocument();
        expect(canvas.getByText('Tailwind CSS')).toBeInTheDocument();

        const checkbox = canvas.getByRole('checkbox');
        await userEvent.click(checkbox);

        expect(checkbox).toBeChecked();

        expect(canvas.getByText('JavaScript')).toBeInTheDocument();
        expect(canvas.queryByText('PHP')).not.toBeInTheDocument();
        expect(canvas.queryByText('Tailwind CSS')).not.toBeInTheDocument();
    },
}
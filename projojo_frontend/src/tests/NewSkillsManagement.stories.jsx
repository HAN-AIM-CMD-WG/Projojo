import { expect, fn, userEvent, within } from 'storybook/test';
import NewSkillsManagement from '../components/NewSkillsManagement';

export default {
    title: 'Components/NewSkillsManagement',
    component: NewSkillsManagement,
    decorators: [
        (Story) => {
            window.fetch = fn()
                .mockResolvedValue({
                    ok: true,
                    json: fn().mockResolvedValue([
                        { skillId: 1, name: "JavaScript", isPending: true },
                        { skillId: 2, name: "React", isPending: true },
                        { skillId: 3, name: "Java", isPending: false }
                    ])
                })

            return <Story />
        }
    ],
};

export const Default = {
    play: async ({ canvasElement }) => {
        // Wait for the fetch to complete
        await new Promise(r => setTimeout(() => r(), 100));

        const canvas = within(canvasElement);

        expect(canvas.getByText('JavaScript')).toBeInTheDocument();
        expect(canvas.getByText('React')).toBeInTheDocument();
        expect(canvas.queryByText('Java')).not.toBeInTheDocument();

        expect(canvas.getAllByText('Wijzigen')).toHaveLength(2);
        expect(canvas.getAllByText('Afwijzen')).toHaveLength(2);
        expect(canvas.getAllByText('Accepteren')).toHaveLength(2);

        expect(canvas.getByText(/2/)).toBeInTheDocument();

        expect(window.fetch).toHaveBeenCalledTimes(1);

        await userEvent.click(canvas.getAllByText('Accepteren')[0]);
        expect(window.fetch).toHaveBeenCalledTimes(3);

        await userEvent.click(canvas.getAllByText('Afwijzen')[0]);
        expect(window.fetch).toHaveBeenCalledTimes(5);
    }
}

export const EditSkill = {
    play: async ({ canvasElement }) => {
        // Wait for the fetch to complete
        await new Promise(r => setTimeout(() => r(), 100));

        const canvas = within(canvasElement);

        await userEvent.click(canvas.getAllByText('Wijzigen')[0]);
        await userEvent.type(canvas.getByDisplayValue('JavaScript'), ' gewijzigd');
        await userEvent.click(canvas.getByText('Opslaan'));

        expect(window.fetch).toHaveBeenCalledTimes(3);
    }
}

export const Empty = {
    decorators: [
        (Story) => {
            window.fetch = fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: fn().mockResolvedValueOnce([])
                })

            return <Story />
        }
    ],
    play: async ({ canvasElement }) => {
        // Wait for the fetch to complete
        await new Promise(r => setTimeout(() => r(), 100));

        const canvas = within(canvasElement);

        expect(canvas.getByText(/geen nieuwe skills/)).toBeInTheDocument();
    }
}
import { expect, within } from '@storybook/test';
import ProjectTasks from '../components/ProjectTasks';

export default {
    title: 'Components/ProjectTasks',
    component: ProjectTasks,
    args: {
        tasks: [
            {
                taskId: 1,
                title: 'Titel 1',
                description: 'Beschrijving van de taak',
                skills: [
                    { skillId: 1, name: 'Skill 1' },
                    { skillId: 2, name: 'Skill 2' },
                    { skillId: 3, name: 'Skill 3' },
                ],
                totalNeeded: 5,
                totalRegistered: 1,
            },
            {
                taskId: 2,
                title: 'Titel 2',
                description: 'Beschrijving van de taak 2',
                skills: [
                    { skillId: 4, name: 'Skill 4' },
                    { skillId: 5, name: 'Skill 5' },
                    { skillId: 6, name: 'Skill 6' },
                ],
                totalNeeded: 10,
                totalRegistered: 3,
            },
        ]
    },
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Titel 1')).toBeInTheDocument();
        expect(canvas.getByText('Titel 2')).toBeInTheDocument();
        expect(canvas.getAllByText(/Titel/)).toHaveLength(4);
    },
}

export const Empty = {
    args: {
        tasks: null,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(/geen taken/)).toBeInTheDocument();
    },
}
import { expect, userEvent, within } from 'storybook/test';
import ProjectCard from '../components/ProjectCard';

export default {
    title: 'Components/ProjectCard',
    component: ProjectCard,
    args: {
        project: {
            projectId: 1,
            title: 'Verfilming van een boek',
            projectLink: '/projects/1',
            image: '/image.png',
            tasks: [
                {
                    roleName: 'Videograaf',
                    skills: [
                        { id: 1, name: 'Camerabediening' },
                        { id: 2, name: 'Lichtbediening' },
                        { id: 3, name: 'Video editing' },
                        { id: 4, name: 'PHP' }
                    ]
                },
                {
                    roleName: 'Script schrijver',
                    skills: [
                        { id: 5, name: 'Story telling' },
                        { id: 6, name: 'Photoshop' },
                        { id: 7, name: 'Adobie Premiere' }
                    ]
                }
            ]
        }
    },
};

export const Default = {
    name: 'Default',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByRole('img')).toBeInTheDocument();
        expect(canvas.getAllByText('Verfilming van een boek')).toHaveLength(2);
        expect(canvas.getByRole('link')).toHaveAttribute('href', '/projects/1');
    }
}

export const Hover = {
    name: 'Hover',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.hover(canvas.getByRole('link'));

        expect(canvas.getByText('Camerabediening')).toBeInTheDocument();
        expect(canvas.getByText('Photoshop')).toBeInTheDocument();
    }
}
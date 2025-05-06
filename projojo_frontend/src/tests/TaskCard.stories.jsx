import { expect, within } from '@storybook/test';
import TaskCard from '../components/TaskCard';

export default {
    title: 'Components/TaskCard',
    component: TaskCard,
    args: {
        task: {
            taskId: 1,
            title: 'Fotograaf',
            skills: [
                { id: 1, name: 'Lightroom' },
                { id: 2, name: 'Adobe Premiere' },
                { id: 3, name: 'Photoshop' },
            ],
            totalNeeded: 5,
            totalAccepted: 2,
            totalRegistered: 1,
        }
    },
};

export const Default = {
    name: 'Default',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(/Fotograaf/)).toBeInTheDocument();
        expect(canvas.getByText(/3/)).toBeInTheDocument();
        expect(canvas.getByText(/5/)).toBeInTheDocument();
        expect(canvas.getByText(/1/)).toBeInTheDocument();
        expect(canvas.getByText('Lightroom')).toBeInTheDocument();
        expect(canvas.getByText('Adobe Premiere')).toBeInTheDocument();
        expect(canvas.getByText('Photoshop')).toBeInTheDocument();
    }
}

export const MoreSkills = {
    name: 'MoreSkills',
    args: {
        task: {
            taskId: 1,
            title: 'Fotograaf',
            skills: [
                { id: 1, name: 'Lightroom' },
                { id: 2, name: 'Adobe Premiere' },
                { id: 3, name: 'Photoshop' },
                { id: 4, name: 'Fotograferen' },
                { id: 5, name: 'Compositie' },
                { id: 6, name: 'PHP' },
                { id: 7, name: 'Management' },
            ],
            totalNeeded: 5,
            totalAccepted: 2,
            totalRegistered: 1,
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Lightroom')).toBeInTheDocument();
        expect(canvas.getByText('Adobe Premiere')).toBeInTheDocument();
        expect(canvas.getByText('Photoshop')).toBeInTheDocument();
        expect(canvas.getByText('Fotograferen')).toBeInTheDocument();
        expect(canvas.getByText('Compositie')).toBeInTheDocument();
        expect(canvas.getByText('PHP')).toBeInTheDocument();
        expect(canvas.getByText('Management')).toBeInTheDocument();
    }
}

export const NoSkills = {
    name: 'NoSkills',
    args: {
        task: {
            taskId: 1,
            title: 'Fotograaf',
            skills: [],
            totalNeeded: 5,
            totalAccepted: 2,
            totalRegistered: 1,
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Geen specifieke skills')).toBeInTheDocument();
    }
}
import { expect, within } from 'storybook/test';
import { Route, Routes } from 'react-router-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';

export default {
    title: 'Pages/ProjectDetailsPage',
    component: ProjectDetailsPage,
    decorators: [
        (Story) => {
            return (
                <Routes>
                    <Route path="/project/:projectId" element={<Story />} />
                </Routes>
            );
        },
    ],
};

export const Default = {
    parameters: {
        initialEntries: ['/project/1'],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getAllByText('Laden...')).toHaveLength(2);
    },
}

export const NegativeProjectId = {
    parameters: {
        initialEntries: ['/project/-1'],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('404')).toBeInTheDocument();
    },
}

export const TextAsProjectId = {
    parameters: {
        initialEntries: ['/project/abc'],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('404')).toBeInTheDocument();
    },
}
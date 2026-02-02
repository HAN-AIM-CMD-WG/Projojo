import { expect, within } from 'storybook/test';
import ProjectDetails from '../components/ProjectDetails';

export default {
    title: 'Components/ProjectDetails',
    component: ProjectDetails,
    args: {
        project: {
            "projectId": 3,
            "title": "Project titel",
            "description": "Project beschrijving. lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.",
            "business": {
                "businessId": 12,
                "name": "Organisatienaam",
                "description": "Deze organisatie is een organisatie die ...",
                "photo": "/image.png",
                "location": "Arnhem"
            },
            "photo": "/image.png",
            "projectTopSkills": [
                {
                    "skillId": 20,
                    "name": "adobe premiere pro"
                },
                {
                    "skillId": 21,
                    "name": "adobe photoshop"
                }
            ]
        },
    },
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Project titel')).toBeInTheDocument();
        expect(canvas.getByText(/Project beschrijving./)).toBeInTheDocument();
        expect(canvas.getByText('Organisatienaam')).toBeInTheDocument();
        expect(canvas.getByText('Arnhem')).toBeInTheDocument();
        expect(canvas.getByText(/2/)).toBeInTheDocument();
        expect(canvas.getByText('adobe premiere pro')).toBeInTheDocument();
        expect(canvas.getByText('adobe photoshop')).toBeInTheDocument();

        canvas.getAllByRole('img').forEach(img => {
            expect(img).toHaveAttribute('alt');
        });
    }
}

export const Loading = {
    args: {
        project: null,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getAllByText('Laden...')).toHaveLength(2);

        canvas.getAllByRole('img').forEach(img => {
            expect(img).toHaveAttribute('alt');
        });
    }
}
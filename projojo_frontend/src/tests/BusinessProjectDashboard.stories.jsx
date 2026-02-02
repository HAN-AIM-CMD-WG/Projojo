import { expect, within } from 'storybook/test';
import BusinessProjectDashboard from '../components/BusinessProjectDashboard';

export default {
    title: 'Components/BusinessProjectDashboard',
    component: BusinessProjectDashboard,
};

export const Default = {
    name: 'Default',
    args: {
        business: {
            name: 'Gemeente Arnhem',
            location: 'Arnhem',
            imagePath: '/image.png',
            businessId: 1
        },
        projects: [
            {
                title: 'Verfilming van een boek',
                image: {
                    path: '/image.png',
                },
                projectLink: '/project/1',
                tasks: [
                    {
                        name: 'Videograaf',
                        skills: [
                            { id: 1, name: 'Camerabediening' },
                            { id: 2, name: 'Lichtbediening' },
                            { id: 3, name: 'Geluidsopname' }
                        ]
                    },
                    {
                        name: 'Regisseur',
                        skills: [
                            { id: 1, name: 'Management' },
                            { id: 2, name: 'Aansturing' }
                        ]
                    },
                    {
                        name: 'Acteur',
                        skills: [
                            { id: 1, name: 'Acteren' },
                            { id: 2, name: 'Creativiteit' }
                        ]
                    }
                ]
            },
            {
                title: 'Aftermovie bijeenkomst',
                image: {
                    path: '/image.png',
                },
                projectLink: '/project/2',
                tasks: [
                    {
                        name: 'Videograaf',
                        skills: [
                            { id: 1, name: 'Adobe Premiere' },
                            { id: 2, name: 'Camerabediening' },
                            { id: 3, name: 'Lichtbediening' }
                        ]
                    },
                    {
                        name: 'Editor',
                        skills: [
                            { id: 1, name: 'Adobe Premiere' },
                            { id: 2, name: 'Color Grading' }
                        ]
                    }
                ]
            }
        ],
        topSkills: [
            { id: 1, name: 'Adobe Premiere' },
            { id: 2, name: 'Camerabediening' }
        ]
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Gemeente Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Top 2 skills in deze organisatie:')).toBeInTheDocument();
        expect(canvas.getAllByText('Verfilming van een boek')).toHaveLength(2);
        expect(canvas.getAllByText('Aftermovie bijeenkomst')).toHaveLength(2);
        const images = canvas.getAllByRole('img');
        expect(images).toHaveLength(3);
    }
};
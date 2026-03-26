import { expect, within } from 'storybook/test';
import DashboardsOverview from '../components/DashboardsOverview';

export default {
    title: 'Components/DashboardsOverview',
    component: DashboardsOverview,
};

export const Default = {
    name: 'Default',
    args: {
        businesses: [
            {
                business: {
                    businessId: 1,
                    name: 'Gemeente Arnhem',
                    location: 'Arnhem',
                    imagePath: '/image.png',
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
                                    { id: 4, name: 'Management' },
                                    { id: 5, name: 'Aansturing' }
                                ]
                            }
                        ]
                    }
                ],
                topSkills: [
                    { id: 1, name: 'Camerabediening' },
                    { id: 5, name: 'Aansturing' }
                ]
            },
            {
                business: {
                    businessId: 1,
                    name: 'Gemeente Nijmegen',
                    location: 'Nijmegen',
                    imagePath: '/image.png',
                },
                projects: [
                    {
                        title: 'Reserveringen applicatie',
                        image: {
                            path: '/image.png',
                        },
                        projectLink: '/project/2',
                        tasks: [
                            {
                                name: 'Front-End Developer',
                                skills: [
                                    { id: 6, name: 'React' },
                                    { id: 7, name: 'PHP' },
                                    { id: 8, name: 'Tailwind' },
                                    { id: 9, name: 'Design' }
                                ]
                            },
                            {
                                name: 'Back-End Developer',
                                skills: [
                                    { id: 10, name: 'Java' },
                                    { id: 11, name: 'Springboot' }
                                ]
                            }
                        ]
                    },
                    {
                        title: 'Ontwerp voor vergaderruimte',
                        image: {
                            path: '/image.png',
                        },
                        projectLink: '/project/3',
                        tasks: [
                            {
                                name: 'Ontwerper',
                                skills: [
                                    { id: 12, name: 'Tekenen' },
                                    { id: 13, name: 'Design' }
                                ]
                            }
                        ]
                    }
                ],
                topSkills: [
                    { id: 9, name: 'Design' }
                ]
            }
        ]
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Gemeente Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Gemeente Nijmegen')).toBeInTheDocument();
        expect(canvas.getByText('Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Nijmegen')).toBeInTheDocument();
        expect(canvas.getAllByText('Verfilming van een boek')).toHaveLength(2);
        expect(canvas.getAllByText('Reserveringen applicatie')).toHaveLength(2);
        expect(canvas.getAllByText('Ontwerp voor vergaderruimte')).toHaveLength(2);
        expect(canvas.getByText('Top 2 skills in deze organisatie:')).toBeInTheDocument();
        expect(canvas.getByText('Top 1 skills in deze organisatie:')).toBeInTheDocument();
        const images = canvas.getAllByRole('img');
        expect(images).toHaveLength(5);
    }
};

export const OneBusiness = {
    name: 'OneBusiness',
    args: {
        businesses: Default.args.businesses.slice(0, 1)
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Gemeente Arnhem')).toBeInTheDocument();
        expect(canvas.getByText('Arnhem')).toBeInTheDocument();
        expect(canvas.getAllByText('Verfilming van een boek')).toHaveLength(2);
        expect(canvas.getByText('Top 2 skills in deze organisatie:')).toBeInTheDocument();
        const images = canvas.getAllByRole('img');
        expect(images).toHaveLength(2);
    }
};
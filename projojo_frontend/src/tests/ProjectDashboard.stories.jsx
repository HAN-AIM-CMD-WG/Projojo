import { expect, userEvent, within } from 'storybook/test';
import ProjectDashboard from '../components/ProjectDashboard';

export default {
    title: 'Components/ProjectDashboard',
    component: ProjectDashboard,
};

export const Default = {
    name: 'Default',
    args: {
        projects: [
            {
                title: 'Nieuwe uitgave van een boek',
                image: {
                    path: '/image.png',
                },
                projectLink: '/projects/1',
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
                        name: "Regisseur",
                        skills: [
                            { id: 1, name: 'Management' },
                            { id: 2, name: 'Aansturing' },
                            { id: 3, name: 'Storytelling' }
                        ]
                    },
                ]
            },
            {
                title: 'Verfilming van een boek',
                projectLink: '/projects/2',
                image: {
                    path: '/image.png',
                },
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
                            { id: 1, name: 'Story telling' },
                            { id: 2, name: 'Photoshop' },
                            { id: 3, name: 'Adobie Premiere' }
                        ]
                    }
                ]
            },
            {
                title: 'Aftermovie bijeenkomst',
                image: {
                    path: '/image.png',
                },
                projectLink: '/projects/3',
                tasks: [
                    {
                        name: 'Videograaf',
                        skills: [
                            { id: 1, name: 'Schrijven' },
                            { id: 2, name: 'PHP' },
                            { id: 3, name: 'React' }
                        ]
                    },
                    {
                        name: 'Programmeur',
                        skills: [
                            { id: 1, name: 'React' },
                            { id: 2, name: 'Tailwind' },
                            { id: 3, name: 'Bootstrap' },
                            { id: 4, name: 'PHP' }
                        ]
                    }
                ]
            },
            {
                title: 'App voor reserveringen',
                image: {
                    path: '/image.png',
                },
                projectLink: '/projects/4',
                tasks: [
                    {
                        name: 'Front-End Developer',
                        skills: [
                            { id: 1, name: 'Tailwind' },
                            { id: 2, name: 'PHP' },
                            { id: 3, name: 'React' }
                        ]
                    },
                    {
                        name: 'Back-End Developer',
                        skills: [
                            { id: 1, name: 'Java' },
                            { id: 2, name: 'Springboot' },
                            { id: 3, name: 'Testen' }
                        ]
                    }
                ]
            }
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = canvas.getByRole('button');

        const startingState = canvas.getAllByRole('heading');
        await expect(startingState).toHaveLength(3);
        await expect(button).toHaveTextContent('Bekijk meer');
        await userEvent.click(button);
        const expandedState = canvas.getAllByRole('heading');
        await expect(expandedState).toHaveLength(4);
        await expect(button).toHaveTextContent('Bekijk minder');
        await userEvent.click(button);
        const collapsedState = canvas.getAllByRole('heading');
        await expect(collapsedState).toHaveLength(3);
        await expect(button).toHaveTextContent('Bekijk meer');
    }
};


export const TwoProjects = {
    name: 'TwoProjects',
    args: {
        projects: Default.args.projects.slice(0, 2)
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const projectsShown = canvas.getAllByRole('heading');
        await expect(projectsShown).toHaveLength(2);
        const button = canvas.queryByRole('button');
        await expect(button).not.toBeInTheDocument();
    }
};
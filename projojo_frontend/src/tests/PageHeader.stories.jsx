import { expect, within } from '@storybook/test';
import PageHeader from '../components/PageHeader';

export default {
    title: 'Components/PageHeader',
    component: PageHeader,
    args: {
        name: "Test"
    }
};

export const Default = {
    name: 'Default',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const title = canvas.getByText("Test");

        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('text-primary text-4xl font-bold mb-4');

    }
}
import { expect, within } from '@storybook/test';
import InfoBox from '../components/InfoBox';

export default {
    title: 'Components/InfoBox',
    component: InfoBox,
    args: {
        children: 'Hier staat informatie',
    },
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Hier staat informatie')).toBeInTheDocument();
    },
}
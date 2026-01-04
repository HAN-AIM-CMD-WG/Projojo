import { expect, within } from 'storybook/test';
import Tooltip from '../components/Tooltip';

export default {
    title: 'Components/Tooltip',
    component: Tooltip,
    args: {
        children: 'test',
    },
}

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('test')).toBeInTheDocument();
    }
}

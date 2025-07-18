import { expect, within } from 'storybook/test';
import Alert from '../components/Alert';

export default {
    title: 'Components/Alert',
    component: Alert,
    args: {
        text: 'Error message',
        isCloseable: true,
    }
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Error message')).toBeInTheDocument();
        expect(canvas.getByRole('button')).toBeInTheDocument();
    },
}

export const WithoutCloseButton = {
    args: {
        isCloseable: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Error message')).toBeInTheDocument();
        expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    },
}

export const WithoutText = {
    args: {
        text: '',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.queryByText('Error message')).not.toBeInTheDocument();
    },
}

export const CloseAlert = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Error message')).toBeInTheDocument();

        const closeButton = canvas.getByRole('button');
        await closeButton.click();
        expect(canvas.queryByText('Error message')).not.toBeInTheDocument();
    },
}
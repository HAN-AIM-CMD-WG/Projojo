import { expect, fn, userEvent, within } from '@storybook/test';
import Modal from '../components/Modal';

const setIsModalOpen = fn();

export default {
    title: 'Components/Modal',
    component: Modal,
    args: {
        modalHeader: 'Test',
        isModalOpen: true,
        setIsModalOpen: setIsModalOpen,
    },
};

export const Default = {
    name: "Default",
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = canvas.getByRole('button');

        expect(canvas.getByText("Test")).toBeInTheDocument()
        expect(button).toBeInTheDocument();
        await userEvent.click(button);
        expect(setIsModalOpen).toHaveBeenCalledWith(false);
    }
};

export const WithChildren = {
    args: {
        modalHeader: 'Test',
        isModalOpen: true,
        setIsModalOpen: setIsModalOpen,
        children: (
            <span>Test body</span>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText("Test body")).toBeInTheDocument();
    }
};
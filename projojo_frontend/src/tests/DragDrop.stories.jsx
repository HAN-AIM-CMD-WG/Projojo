import { expect, userEvent, within } from 'storybook/test';
import DragDrop from '../components/DragDrop';

export default {
    title: 'Components/DragDrop',
    component: DragDrop,
};

export const FileUpload = {
    args: {
        multiple: false,
        name: "name",
        accept: "image/*",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const fileInput = canvas.getByTestId("fileinput");
        expect(fileInput).toBeInTheDocument();

        const file = new File([`
            <svg height="100" width="100" xmlns="http://www.w3.org/2000/svg">
                <circle r="45" cx="50" cy="50" fill="red" />
            </svg>`], "test.svg", { type: "image/svg+xml" }
        );
        await userEvent.upload(fileInput, file);

        expect(fileInput.files[0]).toBe(file);
    }
};
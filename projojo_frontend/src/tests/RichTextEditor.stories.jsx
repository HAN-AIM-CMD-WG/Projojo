import { expect, fn, userEvent, within } from 'storybook/test';
import 'tailwindcss/tailwind.css';
import RichTextEditor from '../components/RichTextEditor';

export default {
    component: RichTextEditor,
    decorators: [
        (Story) => (
            <div className="max-w-[600px]">
                <Story />
            </div>
        )
    ]
};

// spy functions
const onSave = fn(() => 0);

export const InputBaseCase = {
    args: {
        onSave,
        defaultText: "",
        label: "Beschrijving",
        max: 100
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        await new Promise((resolve) => setTimeout(resolve, 100));

        const projectDescription = canvas.getByLabelText(/Beschrijving/i);
        await userEvent.type(projectDescription, 'Hallo');
        const heading1 = canvas.getByLabelText(/Heading 1/i);
        await userEvent.click(heading1);

        expect(canvas.getByRole('heading', { name: "Hallo" })).toBeInTheDocument();
        expect(canvas.getByRole('heading', { name: "Hallo" }).tagName).toBe("H1");
    }
}

export const InputTextTooLong = {
    args: InputBaseCase.args,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        await new Promise((resolve) => setTimeout(resolve, 100));

        const projectDescription = canvas.getByLabelText(/Beschrijving/i);
        await userEvent.type(projectDescription, 'a'.repeat(101));

        
    }
}
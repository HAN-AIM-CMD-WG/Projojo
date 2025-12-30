import { expect, fn, within } from 'storybook/test';
import UpdateStudentPage from '../pages/update_student_page/update_student_page';

export default {
    title: 'Pages/UpdateStudentPage',
    component: UpdateStudentPage,
};

export const Fetch = {
    decorators: [
        (Story) => {
            window.fetch = fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: fn().mockResolvedValueOnce({ username: "student", description: "ik wil mij aanmelden want" })
                });

            return <Story />
        }
    ],
    args: {},
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const form = canvas.getByTestId("update_student_page");
        expect(form).toBeInTheDocument();

        await new Promise(r => setTimeout(() => r(), 500));

        expect(new FormData(form).get("username")).toBe("student");
    }
}

export const FetchFailed = {
    decorators: [
        (Story) => {
            window.fetch = fn()
                .mockResolvedValue({
                    ok: false,
                    status: 401,
                    text: fn().mockResolvedValue("test")
                });

            return <Story />
        }
    ],
    args: {},
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const form = canvas.getByTestId("update_student_page");
        expect(form).toBeInTheDocument();

        const error = await canvas.findByText(/Je bent niet ingelogd/);
        expect(error).toBeInTheDocument();
    }
}
import CreateBusinessEmail from "../components/CreateBusinessEmail";
import { useAuth } from "../auth/AuthProvider";
import { within, fn, expect, userEvent } from "storybook/test";


export default {
    title: 'Components/CreateBusinessEmail',
    component: CreateBusinessEmail,
    args: {
        dontSetLocation: true,
    },
};


export const CreateEmailModalOpen = {
    args: {
        showUpdateButton: true,
        businessId: 1,
    },
    decorators: [
        (Story) => {
            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "supervisor", userId: 1, businessId: 1, profilePicture: { path: "" } });

                return <Story />;
            };

            return <Wrapper />
        }
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = await canvas.findByTestId("open-create-mail-button");

        await userEvent.click(button);

        const elementWithinModal = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        expect(elementWithinModal).toBeVisible();
    }
}

export const MockMailGeneration = {
    args: {
        showUpdateButton: true,
        businessId: 1,
        dontSetLocation: true,
    },
    decorators: [
        (Story) => {
            window.fetch = fn().mockResolvedValueOnce({
                ok: true,
                json: fn().mockResolvedValue(["a", "b"]),
            });

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "supervisor", userId: 1, businessId: 1, profilePicture: { path: "" } });

                return <Story />;
            };

            return <Wrapper />;
        }
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = await canvas.findByTestId("open-create-mail-button");

        await userEvent.click(button);

        const subjectInput = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        await expect(subjectInput).toBeVisible();

        await userEvent.type(subjectInput, "subject");

        const radioButton = subjectInput.form.getElementsByTagName("input")[0];
        await userEvent.click(radioButton);

        const submitButton = subjectInput.form.getElementsByTagName("button")[0];
        await userEvent.click(submitButton);

        const subjectInput2 = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        await expect(subjectInput2).not.toBeVisible();

        expect(window.fetch).toBeCalled();
    }
}

export const MockMailGenerationEmptyEmails = {
    args: {
        showUpdateButton: true,
        businessId: 1,
        dontSetLocation: true,
    },
    decorators: [
        (Story) => {
            window.fetch = fn().mockResolvedValueOnce({
                ok: true,
                json: fn().mockResolvedValue([]),
            })

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "supervisor", userId: 1, businessId: 1, profilePicture: { path: "" } });

                return <Story />;
            };

            return <Wrapper />
        }
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = await canvas.findByTestId("open-create-mail-button");

        await userEvent.click(button);

        const subjectInput = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        await expect(subjectInput).toBeVisible();

        await userEvent.type(subjectInput, "subject");

        const radioButton = subjectInput.form.getElementsByTagName("input")[0];
        await userEvent.click(radioButton);

        const submitButton = subjectInput.form.getElementsByTagName("button")[0];
        await userEvent.click(submitButton);

        const noEmailsFound = await canvas.findByText("Geen e-mailadressen gevonden.");
        expect(noEmailsFound).toBeInTheDocument();

        const subjectInput2 = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        await expect(subjectInput2).toBeVisible();

        expect(window.fetch).toBeCalled();
    }
}

export const MockMailGenerationError = {
    args: {
        showUpdateButton: true,
        businessId: 1,
        dontSetLocation: true,
    },
    decorators: [
        (Story) => {
            window.fetch = fn().mockResolvedValue({
                ok: false,
                status: 404,
                text: fn().mockResolvedValue(),
            })

            const Wrapper = () => {
                const { setAuthData } = useAuth();

                // Ensure auth data is set before rendering the story
                setAuthData({ type: "supervisor", userId: 1, businessId: 1, profilePicture: { path: "" } });

                return <Story />;
            };

            return <Wrapper />
        }
    ],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const button = await canvas.findByTestId("open-create-mail-button");

        await userEvent.click(button);

        const subjectInput = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });

        await expect(subjectInput).toBeVisible();

        await userEvent.type(subjectInput, "subject");

        const radioButton = subjectInput.form.getElementsByTagName("input")[0];
        await userEvent.click(radioButton);

        const submitButton = subjectInput.form.getElementsByTagName("button")[0];
        await userEvent.click(submitButton);

        const subjectInput2 = await canvas.findByLabelText("Onderwerp *", undefined, { timeout: 250 });
        await expect(subjectInput2).toBeVisible();

        const error = await canvas.findByText("De url waar naar gezocht wordt kan niet gevonden worden.");
        await expect(error).toBeInTheDocument();

        expect(window.fetch).toBeCalled();
    }
}


import { expect, fn, userEvent, within } from 'storybook/test';
import AddProjectForm from '../components/AddProjectForm';

export default {
    title: 'Components/AddProjectForm',
    component: AddProjectForm,
};

// spy functions
const onSubmit = fn();

export const FormSuccess = {
    args: {
        onSubmit,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // get elements and put in example data
        const projectName = canvas.getByLabelText(/Titel/);
        await userEvent.type(projectName, 'Design maken voor de opdrachtenbox');
        const projectDescription = canvas.getByLabelText(/Beschrijving/i);
        await userEvent.type(projectDescription, 'Die website heeft echt een beter design nodig.');
        const projectImage = canvas.getByTestId('fileinput');
        await userEvent.upload(projectImage, new File(['(⌐□_□)'], 'foto.png', { type: 'image/png' }));

        // get the submit button within the form
        const submitButton = canvas.getByRole('button', { name: /Opslaan/i });
        await userEvent.click(submitButton);

        await expect(onSubmit).toHaveBeenCalledTimes(1);
    }
}

export const FormNotFilledIn = {
    args: {
        onSubmit,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // get the form element
        const form = canvas.getByRole('form', { name: /Project aanmaken form/i });
        const formWithin = within(form);

        // get the submit button within the form
        const submitButton = formWithin.getByRole('button', { name: /Opslaan/i });
        await userEvent.click(submitButton);

        expect(onSubmit).not.toHaveBeenCalled();
    }
}

export const FormServerError = {
    args: {
        onSubmit,
        serverErrorMessage: 'Er is iets misgegaan. Probeer het later opnieuw.'
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // get elements and put in example data
        const projectName = canvas.getByLabelText(/Titel/);
        await userEvent.type(projectName, 'Design maken voor de opdrachtenbox');
        const projectDescription = canvas.getByLabelText(/Beschrijving/i);
        await userEvent.type(projectDescription, 'Die website heeft echt een beter design nodig.');
        const projectImage = canvas.getByTestId('fileinput');
        await userEvent.upload(projectImage, new File(['(⌐□_□)'], 'foto.png', { type: 'image/png' }));

        // get the form element
        const form = canvas.getByRole('form', { name: /Project aanmaken form/i });
        const formWithin = within(form);

        // get the submit button within the form
        const submitButton = formWithin.getByRole('button', { name: /Opslaan/i });
        await userEvent.click(submitButton);

        expect(onSubmit).toHaveBeenCalledTimes(1);

        expect(canvas.getByText('Er is iets misgegaan. Probeer het later opnieuw.')).toBeInTheDocument();
    }
}

export const FormTextTooLong = {
    args: {
        onSubmit,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // get elements and put in example data
        const projectName = canvas.getByLabelText(/Titel/);
        await userEvent.type(projectName, 'a'.repeat(51));
        const projectImage = canvas.getByTestId('fileinput');
        await userEvent.upload(projectImage, new File(['(⌐□_□)'], 'foto.png', { type: 'image/png' }));

        // get the form element
        const form = canvas.getByRole('form', { name: /Project aanmaken form/i });
        const formWithin = within(form);

        // get the submit button within the form
        const submitButton = formWithin.getByRole('button', { name: /Opslaan/i });
        await userEvent.click(submitButton);

        expect(onSubmit).toHaveBeenCalled();

        expect(projectName.value.length).toBe(50);
    }
}
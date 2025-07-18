import { expect, fn, userEvent, within } from "storybook/test";
import FormInput from '../components/FormInput';

const formLabelText = "Form Label";

const onErrorMock = fn()

export default {
    title: "Components/FormInput",
    component: FormInput,
    args: {
        label: formLabelText,
        error: "",
        onError: onErrorMock,
    }
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.type(inputElement, "mijn waarde");
        expect(inputElement).toHaveValue("mijn waarde");
    }
};

export const InputTooLong = {
    args: {
        max: 5,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.type(inputElement, "mijn waarde");
        expect(inputElement).toHaveValue("mijn ");
    }
};

export const InputExceedsMax = {
    args: {
        max: 80000,
        type: "number",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.type(inputElement, "100000");
        expect(inputElement).toHaveValue(100000);
    }
};

export const InputHasIncorrectStep = {
    args: {
        step: 0.01,
        type: "number",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.type(inputElement, "0.005");
    }
};

export const IncorrectMin = {
    args: {
        min: 5,
        type: "number",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.type(inputElement, "2");
        expect(inputElement).toHaveValue(2);
    }
}

export const Checkbox = {
    args: {
        type: "checkbox",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);

        await userEvent.click(inputElement);
        expect(inputElement).toBeChecked();
    }
}

export const RadioButton = {
    render: (args) => {
        return <form><FormInput {...{ ...args, initialValue: "1" }} /><FormInput {...{ ...args, label: formLabelText + "2", name: formLabelText.toLowerCase(), initialValue: "2" }} /></form>
    },
    args: {
        type: "radio",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const inputElement = await canvas.findByLabelText(formLabelText);
        const inputElement2 = await canvas.findByLabelText(formLabelText + "2");

        const form = inputElement.form;

        const formData = new FormData(form);
        const value = formData.get(formLabelText.toLowerCase());

        expect(value).toBe(null);

        await userEvent.click(inputElement);

        const formData2 = new FormData(form);
        const value2 = formData2.get(formLabelText.toLowerCase());

        expect(value2).toBe("1");

        await userEvent.click(inputElement2);

        const formData3 = new FormData(form);
        const value3 = formData3.get(formLabelText.toLowerCase());

        expect(value3).toBe("2");
    }
}

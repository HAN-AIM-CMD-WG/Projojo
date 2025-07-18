import { expect, within } from 'storybook/test';
import Card from '../components/Card';

export default {
    component: Card,
};

export const WithChildren = {
    title: "Components/Card",
    args: {
        header: "header",
        children: (<p>test child</p>)
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText("test child")).toBeInTheDocument();
        expect(canvas.getByText("header")).toBeInTheDocument();
    }
};

export const CenteredChildren = {
    args: {
        header: "my card",
        children: (<p>centered child</p>),
        className: "flex justify-center"
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText("centered child")).toBeInTheDocument();
        expect(canvas.getByText("my card")).toBeInTheDocument();

        expect(canvas.getByText("centered child").parentElement).toHaveClass("flex", "justify-center");
    }
};
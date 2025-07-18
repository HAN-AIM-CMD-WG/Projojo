import { expect, within } from 'storybook/test';
import Loading from '../components/Loading';

export default {
    title: 'Components/Loading',
    component: Loading,
    args: {
        size: "1.5rem",
    },
};

export const Primary = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const loadingSvg = canvas.getByTestId("loading-svg");

        expect(loadingSvg).toBeInTheDocument();
        expect(loadingSvg).toHaveClass("animate-spin");
    }
};

export const ValidateSize = {
    args: {
        size: "50px",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const loadingSvg = canvas.getByTestId("loading-svg");

        expect(loadingSvg).toBeInTheDocument();
        expect(loadingSvg).toHaveClass("animate-spin");

        expect(loadingSvg).toHaveAttribute("width", "50px");
        expect(loadingSvg).toHaveAttribute("height", "50px");
    }
}
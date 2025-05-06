import { expect, within } from '@storybook/test';
import Page from '../components/paged_component/page';

export default {
    title: 'Components/Page',
    component: Page,
};

export const EmptyPage = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByTestId("page")).toBeInTheDocument();
    }
}

export const FilledPage = {
    args: {
        children:
            <div data-testid="child">
                <p>my child page</p>
            </div>
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByTestId("page")).toBeInTheDocument();

        expect(canvas.getByTestId("child")).toBeInTheDocument();
        expect(canvas.getByTestId("child")).toContainHTML("my child page");
    }
}

export const HiddenPage = {
    args: {
        children:
            <div data-testid="child">
                <p>hidden page</p>
            </div>,
        hidden: true
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByTestId("page")).toBeInTheDocument();
        expect(canvas.getByTestId("page")).toHaveAttribute("hidden");
        expect(canvas.getByTestId("page")).toHaveClass("hidden");

        expect(canvas.getByTestId("child")).toBeInTheDocument();
        expect(canvas.getByTestId("child")).toContainHTML("hidden page");
    }
}
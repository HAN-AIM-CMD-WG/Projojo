import { expect, fn, userEvent, within } from 'storybook/test';
import Card from '../components/Card';
import Page from '../components/paged_component/page';
import PagedComponent from '../components/paged_component/paged_component';

const submitFunction = fn(event => { event.preventDefault(); return event; });

export default {
    title: 'Components/PagedComponent',
    component: PagedComponent,
    decorators: [
        (Story) => {
            return (
                <form onSubmit={submitFunction}>
                    <Card header={"my header"} className={"px-12 py-12"}>
                        <Story />
                    </Card>
                </form>
            );
        },
    ],
};

export const NoPages = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const component = await canvas.findByText(/Geen pagina's/);

        expect(component).toBeInTheDocument();
    }
}

export const OnePages = {
    args: {
        children:
            <Page className={"mb-6"}>
                <div>my page component</div>
            </Page>,
        finishButtonText: "End",
        finishButtonClass: "btn-primary",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const component = await canvas.findByText(/my page component/);

        expect(component).toBeInTheDocument();

        const endButton = await canvas.findByText(/End/);
        expect(endButton).toBeInTheDocument();
        expect(endButton).toHaveClass("btn-primary");
        expect(endButton).toHaveAttribute("type", "submit");

        await userEvent.click(endButton);
        expect(submitFunction).toBeCalled();
        expect(submitFunction).toBeCalledTimes(1);
    }
}

export const MultiPage = {
    args: {
        children:
            <>
                <Page className={"mb-6"}>
                    <div>my first page</div>
                </Page>
                <Page className={"mb-6"}>
                    <div>my second page</div>
                </Page>
            </>,
        finishButtonText: "End",
        finishButtonClass: "btn-primary",
        nextButtonText: "Next",
        nextButtonClass: "btn-secondary",
        previousButtonText: "Previous",
        previousButtonClass: "btn-secondary",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const text = await canvas.findByText(/my first page/);
        expect(text).toBeVisible();

        const nextButton = await canvas.findByText(/Next/);
        expect(nextButton).toBeInTheDocument();
        expect(nextButton).toHaveClass("btn-secondary");
        expect(nextButton).toHaveAttribute("type", "button");

        await userEvent.click(nextButton, { delay: 100 });

        expect(text).not.toBeVisible();

        const text2 = await canvas.findByText(/my second page/);
        expect(text2).toBeVisible();

        const previousButton = await canvas.findByText(/Previous/);
        expect(previousButton).toBeInTheDocument();
        expect(previousButton).toHaveClass("btn-secondary");
        expect(previousButton).toHaveAttribute("type", "button");

        const endButton = await canvas.findByText(/End/);
        expect(endButton).toBeInTheDocument();
        expect(endButton).toHaveClass("btn-primary");
        expect(endButton).toHaveAttribute("type", "submit");

        await userEvent.click(endButton);
        expect(submitFunction).toBeCalled();
        expect(submitFunction).toBeCalledTimes(1);

        await userEvent.click(previousButton, { delay: 100 });

        expect(text2).not.toBeVisible();

        const text3 = await canvas.findByText(/my first page/);
        expect(text3).toBeVisible();
    }
}
import { expect, within } from '@storybook/test';
import SkillBadge from '../components/SkillBadge';

export default {
    title: 'Components/SkillBadge',
    component: SkillBadge,
    args: {
        skillName: 'photoshop',
        isPending: false,
    },
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('photoshop')).toBeInTheDocument();
    }
}

export const WithChildren = {
    args: {
        children: '+',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(/photoshop/)).toBeInTheDocument();
        expect(canvas.getByText(/\+/)).toBeInTheDocument();
    }
}

export const Pending = {
    args: {
        isPending: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('photoshop')).toBeInTheDocument();
        expect(canvas.getByText('In afwachting van goedkeuring')).toBeInTheDocument();
    }
}
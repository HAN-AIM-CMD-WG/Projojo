import { expect, userEvent, fn, within } from '@storybook/test';
import Filter from '../components/Filter';

const onFilterMock = fn();

export default {
    title: 'Components/Filter',
    component: Filter,
    args: {
        onFilter: onFilterMock
    }
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const filterButton = canvas.getByText('Filter op skills');
        const searchInput = canvas.getByPlaceholderText('Zoek op bedrijfs- of projectnaam');
        expect(filterButton).toBeInTheDocument();
        expect(searchInput).toBeInTheDocument();
    }
};

export const SearchInput = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByPlaceholderText('Zoek op bedrijfs- of projectnaam');
        await userEvent.type(searchInput, 'HAN');
        const searchButton = canvas.getByLabelText('Zoeken op bedrijfs- of projectnaam');
        await userEvent.click(searchButton);
        expect(searchInput).toHaveValue('HAN');
        expect(onFilterMock).toHaveBeenCalledWith({
            searchInput: 'HAN',
            selectedSkills: []
        });
    }
};

export const ClearSearchInput = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const searchInput = canvas.getByPlaceholderText('Zoek op bedrijfs- of projectnaam');
        await userEvent.type(searchInput, 'HAN');
        const deleteButton = canvas.getByLabelText('Wis zoekopdracht');
        expect(deleteButton).toBeInTheDocument();
        await userEvent.click(deleteButton);
        expect(searchInput).toHaveValue('');
        expect(deleteButton).not.toBeInTheDocument();
        expect(onFilterMock).toHaveBeenCalledWith({
            searchInput: '',
            selectedSkills: []
        });
    }
};

export const ShowSkillsFilter = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const filterButton = canvas.getByText('Filter op skills');
        await userEvent.click(filterButton);
        const saveButton = canvas.getByText('Opslaan');
        expect(saveButton).toBeInTheDocument();
    }
};
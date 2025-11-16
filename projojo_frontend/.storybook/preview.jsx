import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthProvider';
import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <MemoryRouter initialEntries={context.parameters.initialEntries}>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default preview;

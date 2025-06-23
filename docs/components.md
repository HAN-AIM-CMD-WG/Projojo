# Component Library Documentation

This document serves as an index to all available components in the Projojo frontend application.

## Components

### [OneButtonForm](../projojo_frontend/src/components/OneButtonForm.jsx)

A stateful form container with intelligent button behavior that automatically manages form state and provides seamless submit/reset functionality with a single dynamic button. The component tracks form state (pristine, dirty, submitted) and adapts its button function accordingly, automatically injecting value and onChange props into child form elements.

```jsx
import OneButtonForm from '@/components/OneButtonForm';

const MyComponent = () => {
  const handleSave = (formData) => {
    console.log('Form submitted:', formData);
    // API call or state update logic here
  };
  
  return (
    <OneButtonForm
      initialState={{ name: '', email: '', message: '' }}
      onAction={handleSave}
      actionLabel="Save Changes"
      resetLabel="Cancel Changes"
      className="space-y-4 p-4 border rounded"
      buttonClassName="w-full mt-4"
    >
      <input name="name" placeholder="Name" className="w-full p-2 border rounded" />
      <input name="email" placeholder="Email" className="w-full p-2 border rounded" />
      <textarea name="message" placeholder="Message" className="w-full p-2 border rounded h-20" />
    </OneButtonForm>
  );
};
```

---

### [SearchField](../projojo_frontend/src/components/ui/SearchField.tsx)

A reusable search input component with intelligent button behavior that provides visual feedback and seamless search/clear functionality. The button dynamically switches between search and clear icons based on user interaction, offering an intuitive search experience with proper state management.

```tsx
import SearchField from '@/components/ui/SearchField';

const MyComponent = () => {
  const handleSearch = (searchTerm) => {
    console.log('Search term:', searchTerm);
  };
  
  return (
    <SearchField
      handleSearch={handleSearch}
      placeholder="Search items..."
      className="w-full"
    />
  );
};
```

---

## Documentation Rules

When adding new components to this documentation:

1. **Component Name**: Use the component name as a heading (H3) and link it to the relative path of the component file
2. **Description**: Provide a clear, comprehensive description explaining what the component does and its key features
3. **Code Example**: Include a complete, working code snippet that demonstrates:
   - How to import the component
   - Typical usage with props
   - Basic integration with other code (state management, event handlers, etc.)
   - Multiple props when applicable
4. **File Format**: Components can be in `.tsx`, `.ts`, `.jsx`, or `.js` files
5. **Relative Links**: All file links should be relative to this documentation file
6. **Alphabetical Order**: Components should be listed alphabetically within their sections
7. **Complete Examples**: Code examples should be copy-paste ready and show real-world usage patterns

*Last updated: June 18, 2025*
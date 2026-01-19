# Quality Attributes

## Accessibility

Projojo prioritizes accessibility as a core quality attribute:

### WCAG Compliance

- **Skip Links**: "Ga naar hoofdinhoud" (Skip to main content) for keyboard navigation (WCAG 2.4.1)
- **Focus Management**: Visible focus indicators on all interactive elements
- **Keyboard Navigation**: Full keyboard support throughout the application
- **Semantic HTML**: Proper use of landmarks, headings, and ARIA attributes

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  :root {
    --neuro-dark: #999999;
    --text-primary: #000000;
  }
}
```

## Usability

### Design System

The neumorphic design system prioritizes:

- **Functional Beauty**: Aesthetics support functionality
- **Consistent Interaction**: Predictable hover/focus/active states
- **Clear Hierarchy**: Visual distinction between elements

### Internationalization

- Primary language: Dutch (nl-NL)
- Error messages in Dutch
- UI labels in Dutch

## Performance

### Frontend

- **Vite Build**: Fast HMR and optimized production builds
- **Code Splitting**: React Router enables route-based splitting
- **Optimized Animations**: 60fps target with CSS transitions

### Backend

- **Async Processing**: FastAPI with async/await patterns
- **Connection Pooling**: TypeDB connection managed at application lifecycle
- **Response Caching**: TODO - Not yet implemented

## Security

### Authentication

- **OAuth 2.0**: Delegated authentication to trusted providers
- **JWT Tokens**: Stateless authentication with server-side validation
- **CORS**: Configured (currently permissive for development)
- **Session Middleware**: Secure session handling for OAuth state

### Authorization

- **Role-Based Access**: Student, Supervisor, Teacher roles
- **Resource Ownership**: Users can only modify their own resources
- **Invite-Only Roles**: Supervisors and teachers require invite keys

### Input Validation

- **Pydantic Models**: Server-side validation of all inputs
- **DOMPurify**: Client-side sanitization of rich text content
- **File Validation**: Image and PDF upload validation

## Reliability

### Error Handling

- **Global Exception Handler**: Catches and formats API errors
- **Client Error Boundaries**: Unhandled promise rejection handling
- **User-Friendly Messages**: Dutch error messages for common scenarios

### Data Persistence

- **TypeDB Transactions**: ACID-compliant graph database
- **Volume Persistence**: Docker volumes for database data

## Maintainability

### Code Quality

- **ESLint**: JavaScript/React linting
- **Prettier**: Code formatting
- **Storybook**: Component documentation and visual testing
- **pytest**: Backend unit testing

### Documentation

- **API Documentation**: Swagger UI and ReDoc auto-generated
- **README Files**: Setup instructions per component
- **Inline Comments**: Dutch and English mixed (TODO: standardize)

## Scalability

### Current Architecture

- **Horizontal**: Not yet designed for horizontal scaling
- **Vertical**: Single instance deployment
- **Future**: Consider container orchestration (Kubernetes) if needed

## Browser Support

Target browsers (latest 2 versions):

- Chrome/Edge
- Firefox
- Safari (desktop and iOS)
- Android Chrome

## Metrics (TODO)

The following metrics are planned but not yet implemented:

- Dashboard customization usage rate
- Search query success rate
- Widget interaction frequency
- Project submission completion rate
- Student-project match accuracy

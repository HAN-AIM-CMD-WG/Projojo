import React, { useState, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import arrify from 'arrify';
import { Button } from './ui/button';

/**
 * # OneButtonForm Component
 *
 * A stateful form container with intelligent button behavior that automatically manages
 * form state and provides seamless submit/reset functionality with a single dynamic button.
 *
 * ## Features
 *
 * - **Dynamic Button Behavior**: Single button that adapts its function based on form state
 * - **Flexible Styling**: Supports custom CSS classes and button styles
 *
 * ## State Logic
 *
 * 1. **Pristine State**: Form matches initial state - button is disabled
 * 2. **Dirty State**: Form data differs from initial state - button shows action label (Submit)
 * 3. **Submitted State**: After action is performed - button shows reset label (Reset)
 * 4. **Reset Action**: Clicking reset returns form to pristine state with initial data
 *
 * ## Usage Examples
 *
 * ```jsx
 * // Basic form with text input
 * <OneButtonForm
 *   initialState={{ name: '', email: '' }}
 *   onAction={(data) => console.log('Submitted:', data)}
 * >
 *   <input name="name" placeholder="Name" />
 *   <input name="email" placeholder="Email" />
 * </OneButtonForm>
 *
 * // Custom labels and styling
 * <OneButtonForm
 *   initialState={{ message: '' }}
 *   onAction={(data) => sendMessage(data)}
 *   actionLabel="Send Message"
 *   resetLabel="Clear Form"
 *   className="p-4 border rounded"
 *   buttonClassName="w-full"
 * >
 *   <textarea name="message" placeholder="Enter your message" />
 * </OneButtonForm>
 *
 * // Complex form with multiple fields
 * <OneButtonForm
 *   initialState={{
 *     title: '',
 *     description: '',
 *     priority: 'medium'
 *   }}
 *   onAction={(formData) => createTask(formData)}
 *   actionLabel="Create Task"
 * >
 *   <input name="title" placeholder="Task title" />
 *   <textarea name="description" placeholder="Description" />
 *   <select name="priority">
 *     <option value="low">Low</option>
 *     <option value="medium">Medium</option>
 *     <option value="high">High</option>
 *   </select>
 * </OneButtonForm>
 * ```
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form elements (inputs, selects, textareas) that will receive injected props
 * @param {Object} props.initialState - Initial state object with field names as keys and default values
 * @param {(formData: Object) => void} props.onAction - Callback function called when form is submitted (dirty state)
 * @param {string} [props.actionLabel="Submit"] - Text displayed on button when form is dirty
 * @param {string} [props.resetLabel="Reset"] - Text displayed on button when form is submitted
 * @param {string} [props.buttonClassName=""] - Additional CSS classes to apply to the button
 * @param {string} [props.className=""] - Additional CSS classes to apply to the form container
 *
 * @returns {JSX.Element} A form container with automatic state management and dynamic button
 *
 */
const OneButtonForm = ({ children, initialState, onAction, actionLabel="Submit", resetLabel="Reset", buttonClassName="", className="" }) => {
  // The current state of the form data
  const [formData, setFormData] = useState(initialState);
  // 'pristine' | 'dirty' | 'submitted'
  const [formStatus, setFormStatus] = useState('pristine');

  // We check if the form is "dirty" by comparing current data to initial state.
  const isDirty = !(isEqual(formData, initialState));

  // This effect will run whenever the 'isDirty' status changes.
  useEffect(() => {
    // If the form was just submitted, it stays in the 'submitted' state
    // until the user interacts with it again.
    if (formStatus === 'submitted') {
      return;
    }
    
    // Otherwise, update the status based on whether the form is dirty or pristine.
    setFormStatus(isDirty ? 'dirty' : 'pristine');
  }, [isDirty]);

  const handleChange = (fieldName, newValue) => {
    // When the user types, if the form was in a 'submitted' state,
    // we move it back to 'dirty' as they are now making new changes.
    if (formStatus === 'submitted') {
      setFormStatus('dirty');
    }
      console.log(`Field ${fieldName} changed to:`, newValue);

    setFormData(prevData => ({
      ...prevData,
      [fieldName]: newValue,
    }));
  };

  const handleButtonClick = () => {
    // The button's behavior depends on the current form status
    switch (formStatus) {
      case 'dirty':
      console.log('Button clicked in dirty state. Submitting form with data:', formData);
      // If the form is dirty, perform the action
      if (onAction) {
        onAction(formData);
      }
      // After performing the action, change the status to 'submitted'
      setFormStatus('submitted');
      break;

      case 'submitted':
      console.log('Button clicked in submitted state. Resetting form to initial state:', initialState);
      // If the form was submitted, the button now acts as a reset button
      setFormData(initialState);
      // After resetting, the form is back to its pristine state
      setFormStatus('pristine');
      break;
      
      // 'pristine' case is handled by the button's disabled attribute,
      // so we don't need to do anything here.
      default:
      console.log('Button clicked in pristine state. No action taken.');
      break;
    }
  };

  // Inject props into children 
  const childrenWithAddedProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        value: formData[child.props.name],
        onChange: (newValue) => handleChange(child.props.name, 'nativeEvent' in newValue ? newValue.target.value : newValue),
      });
    }
    return child;
  });

  // Determine button text and disabled state based on the form status
  const getButtonProps = () => {
    switch (formStatus) {
      case 'submitted':
        return { children: arrify(resetLabel), disabled: false, className: buttonClassName + ' bg-blue-500 hover:bg-blue-600' };
      case 'dirty':
        return { children: arrify(actionLabel), disabled: false, className: buttonClassName + ' bg-green-500 hover:bg-green-600' };
      case 'pristine':
      default:
        return { children: arrify(actionLabel), disabled: true, className: buttonClassName + ' bg-gray-500' };
    }
  };

  const buttonProps = getButtonProps();

  // Handles form submission (prevents default and triggers button click logic)
  const handleSubmit = (e) => {
    e.preventDefault();
    handleButtonClick();
  };

  return (
    <form
      className={className + " gap-3"}
      onSubmit={handleSubmit}
    >
      {childrenWithAddedProps}
      <Button
        type="submit"
        {...buttonProps}
        style={{
          cursor: buttonProps.disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {buttonProps.children}
      </Button>
    </form>
  );
};

export default OneButtonForm;
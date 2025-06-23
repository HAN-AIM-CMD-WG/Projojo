import { useState, useEffect } from 'react';

// The component receives an initial list of numbers and an onChange callback.
// We provide default empty values for the props to make the component more robust.
const RandomNumberButton = ({  value=[], onChange = () => {} }) => {
  // 1. STATE MANAGEMENT
  // The component's internal state is the list of numbers.
  // We initialize it with the `initialState` prop.


  // 3. HANDLER FUNCTION
  // This function is called when the "+" button is clicked.
  const handleAddNumber = () => {
    // Generate a random integer between 10 and 99.
    const randomNumber = Math.floor(Math.random() * 90) + 10;

    // Call the onChange callback to notify the parent component of the change.
    onChange([...value, randomNumber]);
  };

  // 4. RENDERING LOGIC
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'sans-serif' }}>
      {/* The list of numbers, displayed to the left */}
      <div 
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '5px',
          minHeight: '40px',
          minWidth: '200px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {value.length > 0
          ? `Numbers: ${value}`
          : 'No numbers yet.'
        }
      </div>

      {/* The "+" button */}
      <button
        onClick={handleAddNumber}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: '#007bff',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        +
      </button>
    </div>
  );
};

export default RandomNumberButton;
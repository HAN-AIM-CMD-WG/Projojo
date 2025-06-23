"use client";

import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState } from "react";

/**
 * # SearchField Component
 *
 * A reusable search input component with intelligent button behavior that provides
 * visual feedback and seamless search/clear functionality.
 *
 * ## Features
 *
 * - **Smart Button Toggle**: Button dynamically switches between search and clear icons
 * - **Form Submission**: Supports both Enter key and button click for search
 *
 * ## Behavior Logic
 *
 * 1. **Initial State**: Shows search icon (🔍)
 * 2. **After Search**: When user searches with text, button changes to clear icon (✕)
 * 3. **Clear Action**: Clicking clear icon resets search field and calls `handleSearch("")`
 * 4. **Text Input**: When typing while clear icon is shown, button reverts to search icon
 * 5. **Empty Search**: Search only triggers if input contains non-empty trimmed text
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic usage
 * <SearchField handleSearch={(term) => console.log(term)} />
 *
 * // With custom placeholder
 * <SearchField
 *   handleSearch={(term) => filterResults(term)}
 *   placeholder="Search products..."
 * />
 *
 * // With initial value and styling
 * <SearchField
 *   handleSearch={(term) => onSearch(term)}
 *   initialValue="existing search"
 *   placeholder="Find anything..."
 *   className="w-full max-w-md"
 * />
 * ```
 *
 * @param {Object} props - Component props
 * @param {(searchTerm: string) => void} props.handleSearch - Callback function called when search is performed or cleared
 * @param {string} [props.placeholder="Zoek bedrijf, taak of persoon"] - Placeholder text for the input field
 * @param {string} [props.initialValue=""] - Initial value for the search input
 * @param {string} [props.className=""] - Additional CSS classes to apply to the form wrapper
 *
 * @returns {JSX.Element} A search input form with intelligent button behavior
 *
 * @example
 * // Filter a list of items
 * const MyComponent = () => {
 *   const [filteredItems, setFilteredItems] = useState(items);
 *
 *   const handleSearch = (searchTerm) => {
 *     if (searchTerm.trim()) {
 *       setFilteredItems(items.filter(item =>
 *         item.title.toLowerCase().includes(searchTerm.toLowerCase())
 *       ));
 *     } else {
 *       setFilteredItems(items);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <SearchField
 *         handleSearch={handleSearch}
 *         placeholder="Search items..."
 *       />
 *       {filteredItems.map(item => <div key={item.id}>{item.title}</div>)}
 *     </div>
 *   );
 * };
 */
const SearchField = ({
  handleSearch,
  placeholder = "Zoeken...",
  initialValue = "",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showClearButton, setShowClearButton] = useState(false);

  function searchInputChange(event) {
    const value = event.target.value;
    setSearchTerm(value);
    
    // When user enters text while X is showing, change button back to search icon
    if (showClearButton && value.length > 0) {
      setShowClearButton(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
      setShowClearButton(true);
    }
  }

  function handleButtonClick() {
    if (showClearButton) {
      // Clear button clicked - clear search and reset to search icon
      setSearchTerm("");
      setShowClearButton(false);
      handleSearch("");
    } else {
      // Search button clicked - perform search if there's text
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
        setShowClearButton(true);
      }
    }
  }

  return (
    <form className={`w-fit ${className}`} onSubmit={handleSubmit}>
      <div className="focus-within:bg-white focus-within:border-gray-300 flex items-center border rounded-full overflow-hidden p-1">
        <input
          className="pl-4 pr-2 max-w-[200ch] w-[70ch] focus:outline-none text-ellipsis overflow-hidden whitespace-nowrap text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={searchInputChange}
        />
        <Button
          type="button"
          size="icon"
          className="rounded-full"
          onClick={handleButtonClick}
        >
          {showClearButton ? <X /> : <Search />}
        </Button>
      </div>
    </form>
  );
};


export default SearchField;

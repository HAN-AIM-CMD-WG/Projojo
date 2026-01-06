import { useEffect, useRef, useState } from 'react';
import { /*getFile*/ } from '../services';
import PdfPreview from './PdfPreview';

/**
 *
 * @param {Object} props
 * @param {function} props.onFileChanged - Callback function when files are added or removed
 * @param {boolean} [props.multiple=false] - Whether to allow multiple file selection
 * @param {string} [props.accept="image/*"] - Accepted file types (MIME types), comma-separated for multiple types
 * @param {string} [props.name] - Name attribute for the file input
 * @param {boolean} [props.required=true] - Whether the file input is required
 * @param {string} [props.initialFilePath] - Initial file path for preview
 * @param {string} [props.label] - Label for the file input
 * @returns JSX.Element
 */
export default function DragDrop({ onFileChanged, multiple = false, accept = "image/*", name, required = true, initialFilePath, label }) {
    const fileInput = useRef();
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [initialPreview, setInitialPreview] = useState(null);
    const [isDeleted, setIsDeleted] = useState(false);
    const id = name ? `${name}-file-input` : 'file-input';

    useEffect(() => {
        // Set initial preview if a file path is provided
        if (initialFilePath && initialFilePath !== "undefined" && !initialFilePath.includes("null")) {
            setInitialPreview(initialFilePath);
            setIsDeleted(false);
        } else {
            setInitialPreview(null);
            setIsDeleted(false);
        }
    }, [initialFilePath]);

    function onKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInput.current.click();
        }
    }

    function onFileInput(event) {
        onFilesAdded(event.target.files);
    }

    function onDrop(event) {
        event.preventDefault();

        const files = event.dataTransfer.files;
        onFilesAdded(files);
    }

    function convertFileListToArray(fileList) {
        const fileArray = new Array(fileList.length);
        for (let i = 0; i < fileList.length; i++) {
            fileArray[i] = fileList.item(i);
        }

        return fileArray;
    }

    function validateFileType(file) {
        // Parse the accept prop to get allowed types
        const acceptedTypes = accept.split(',').map(type => type.trim());

        for (const acceptedType of acceptedTypes) {
            if (acceptedType.endsWith('/*')) {
                // Handle wildcard types like "image/*" or "application/*"
                const baseType = acceptedType.split('/')[0];
                if (file.type.startsWith(baseType + '/')) {
                    return true;
                }
            } else {
                // Handle specific MIME types like "application/pdf"
                if (file.type === acceptedType) {
                    return true;
                }
            }
        }
        return false;
    }

    function onFilesAdded(newFiles) {
        let fileArray = convertFileListToArray(newFiles);
        if (!multiple) {
            fileArray = fileArray.slice(0, 1);
        }

        // If no files were selected (user cancelled), restore previous files to the input
        if (fileArray.length === 0) {
            // Restore the previous files to the file input if they exist
            if (files.length > 0) {
                try {
                    const dataTransfer = new DataTransfer();
                    files.forEach(file => dataTransfer.items.add(file));
                    fileInput.current.files = dataTransfer.files;
                } catch { /* File restoration failed, but state remains consistent */ }
            }
            return;
        }

        // Validate file types
        const invalidFiles = fileArray.filter(file => !validateFileType(file));
        if (invalidFiles.length > 0) {
            if (accept.includes('image')) {
                setError('Alleen afbeeldingen zijn toegestaan');
            } else if (accept.includes('pdf')) {
                setError('Alleen PDF-bestanden zijn toegestaan');
            } else {
                setError('Dit bestandstype wordt niet ondersteund');
            }

            // Restore previous files if validation fails
            if (files.length > 0) {
                try {
                    const dataTransfer = new DataTransfer();
                    files.forEach(file => dataTransfer.items.add(file));
                    fileInput.current.files = dataTransfer.files;
                } catch { /* File restoration failed, but state remains consistent */ }
            } else {
                // If no previous files but there's an initial preview, clear the file input
                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            }
            return;
        }

        // Clear initial preview when new files are added
        setInitialPreview(null);
        setIsDeleted(false);

        setFiles(fileArray);
        if (typeof onFileChanged === "function") {
            onFileChanged(fileArray.length === 0 ? undefined : fileArray);
        }
        try {
            fileInput.current.files = newFiles;
        } catch { /** throws an error but will still set the files of the fileInput */ }
        setError(undefined);
    }

    function handleDelete(event) {
        event.preventDefault();
        event.stopPropagation();
        setIsDeleted(true);
        setInitialPreview(null);
        setFiles([]);
        if (typeof onFileChanged === "function") {
            onFileChanged(undefined);
        }
        // Clear the file input
        if (fileInput.current) {
            fileInput.current.value = '';
        }
    }

    return (
        <>
            <div>
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
                        {label} {required && <span className="text-primary">*</span>}
                    </label>
                )}
                <div 
                    className="border-2 border-dashed rounded pb-6 max-sm:hidden flex flex-col items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    onClick={() => fileInput.current.click()}
                    onKeyDown={onKeyDown}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={onDrop}
                    tabIndex="0"
                    role="button"
                    aria-label={`${label || 'Bestand'} uploaden. Klik of sleep een bestand hierheen.${accept.includes('image') ? ' Alleen afbeeldingen toegestaan.' : accept.includes('pdf') ? ' Alleen PDF-bestanden toegestaan.' : ''}`}
                >
                    <svg width="20%" height="20%" className='mt-3' viewBox="0 0 24 24" aria-hidden="true">
                        <g>
                            <path fill="none" d="M0 0h24v24H0z" />
                            <path fillRule="nonzero" d="M16 13l6.964 4.062-2.973.85 2.125 3.681-1.732 1-2.125-3.68-2.223 2.15L16 13zm-2-7h2v2h5a1 1 0 0 1 1 1v4h-2v-3H10v10h4v2H9a1 1 0 0 1-1-1v-5H6v-2h2V9a1 1 0 0 1 1-1h5V6zM4 14v2H2v-2h2zm0-4v2H2v-2h2zm0-4v2H2V6h2zm0-4v2H2V2h2zm4 0v2H6V2h2zm4 0v2h-2V2h2zm4 0v2h-2V2h2z" />
                        </g>
                    </svg>
                    <p className="text-[var(--text-primary)] font-medium">Klik hier of sleep hier een bestand heen</p>
                </div>
                <button 
                    type="button"
                    className="btn-primary sm:hidden w-full" 
                    onClick={() => fileInput.current.click()}
                    aria-label={`${label || 'Bestand'} uploaden`}
                >
                    Voeg een bestand toe
                </button>
            </div>

            <div role="alert" aria-live="polite" className="text-center">
                {!!error && (
                    <span className="text-primary font-medium">{error}</span>
                )}
            </div>

            <input ref={fileInput} hidden type="file" id={id} name={name} multiple={multiple} accept={accept} onInput={onFileInput} onInvalid={() => setError("Dit bestand is verplicht")} data-testid="fileinput" required={required && !initialPreview} />

            {/* Show newly added files */}
            {files.length > 0 && (
                <div className='flex justify-center'>
                    {files.map((file, index) =>
                        file.type === "application/pdf" ? (
                            <div key={index} className="w-full">
                                <PdfPreview url={URL.createObjectURL(file)} className='h-[25rem]' />
                            </div>
                        ) : file.type.startsWith("image/") ? (
                            <img
                                src={URL.createObjectURL(file)}
                                className="w-48 h-48"
                                alt="Toegevoegde foto"
                                key={index}
                            />
                        ) : (
                            <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" key={index}>
                                {file.name}
                            </a>
                        )
                    )}
                </div>
            )}

            {/* Hidden input to indicate explicit deletion */}
            {isDeleted && (
                <input type="hidden" name={`${name}_deleted`} value="true" />
            )}

            {/* Show initial file preview if no new files are added */}
            {files.length === 0 && initialPreview && (
                <div className='flex flex-col items-center gap-4'>
                    <div className='flex justify-center w-full'>
                        {accept.includes("image") ? (
                            <img
                                src={initialPreview}
                                className="w-48 h-48 object-cover rounded"
                                alt="Huidige afbeelding"
                            />
                        ) : accept.includes("pdf") ? (
                            <div className="w-full">
                                <PdfPreview url={initialPreview} className='h-[25rem]' />
                            </div>
                        ) : (
                            <a href={initialPreview} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                Bekijk huidig bestand
                            </a>
                        )}
                    </div>
                    {!required && (
                        <div className="flex gap-3">
                            <a
                                href={initialPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary text-sm px-4 py-2"
                            >
                                Bekijk {accept.includes("pdf") ? "PDF" : "bestand"}
                            </a>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn-primary text-sm px-4 py-2"
                            >
                                Verwijder {accept.includes("image") ? "afbeelding" : accept.includes("pdf") ? "PDF" : "bestand"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

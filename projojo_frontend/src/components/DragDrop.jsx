import { useEffect, useRef, useState } from 'react';
import { /*getFile*/ } from '../services';
import PdfPreview from './PdfPreview';

/**
 *
 * @param {{ onFileChanged: (file: File[]) => void }} param0
 * @returns
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

    function onKeyUp(event) {
        if (event.key === "Enter") {
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
                <div className="border-2 border-dashed rounded pb-6 max-sm:hidden flex flex-col items-center cursor-pointer"
                    onClick={() => fileInput.current.click()}
                    onKeyUp={onKeyUp}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={onDrop}
                    tabIndex="0"
                >
                    <svg width="20%" height="20%" className='mt-3' viewBox="0 0 24 24">
                        <g>
                            <path fill="none" d="M0 0h24v24H0z" />
                            <path fillRule="nonzero" d="M16 13l6.964 4.062-2.973.85 2.125 3.681-1.732 1-2.125-3.68-2.223 2.15L16 13zm-2-7h2v2h5a1 1 0 0 1 1 1v4h-2v-3H10v10h4v2H9a1 1 0 0 1-1-1v-5H6v-2h2V9a1 1 0 0 1 1-1h5V6zM4 14v2H2v-2h2zm0-4v2H2v-2h2zm0-4v2H2V6h2zm0-4v2H2V2h2zm4 0v2H6V2h2zm4 0v2h-2V2h2zm4 0v2h-2V2h2z" />
                        </g>
                    </svg>
                    <h2>Klik hier of sleep hier een bestand heen</h2>
                </div>
                <button className="btn-primary sm:hidden w-full" onClick={() => fileInput.current.click()}>Voeg een bestand toe</button>
            </div>

            {!!error && (
                <span className="text-primary text-center">{error}</span>
            )}

            <input ref={fileInput} hidden type="file" id={id} name={name} multiple={multiple} accept={accept} onInput={onFileInput} onInvalid={() => setError("Dit bestand is verplicht")} data-testid="fileinput" required={required && !initialPreview} />

            {/* Show newly added files */}
            {files.length > 0 && (
                <div className='flex justify-center'>
                    {files.map((file, index) =>
                        file.type === "application/pdf" ? (
                            <div key={index} className="w-full">
                                <PdfPreview url={URL.createObjectURL(file)} className='h-[25rem]' />
                            </div>
                        ) : (
                            <img
                                src={URL.createObjectURL(file)}
                                className="w-48 h-48"
                                alt="Toegevoegde foto"
                                key={index}
                            />
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
                <div className='flex flex-col items-center gap-2'>
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
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn-secondary text-sm px-4 py-2"
                        >
                            Verwijder {accept.includes("image") ? "afbeelding" : accept.includes("pdf") ? "pdf" : "bestand"}
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

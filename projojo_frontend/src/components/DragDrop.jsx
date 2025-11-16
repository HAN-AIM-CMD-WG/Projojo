import { useEffect, useRef, useState } from 'react';
import { /*getFile*/ } from '../services';
import PdfPreview from './PdfPreview';

/**
 *
 * @param {{ onFileChanged: (file: File[]) => void }} param0
 * @returns
 */
export default function DragDrop({ onFileChanged, multiple = false, accept = "image/*", name, required = false, initialFilePath, text = "Sleep uw afbeeldingen hier", showAddedFiles = true }) {
    const fileInput = useRef();
    const [files, setFiles] = useState([]);
    const [error, setError] = useState();
    const [initialPreview, setInitialPreview] = useState(null);

    useEffect(() => {
        // Set initial preview if a file path is provided
        if (initialFilePath && initialFilePath !== "undefined" && !initialFilePath.includes("null")) {
            setInitialPreview(initialFilePath);
        } else {
            setInitialPreview(null);
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

    function onFilesAdded(files) {
        let fileArray = convertFileListToArray(files);
        if (!multiple) {
            fileArray = fileArray.slice(0, 1);
        }

        // Validate that files were actually selected
        if (fileArray.length === 0) {
            setError("Geen afbeelding toegevoegd");
            return;
        }

        // Clear initial preview when new files are added
        setInitialPreview(null);

        setFiles(fileArray);
        if (typeof onFileChanged === "function") {
            onFileChanged(fileArray.length === 0 ? undefined : fileArray);
        }
        try {
            fileInput.current.files = files;
        } catch { /** throws an error but will still set the files of the fileInput */ }
        setError(undefined);
    }

    return (
        <>
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
                <h2>{text}</h2>
            </div>
            <div className="text-center">
                <button className="btn-primary sm:hidden w-full" onClick={() => fileInput.current.click()}>Voeg afbeeldingen toe</button>
            </div>
            <span className="text-primary text-center">{error}</span>
            <input ref={fileInput} hidden type="file" name={name} multiple={multiple} accept={accept} onInput={onFileInput} onInvalid={() => setError("Geen afbeelding toegevoegd")} data-testid="fileinput" required={required} />

            {/* Show newly added files */}
            {showAddedFiles && files.length > 0 && (
                <div className='flex justify-center'>
                    {files.map((file, index) =>
                        <img
                            src={URL.createObjectURL(file)}
                            className="w-12 h-12"
                            alt="aangemaakte foto"
                            key={index}
                        />
                    )}
                </div>
            )}

            {/* Show initial file preview if no new files are added */}
            {files.length === 0 && initialPreview && (
                <div className='flex justify-center mt-3'>
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
            )}
        </>
    );
}

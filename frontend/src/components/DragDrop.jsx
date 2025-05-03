import { useEffect, useRef, useState } from 'react';
import { /*getFile*/ } from '../services';

/**
 * 
 * @param {{ onFileChanged: (file: File[]) => void }} param0 
 * @returns 
 */
export default function DragDrop({ onFileChanged, multiple = false, accept = "image/*", name, required = false, initialFilePath, text = "Sleep uw afbeeldingen hier", showAddedFiles = true }) {
    const fileInput = useRef();
    const [files, setFiles] = useState([]);
    const [error, setError] = useState();

    useEffect(() => {
        let ignore = false;

        // if (initialFilePath !== undefined) {
        //     getFile(initialFilePath)
        //         .then(file => {
        //             if (ignore) return;
        //             const fileArray = [file];
        //             if (typeof onFileChanged === "function") {
        //                 onFileChanged(fileArray.length === 0 ? undefined : fileArray);
        //             }
        //             setFiles(fileArray);
        //         });
        // }

        return () => {
            ignore = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {showAddedFiles && <div className='flex justify-center'>
                {files.map((file, index) =>
                    <img
                        src={URL.createObjectURL(file)}
                        className="w-12 h-12"
                        alt="aangemaakte foto"
                        key={index}
                    />
                )}
            </div>}
        </>
    );
}
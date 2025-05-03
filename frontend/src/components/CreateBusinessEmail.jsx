import { useRef, useState } from "react";
import { /*getColleaguesEmailAdresses, getStudentEmailAdresses*/ } from "../services";
import FormInput from "./FormInput";
import Loading from "./Loading";
import Modal from "./Modal";

export default function CreateBusinessEmail({ taskId, dontSetLocation /* variable used for testing */ = false }) {
    const [isCreateMailModalOpen, setIsCreateMailModalOpen] = useState();
    const [isMailLoading, setIsMailLoading] = useState(false);
    const [fetchError, setFetchError] = useState(undefined);
    const [checkboxError, setCheckboxError] = useState(undefined);
    const [sendCCToColleagues, setSendCCToColleagues] = useState(false);
    const checkboxInputRef = useRef();

    function onCreateMailButtonClick() {
        setIsCreateMailModalOpen(true);
    }

    function onMailtoButtonClick(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const subject = formData.get("subject");

        const selection = [...checkboxInputRef.current.children]
            .reduce((prev, el) => el.firstElementChild.checked ? prev | Number(el.firstElementChild.name) : prev, 0);

        if (selection === 0) {
            setCheckboxError("Er moet een keuze gemaakt worden.")
            return;
        }

        setIsMailLoading(true);
        // getStudentEmailAdresses(selection, taskId)
        //     .then(adresses => {
        //         if (!adresses || adresses.length === 0) {
        //             setFetchError("Geen e-mailadressen gevonden.");
        //             return;
        //         }
        //         const joined = encodeURI(adresses.join(","));
        //         if (!dontSetLocation) {
        //             if (sendCCToColleagues) {
        //                 getColleaguesEmailAdresses()
        //                 .then(colleagues => {
        //                     const cc = encodeURI(colleagues.join(","));
        //                     document.location = `mailto:?subject=${encodeURI(subject.toString())}&cc=${cc}&bcc=${joined}`;
        //                 })
        //             } else {
        //                 document.location = `mailto:?subject=${encodeURI(subject.toString())}&bcc=${joined}`;
        //             }
        //         }

        //         setIsCreateMailModalOpen(false);
        //     })
        //     .catch(error => setFetchError(error.message))
        //     .finally(() => setIsMailLoading(false));
    }

    return (
        <>
            <button data-testid="open-create-mail-button" className="btn-primary w-full" onClick={onCreateMailButtonClick}>Creeër email</button>
            <Modal modalHeader="Genereer email" isModalOpen={isCreateMailModalOpen} setIsModalOpen={setIsCreateMailModalOpen}>
                <form onSubmit={onMailtoButtonClick} className="flex flex-col gap-3">
                    <div ref={checkboxInputRef}>
                        <FormInput label="Mail naar aangemelde studenten" type="checkbox" name="1" />
                        <FormInput label="Mail naar geaccepteerde studenten" type="checkbox" name="2" />
                        <FormInput label="Mail naar afgewezen studenten" type="checkbox" name="4" />
                        <FormInput label="CC naar collega's" type="checkbox" onChange={value => setSendCCToColleagues(value)} />
                        {checkboxError && <span className="text-primary">{checkboxError}</span>}
                    </div>

                    <FormInput label="Onderwerp" type="text" name="subject" required />

                    <button className="btn-primary" type="submit" disabled={isMailLoading}>{!isMailLoading ? "Genereer mail" : <Loading />}</button>
                    {fetchError && <span className="text-primary font-bold">{fetchError}</span>}
                </form>
            </Modal>
        </>
    )
}
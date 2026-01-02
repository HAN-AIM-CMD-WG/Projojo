import { useState } from "react";
import { getColleaguesEmailAddresses, getStudentEmailAddresses } from "../services";
import FormInput from "./FormInput";
import Loading from "./Loading";
import Modal from "./Modal";

export default function CreateBusinessEmail({ taskId, dontSetLocation /* variable used for testing */ = false }) {
    const [isCreateMailModalOpen, setIsCreateMailModalOpen] = useState();
    const [isMailLoading, setIsMailLoading] = useState(false);
    const [fetchError, setFetchError] = useState(undefined);
    const [checkboxError, setCheckboxError] = useState(undefined);
    const [sendCCToColleagues, setSendCCToColleagues] = useState(false);

    function onCreateMailButtonClick() {
        setIsCreateMailModalOpen(true);
    }

    function onMailtoButtonClick(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const subject = formData.get("subject");

        // Collect selected student statuses from form data
        const selection = [];
        const studentStatuses = ['registered', 'accepted', 'rejected'];

        studentStatuses.forEach(status => {
            if (formData.get(status)) {
                selection.push(status);
            }
        });

        if (selection.length === 0) {
            setCheckboxError("Selecteer ten minste één type student.");
            return;
        }

        setCheckboxError(undefined);
        setIsMailLoading(true);
        getStudentEmailAddresses(selection, taskId)
            .then(addresses => {
                if (!addresses || addresses.length === 0) {
                    setFetchError("Geen e-mailadressen gevonden.");
                    return;
                }
                const joined = encodeURI(addresses.join(","));
                if (!dontSetLocation) {
                    if (sendCCToColleagues) {
                        getColleaguesEmailAddresses(taskId)
                            .then(colleagues => {
                                const cc = encodeURI(colleagues.join(","));
                                document.location = `mailto:?subject=${encodeURI(subject.toString())}&cc=${cc}&bcc=${joined}`;
                            })
                            .catch(error => {
                                // If colleague emails fail, still send to students
                                document.location = `mailto:?subject=${encodeURI(subject.toString())}&bcc=${joined}`;
                            });
                    } else {
                        document.location = `mailto:?subject=${encodeURI(subject.toString())}&bcc=${joined}`;
                    }
                }

                setIsCreateMailModalOpen(false);
            })
            .catch(error => setFetchError(error.message))
            .finally(() => setIsMailLoading(false));
    }

    return (
        <>
            <button data-testid="open-create-mail-button" className="btn-primary w-full" onClick={onCreateMailButtonClick}>Creëer email</button>
            <Modal modalHeader="Genereer email" isModalOpen={isCreateMailModalOpen} setIsModalOpen={setIsCreateMailModalOpen}>                <form onSubmit={onMailtoButtonClick} className="flex flex-col gap-3">
                <div>
                    <FormInput label="Mail naar aangemelde studenten" type="checkbox" name="registered" />
                    <FormInput label="Mail naar geaccepteerde studenten" type="checkbox" name="accepted" />
                    <FormInput label="Mail naar afgewezen studenten" type="checkbox" name="rejected" />
                    <FormInput label="CC naar collega's" type="checkbox" name="colleagues" onChange={value => setSendCCToColleagues(value)} />
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
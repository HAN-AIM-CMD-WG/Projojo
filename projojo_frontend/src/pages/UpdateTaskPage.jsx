import { useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthProvider';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import RichTextEditor from '../components/RichTextEditor';
import { getTaskById, updateTask } from '../services';
import useFetch from '../useFetch';
import NotFound from './NotFound';

export default function UpdateTaskPage() {
    const { authData } = useAuth();
    const { taskId } = useParams();
    const [error, setError] = useState();
    const [nameError, setNameError] = useState();
    const [description, setDescription] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const [totalNeededError, setTotalNeededError] = useState();
    const navigation = useNavigate();

    const { data: task } = useFetch(async () => !authData.isLoading && await getTaskById(taskId), [taskId]);

    if (task?.description !== undefined && description === undefined) {
        setDescription(task?.description);
    }

    if (authData && !authData.isLoading && authData.type !== 'supervisor' && authData.type !== 'teacher') {
        return <NotFound />;
    }

    function onSubmit(event) {
        event.preventDefault();
        if (nameError != undefined || descriptionError != undefined || totalNeededError != undefined) {
            return;
        }

        const formData = new FormData(event.target);

        formData.append("description", description);

        updateTask(taskId, formData)
            .then(() => {
                navigation(-1);
            }).catch(error => setError(error.message));
    }

    return (
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
            <Card header="Taak aanpassen" className="flex flex-col gap-3 px-6 py-12 sm:rounded-lg sm:px-12 shadow-xl border border-gray-300">
                <Alert text={error} onClose={() => setError("")} />
                <FormInput
                    label="Taaknaam"
                    type="text"
                    name="name"
                    initialValue={task?.name}
                    error={nameError}
                    setError={setNameError}
                    max={100}
                    required={true}
                />
                {description !== undefined
                    ? <RichTextEditor
                        label="Beschrijving"
                        max={4000}
                        required
                        defaultText={description}
                        onSave={setDescription}
                        error={descriptionError}
                        setError={setDescriptionError}
                    />
                    : <div className="flex justify-center">
                        <img src="/loading.gif" alt="loading" />
                    </div>
                }
                <FormInput
                    label="Aantal plekken"
                    type="number"
                    name="total_needed"
                    initialValue={task?.total_needed}
                    error={totalNeededError}
                    setError={setTotalNeededError}
                    min={1}
                    required={true}
                />
                <div className='grid grid-cols-2 gap-2'>
                    <button className="btn-secondary flex-grow" type="button" onClick={() => navigation(-1)}>Annuleren</button>
                    <button className="btn-primary flex-grow" type="submit">Opslaan</button>
                </div>
            </Card>
        </form>
    );
}

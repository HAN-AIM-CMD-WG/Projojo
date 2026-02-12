import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import BusinessesOverview from "../components/BusinessesOverview";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import NotFound from "./NotFound";
import { createNewBusiness, getBusinessesBasic } from "../services";
import Alert from "../components/Alert";
import Loading from "../components/Loading";

export default function TeacherPage() {
    const { authData } = useAuth();
    const [error, setError] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [isCreateBusinessModalVisible, setIsCreateBusinessModalVisible] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState("");
    const [createNewBusinessError, setCreateNewBusinessError] = useState("");
    const [numberToReloadBusinesses, setNumberToReloadBusinesses] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        setIsLoading(true);

        getBusinessesBasic()
            .then(data => {
                if (ignore) return;
                setBusinesses(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
        }
    }, [numberToReloadBusinesses]);

    if (authData && !authData.isLoading && authData.type !== 'teacher') {
        return <NotFound />;
    }

    const onCreateNewBusiness = () => {
        createNewBusiness(newBusinessName)
            .then(() => {
                setCreateNewBusinessError(null);
                setIsCreateBusinessModalVisible(false);
                setNewBusinessName("");

                setNumberToReloadBusinesses(numberToReloadBusinesses + 1);
            })
            .catch(error => {
                setCreateNewBusinessError(error.message);
            })
    }

    return (
        <>
            <Alert text={error} onClose={() => setError(null)} />
            <PageHeader name={'Beheerpagina'} />
            <div className="flex flex-row gap-4 justify-end">
                <button onClick={() => setIsCreateBusinessModalVisible(true)} className="btn-primary mb-4">Bedrijf aanmaken</button>
            </div>

            {isLoading ? (
                <Loading />
            ) :
                <BusinessesOverview businesses={businesses} />
            }

            <hr className="mt-8 mb-3" />
            <NewSkillsManagement />

            <Modal
                modalHeader={`Nieuw bedrijf`}
                isModalOpen={isCreateBusinessModalVisible}
                setIsModalOpen={setIsCreateBusinessModalVisible}
            >
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onCreateNewBusiness();
                    }}
                >
                    <div className="flex flex-col mb-4">
                        <FormInput onChange={businessName => setNewBusinessName(businessName)} value={newBusinessName} type="text" label={`Bedrijfsnaam`} placeholder={"Vul de naam van het bedrijf in..."} name={`title`} required />
                        <p className="mt-1 text-sm italic text-gray-600">De rest van de informatie vult het bedrijf zelf in.</p>
                    </div>
                    {createNewBusinessError && <p className="col-span-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-2">{createNewBusinessError}</p>}
                    <button type="button" onClick={onCreateNewBusiness} name="Bedrijf aanmaken" className="btn-primary w-full">
                        Bedrijf aanmaken
                    </button>
                </form>
            </Modal>
        </>
    )
}

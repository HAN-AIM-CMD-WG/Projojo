import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StudentProfile from "../components/StudentProfile";
import { getSkillsFromStudent } from "../services";
import NotFound from "./NotFound";
import PageHeader from '../components/PageHeader';


export default function ProfilePage() {
    const [student, setStudent] = useState({ skills: [] });
    const [error, setError] = useState({ statusCode: null, message: null });
    const { profileId } = useParams();
    const [fetchAmount, setFetchAmount] = useState(0);

    useEffect(() => {
        let ignore = false;

        getSkillsFromStudent(profileId)
            .then(data => {
                if (ignore) return;
                // Combine student data with CV for testing purposes
                const studentWithCV = {
                    ...data,
                    cv_path: "PVDCV.pdf" // Placeholder for CV path, replace with actual data if available
                };
                setStudent(studentWithCV);
            })
            .catch(error => {
                if (ignore) return;
                setError(error);
            });

        return () => {
            ignore = true;
        }
    }, [profileId, fetchAmount]);

    if (error?.statusCode == 404) {
        return <NotFound />;
    } else if (error?.statusCode == 403) {
        return (
            <div className="flex flex-col h-fit items-center mt-10 gap-3">
                <h1 className="text-3xl font-bold">Geen toegang</h1>
                <p className="text-md">Je hebt geen toegang tot dit profiel.</p>
                <Link to="/home" className="btn-primary">Ga naar Home</Link>
            </div>
        )
    }

    return (
        <>
            <PageHeader name={'Profielpagina'} />
            <StudentProfile student={student} setFetchAmount={setFetchAmount} />
        </>
    )
}

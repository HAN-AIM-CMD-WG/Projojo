import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StudentProfile from "../components/StudentProfile";
import { API_BASE_URL } from "../services";
import NotFound from "./NotFound";
import PageHeader from '../components/PageHeader';


export default function ProfilePage() {
    const [student, setStudent] = useState({ skills: [] });
    const [error, setError] = useState({ statusCode: null, message: null });
    const { profileId } = useParams();
    const [fetchAmount, setFetchAmount] = useState(0);

    useEffect(() => {
        let ignore = false;

        fetch(`${API_BASE_URL}students/${profileId}/skills`, {
            headers: {
                Accept: 'application/json',
            },
        })
            .then(response => {
                if (ignore) return;
                if (!response.ok) {
                    return response.json().then(data => {
                        throw { statusCode: response.status, message: data.message };
                    });
                }
                return response.json();
            })
            .then(data => {
                if (ignore) return;
                // Combine student data with skills
                const studentWithSkills = {
                    ...data,
                    skills: data.Skills
                };
                setStudent(studentWithSkills);
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

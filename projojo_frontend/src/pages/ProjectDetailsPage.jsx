import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectDetails from "../components/ProjectDetails";
import ProjectTasks from "../components/ProjectTasks";
import { getProject, getProjectsWithBusinessId, getTasks, getTaskSkills } from "../services";
import NotFoundPage from "./NotFound";
import PageHeader from '../components/PageHeader';


export default function ProjectDetailsPage() {
    const { projectId } = useParams()
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState(null);
    const [fetchAmount, setFetchAmount] = useState(0);
    const [showNotFound, setShowNotFound] = useState(false);
    const lastTaskRef = useRef(null);

    const fetchProjectAndTasks = () => {
        getProject(projectId)
            .then(data => {
                // Ensure project has the expected format for the components
                data.id = data.id;
                data.name = data.name;
                setProject(data);

            })
            .catch(() => setShowNotFound(true));

        getTasks(projectId)
            .then(data => {
                setTasks(data);
            })
            .catch(() => setShowNotFound(false));
    };

    useEffect(() => {
        fetchProjectAndTasks();
    }, [projectId, fetchAmount]);

    const scrollToLastTask = () => {
        if (!lastTaskRef.current) return;
        lastTaskRef.current?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
            lastTaskRef.current.classList.add("animate-highlight");
            setTimeout(() => {
                lastTaskRef.current.classList.remove("animate-highlight");
            }, 1500);
        }, 300);
    };

    if (!projectId || showNotFound) return <NotFoundPage />

    return (
        <>
            <PageHeader name={'Projectpagina'} />
            <div className="bg-gray-100 rounded-lg">
                <ProjectDetails project={project} businessId={project?.business_id} refreshData={() => {
                    fetchProjectAndTasks();
                    scrollToLastTask();
                }} />
                <ProjectTasks tasks={tasks} fetchAmount={fetchAmount} setFetchAmount={setFetchAmount} businessId={project?.business_id} lastTaskRef={lastTaskRef} />
            </div>
        </>
    )
}

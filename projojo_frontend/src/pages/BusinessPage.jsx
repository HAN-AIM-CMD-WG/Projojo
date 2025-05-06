import { useParams } from "react-router-dom";
import Alert from "../components/Alert";
import BusinessProjectDashboard from '../components/BusinessProjectDashboard';
import Loading from '../components/Loading';
import { getBusiness, getProjectsWithBusinessId, getTasks, HttpError } from '../services';
import useFetch from '../useFetch';
import NotFound from './NotFound';
import PageHeader from '../components/PageHeader';


/**
 * Creates a BusinessPage component
 */
export default function BusinessPage() {
    const { businessId } = useParams();

    const { data: projectsData, error: projectsError } = useFetch(() => getProjectsWithBusinessId(Number(businessId)).then(async projects => {
        const promises = [];
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            promises.push(getTasks(project.id));
        }

        const awaited = await Promise.all(promises);

        for (let i = 0; i < projects.length; i++) {
            projects[i].tasks = awaited[i];
        }
        return projects.map((project) => { project.image = { path: project.photo.path }; project.projectId = project.id; return project; });
    }), [Number(businessId)]);

    const { data: businessData, error: businessError, isLoading: isBusinessLoading } = useFetch(() => getBusiness(Number(businessId)), [Number(businessId)]);

    let businessErrorMessage = undefined;
    if (businessError !== undefined) {
        businessErrorMessage = businessError.message;
        if (businessError instanceof HttpError) {
            if (businessError.statusCode === 401 || businessError.statusCode === 403) {
                businessErrorMessage = "Je bent niet geautoriseerd om deze pagina te bekijken";
            } else if (businessError.statusCode === 404) {
                return <NotFound />
            } else {
                businessErrorMessage = "Een onbekende server fout is ontstaan";
            }
        }
    }

    let projectsErrorMessage = undefined;
    if (projectsError !== undefined) {
        projectsErrorMessage = projectsError.message;
        if (projectsError instanceof HttpError) {
            if (projectsError.statusCode === 401 || projectsError.statusCode === 403) {
                projectsErrorMessage = "Je bent niet geautoriseerd om deze pagina te bekijken";
            } else if (projectsError.statusCode === 404) {
                return <NotFound />;
            } else {
                projectsErrorMessage = "Een onbekende server fout is ontstaan";
            }
        }
    }

    if (businessData !== undefined) {
        businessData.imagePath = businessData?.photo?.path;
    }

    return (
        <>
            <PageHeader name={'Bedrijfspagina'} />
            <div className={`flex flex-col gap-2 ${(businessErrorMessage !== undefined || projectsErrorMessage !== undefined) && 'mb-4'}`}>
                <Alert text={businessErrorMessage} />
                <Alert text={projectsErrorMessage} />
            </div>
            {isBusinessLoading ? (<Loading />) : (<BusinessProjectDashboard showDescription={true} showUpdateButton={true} isAlwaysExtended={true} business={businessData} projects={projectsData} />)}
        </>
    );
}
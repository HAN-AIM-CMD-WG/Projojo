import { useParams } from "react-router-dom";
import Alert from "../components/Alert";
import BusinessProjectDashboard from '../components/BusinessProjectDashboard';
import Loading from '../components/Loading';
import LocationMap from '../components/LocationMap';
import { getBusinessById, getProjectsWithBusinessId, getTasks, HttpError } from '../services';
import { normalizeSkill } from '../utils/skills';
import useFetch from '../useFetch';
import NotFound from './NotFound';
import PageHeader from '../components/PageHeader';


/**
 * Creates a BusinessPage component
 */
export default function BusinessPage() {
    const { businessId } = useParams();

    const { data: projectsData, error: projectsError } = useFetch(() => getProjectsWithBusinessId(businessId).then(async projects => {
        const promises = [];
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            // Fetch tasks for each project
            promises.push(getTasks(project.id));
        }

        const awaited = await Promise.all(promises);

        for (let i = 0; i < projects.length; i++) {
            projects[i].tasks = awaited[i];
        }

        return projects.map((project) => {
            // Ensure project has the expected format for the components
            project.projectId = project.id;
            project.title = project.name;
            return project;
        });
    }), [businessId]);

    const { data: businessData, error: businessError, isLoading: isBusinessLoading } = useFetch(() => getBusinessById(businessId), [businessId]);

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

    // No need to set imagePath as it's already in image_path field in the new API response

    // Compute topSkills for the business from the loaded projects' tasks (normalize shapes)
    const computedTopSkills = (() => {
        if (!projectsData) return [];
        const allSkills = projectsData.flatMap(project =>
            (project.tasks || []).flatMap(task => (task.skills || []).map(s => normalizeSkill(s)))
        );

        const skillCounts = allSkills.reduce((acc, skill) => {
            const key = skill.skillId;
            if (!acc[key]) {
                acc[key] = { count: 0, isPending: skill.isPending, name: skill.name, skillId: key };
            }
            acc[key].count++;
            return acc;
        }, {});

        return Object.values(skillCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(({ skillId, name, isPending }) => ({ skillId, name, isPending }));
    })();

    return (
        <>
            <PageHeader name={'Organisatiepagina'} />
            <div className={`flex flex-col gap-2 ${(businessErrorMessage !== undefined || projectsErrorMessage !== undefined) && 'mb-4'}`}>
                <Alert text={businessErrorMessage} />
                <Alert text={projectsErrorMessage} />
            </div>
            {isBusinessLoading ? (
                <Loading />
            ) : (
                <>
                    <BusinessProjectDashboard
                        showDescription={true}
                        showUpdateButton={true}
                        isAlwaysExtended={true}
                        business={businessData}
                        projects={projectsData}
                        topSkills={computedTopSkills}
                    />
                    
                    {/* Location Map */}
                    {businessData?.location && (
                        <div className="mt-6">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] mb-4">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                Locatie
                            </h2>
                            <LocationMap 
                                address={Array.isArray(businessData.location) ? businessData.location[0] : businessData.location}
                                name={businessData.name}
                                height="280px"
                            />
                        </div>
                    )}
                </>
            )}
        </>
    );
}

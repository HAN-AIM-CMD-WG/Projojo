import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import DashboardsOverview from "../components/DashboardsOverview";
import Filter from "../components/Filter";
import Loading from '../components/Loading';
import { getBusinesses, getProjects, getTasks, getProjectsWithBusinessId } from '../services';
import PageHeader from '../components/PageHeader';

export default function OverviewPage() {
  const [initialBusinesses, setInitialBusinesses] = useState([]);
  const [shownBusinesses, setShownBusinesses] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    getBusinesses()
      .then(async data => {
        if (ignore) return;
        
        // Format businesses to match the expected structure
        const formattedBusinesses = await Promise.all(data.map(async business => {
          // Fetch projects for this business
          const projects = await getProjectsWithBusinessId(business.id);
          
          // Fetch tasks for each project
          const projectsWithTasks = await Promise.all(projects.map(async project => {
            const tasks = await getTasks(project.id);
            
            // Format project to match expected structure
            return {
              ...project,
              projectId: project.id,
              title: project.name,
              tasks: tasks.map(task => ({
                ...task,
                taskId: task.id,
                title: task.name,
                totalNeeded: task.total_needed,
                totalAccepted: 0, // Default value
                totalRegistered: 0, // Default value
                skills: [] // Default value
              }))
            };
          }));
          
          // Format business to match expected structure
          return {
            ...business,
            id: business.id,
            business: {
              businessId: business.id,
              name: business.name,
              description: business.description,
              photo: {
                path: business.image_path
              },
              location: business.location && business.location.length > 0 ? 
                (Array.isArray(business.location) ? business.location[0] : business.location) : ""
            },
            projects: projectsWithTasks,
            topSkills: [] // Default value
          };
        }));
        
        setInitialBusinesses(formattedBusinesses);
        setShownBusinesses(formattedBusinesses);
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
      setIsLoading(false);
    }
  }, []);


  const isSearchInString = (search, string) => string.toLowerCase().includes(search.toLowerCase());

  const handleFilter = ({ searchInput, selectedSkills }) => {
    const formattedSearch = searchInput.trim().replace(/\s+/g, ' ')
    setError(null);

    if (!formattedSearch && selectedSkills.length === 0) {
      setShownBusinesses(initialBusinesses);
      return;
    }

    let filteredData = initialBusinesses

    if (formattedSearch) {
      filteredData = filteredData.map(business => {
        const filteredProjects = business.projects.filter(project => isSearchInString(formattedSearch, project.title));

        if (isSearchInString(formattedSearch, business.business.name) || filteredProjects.length > 0) {
          return {
            ...business,
            projects: isSearchInString(formattedSearch, business.business.name) ? business.projects : filteredProjects
          };
        }
        return null;
      })
        .filter(data => data !== null)
        .sort((a, b) => a.business.name.localeCompare(b.business.name));
    }

    if (selectedSkills.length > 0) {
      filteredData = filteredData.map(business => {
        const filteredProjects = business.projects.map(project => {
          const filteredTasks = project.tasks.filter(task => selectedSkills.every(selectedSkill => task.skills.some(taskSkill => taskSkill.skillId === selectedSkill.skillId)));

          if (filteredTasks.length > 0) {
            return {
              ...project,
              tasks: filteredTasks
            };
          }
          return null;
        })
          .filter(project => project !== null);

        if (filteredProjects.length > 0) {
          return {
            ...business,
            projects: filteredProjects
          };
        }
        return null;
      })
        .filter(business => business !== null);
    }

    if (filteredData.length === 0) {
      if (formattedSearch && selectedSkills.length > 0) {
        setError(`Er zijn geen zoekresultaten gevonden voor "${formattedSearch}" in combinatie met "${selectedSkills.map(skill => skill.name).join('", "')}".`);
      } else if (formattedSearch) {
        setError(`Er zijn geen zoekresultaten gevonden voor "${formattedSearch}".`);
      } else if (selectedSkills.length > 0) {
        setError(`Er zijn geen zoekresultaten gevonden voor "${selectedSkills.map(skill => skill.name).join('", "')}".`);
      }
    }

    setShownBusinesses(filteredData);
  };

  return (
    <>
      <PageHeader name={'Home'} />
      <Filter onFilter={handleFilter} />
      <div className={`flex flex-col gap-2 ${(error != null) && 'mb-4'}`}>
        <Alert text={error} isCloseable={false} />
      </div>
      {isLoading && <Loading />}
      <DashboardsOverview businesses={shownBusinesses} />
    </>
  );
}

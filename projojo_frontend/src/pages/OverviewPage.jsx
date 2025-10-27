import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import DashboardsOverview from "../components/DashboardsOverview";
import Filter from "../components/Filter";
import Loading from '../components/Loading';
import { getBusinessesComplete } from '../services';
import { normalizeSkill } from '../utils/skills';
import PageHeader from '../components/PageHeader';

export default function OverviewPage() {
  const [initialBusinesses, setInitialBusinesses] = useState([]);
  const [shownBusinesses, setShownBusinesses] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    getBusinessesComplete()
      .then(data => {
        if (ignore) return;

        const formattedBusinesses = data.map(business => {
          // Normalize all task skills for this business
          const allSkills = business.projects.flatMap(project =>
            project.tasks.flatMap(task => (task.skills || []).map(normalizeSkill).filter(Boolean))
          );

          // Aggregate by id (fallback to name) so counting is stable across shapes
          const skillCounts = allSkills.reduce((acc, skill) => {
            const key = skill.skillId ?? skill.name;
            if (!acc[key]) {
              acc[key] = { count: 0, isPending: skill.isPending, name: skill.name, skillId: key };
            }
            acc[key].count++;
            return acc;
          }, {});

          const topSkills = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([, { name, isPending, skillId }]) => ({ skillId, name, isPending }));

          return {
            ...business,
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
            projects: business.projects.map(project => {
              return {
                ...project,
                projectId: project.id,
                title: project.name,
                tasks: project.tasks.map(task => ({
                  ...task,
                  skills: (task.skills || []).map(normalizeSkill).filter(Boolean)
                }))
              };
            }),
            topSkills: topSkills
          };
        });

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
      // Prepare a set of selected ids (fallback to name) for stable comparisons
      const selectedIds = new Set((selectedSkills || []).map(s => String(s.skillId ?? s.name)));

      filteredData = filteredData.map(business => {
        const filteredProjects = business.projects.map(project => {
          const filteredTasks = project.tasks.filter(task => {
            // Build a set of task skill ids for quicker lookup (fallback to name)
            const taskSkillIds = new Set((task.skills || []).map(ts => String(ts.skillId ?? ts.name)));
            // Use the precomputed selectedIds set for membership checks
            return [...selectedIds].every(id => taskSkillIds.has(id));
          });

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

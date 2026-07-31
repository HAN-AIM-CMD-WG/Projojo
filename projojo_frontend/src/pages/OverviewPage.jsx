import { useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert';
import DashboardsOverview from "../components/DashboardsOverview";
import Filter from "../components/Filter";
import SkeletonOverview from '../components/SkeletonOverview';
import { getBusinessesComplete, getThemes } from '../services';
import { normalizeSkill } from '../utils/skills';
import { applyFilters, NO_FILTERS } from '../utils/businessFilters';
import { useStudentSkills } from '../context/StudentSkillsContext';
import { useStudentWork } from '../context/StudentWorkContext';

export default function OverviewPage() {
  const { studentSkills } = useStudentSkills();
  const { workingBusinessIds } = useStudentWork();
  const [initialBusinesses, setInitialBusinesses] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [themes, setThemes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    Promise.allSettled([getBusinessesComplete(), getThemes()])
      .then(([businessesResult, themesResult]) => {
        if (ignore) return;

        // Businesses are required - fail if they didn't load
        if (businessesResult.status !== 'fulfilled') {
          throw new Error(businessesResult.reason?.message || 'Kon projecten niet laden');
        }
        const data = businessesResult.value;

        // Themes degrade gracefully
        const themesData = themesResult.status === 'fulfilled' ? themesResult.value : [];

        setThemes(themesData || []);

        const formattedBusinesses = data.map(business => {
          // Normalize all task skills for this business
          const allSkills = business.projects.flatMap(project =>
            project.tasks.flatMap(task => (task.skills || []).map(normalizeSkill).filter(Boolean))
          );

          // Aggregate by id (fallback to name) so counting is stable across shapes
          const skillCounts = allSkills.reduce((acc, skill) => {
            const key = skill.skillId;
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
                (Array.isArray(business.location) ? business.location[0] : business.location) : "",
              sector: Array.isArray(business.sector) ? business.sector[0] : business.sector,
              companySize: Array.isArray(business.company_size) ? business.company_size[0] : business.company_size,
              country: Array.isArray(business.country) ? business.country[0] : (business.country || 'Nederland')
            },
            projects: business.projects.map(project => {
              const normalizedProjectLocation = project.location && project.location.length > 0
                ? (Array.isArray(project.location) ? project.location[0] : project.location)
                : "";
              return {
                ...project,
                projectId: project.id,
                title: project.name,
                location: normalizedProjectLocation,
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
      })
      .catch(err => {
        if (ignore) return;
        setLoadError(err.message);
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

  const { businesses: shownBusinesses, noResultsMessage } = useMemo(
    () => applyFilters(initialBusinesses, filters, workingBusinessIds, themes),
    [initialBusinesses, filters, workingBusinessIds, themes]
  );

  // A filter set while the projects are still on their way has nothing to find yet,
  // which is not the same as finding nothing.
  const error = loadError ?? (isLoading ? null : noResultsMessage);

  // Count OPEN projects that match student skills (archived excluded)
  const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
  const now = new Date();
  
  const { totalProjects, matchingProjects } = shownBusinesses.reduce((acc, business) => {
    business.projects.forEach(project => {
      // Skip archived projects (completed or end_date in the past)
      const isArchived = project.status === 'completed' || (project.end_date && new Date(project.end_date) < now);
      if (isArchived) return;
      
      acc.totalProjects++;
      // Check if any task in this project matches student skills
      const hasMatch = project.tasks?.some(task => {
        const taskSkillIds = new Set(task.skills?.map(s => s.skillId || s.id) || []);
        return [...taskSkillIds].some(id => studentSkillIds.has(id));
      });
      if (hasMatch) acc.matchingProjects++;
    });
    return acc;
  }, { totalProjects: 0, matchingProjects: 0 });

  return (
    <>
      {/* Page header - clear purpose */}
      <div className="pt-4 mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Ontdek projecten
        </h1>
        <p className="text-base text-[var(--text-muted)] font-medium mt-2">
          {matchingProjects > 0 && studentSkills.length > 0 ? (
            <>
              <span className="text-primary font-bold">{matchingProjects}</span> van {totalProjects} {totalProjects === 1 ? 'project matcht' : 'projecten matchen'} met jouw skills
            </>
          ) : totalProjects > 0 ? (
            <>
              <span className="text-[var(--text-primary)] font-bold">{totalProjects}</span> {totalProjects === 1 ? 'project' : 'projecten'} beschikbaar
            </>
          ) : (
            'Vind projecten die passen bij jouw skills en interesses'
          )}
        </p>
      </div>

      <Filter 
        onFilter={setFilters}
        themes={themes}
        businesses={shownBusinesses.map(b => ({
          id: b.business.businessId,
          name: b.business.name,
          location: b.business.location,
          image: b.business.photo?.path,
          sector: b.business.sector,
          companySize: b.business.companySize,
          country: b.business.country,
          projects: b.projects,
          topSkills: b.topSkills
        }))}
        allBusinesses={initialBusinesses}
      />
      <div className={`flex flex-col gap-2 ${(error != null) && 'mb-4'}`}>
        <Alert text={error} isCloseable={false} />
      </div>
      {isLoading ? <SkeletonOverview count={3} /> : <DashboardsOverview businesses={shownBusinesses} />}
    </>
  );
}

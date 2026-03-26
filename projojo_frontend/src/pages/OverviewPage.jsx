import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import DashboardsOverview from "../components/DashboardsOverview";
import Filter from "../components/Filter";
import SkeletonOverview from '../components/SkeletonOverview';
import { getBusinessesComplete, getThemes, getPublicProjects } from '../services';
import { normalizeSkill } from '../utils/skills';
import { useStudentSkills } from '../context/StudentSkillsContext';
import { useStudentWork } from '../context/StudentWorkContext';

export default function OverviewPage() {
  const { studentSkills } = useStudentSkills();
  const { workingBusinessIds } = useStudentWork();
  const [initialBusinesses, setInitialBusinesses] = useState([]);
  const [shownBusinesses, setShownBusinesses] = useState([]);
  const [themes, setThemes] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    Promise.allSettled([getBusinessesComplete(), getThemes(), getPublicProjects()])
      .then(([businessesResult, themesResult, publicProjectsResult]) => {
        if (ignore) return;

        // Businesses are required - fail if they didn't load
        if (businessesResult.status !== 'fulfilled') {
          throw new Error(businessesResult.reason?.message || 'Kon projecten niet laden');
        }
        const data = businessesResult.value;

        // Themes and public projects degrade gracefully
        const themesData = themesResult.status === 'fulfilled' ? themesResult.value : [];
        const publicProjects = publicProjectsResult.status === 'fulfilled' ? publicProjectsResult.value : [];

        setThemes(themesData || []);

        // Build project -> themes mapping from public projects
        const projectThemesMap = {};
        (publicProjects || []).forEach(p => {
          if (p.id && p.themes) {
            projectThemesMap[p.id] = p.themes;
          }
        });

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
                themes: projectThemesMap[project.id] || [],
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

  const handleFilter = ({ searchInput, selectedSkills, sector, location, companySize, showOnlyMyWork, selectedTheme, statusFilter }) => {
    const formattedSearch = searchInput.trim().replace(/\s+/g, ' ')
    setError(null);

    // Check if any filter is active
    const hasFilters = formattedSearch || selectedSkills.length > 0 || sector || location || companySize || showOnlyMyWork || selectedTheme || (statusFilter && statusFilter !== 'all');

    if (!hasFilters) {
      setShownBusinesses(initialBusinesses);
      return;
    }

    let filteredData = initialBusinesses;

    // "My work" filter - show only businesses where student is working
    if (showOnlyMyWork) {
      filteredData = filteredData.filter(b => 
        workingBusinessIds.has(b.business?.businessId || b.id)
      );
    }

    // Sector filter
    if (sector) {
      filteredData = filteredData.filter(b => 
        b.business.sector?.toLowerCase() === sector.toLowerCase()
      );
    }

    // Location (city) filter - searches in the location string
    if (location) {
      filteredData = filteredData.filter(b => 
        b.business.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Company size filter
    if (companySize) {
      filteredData = filteredData.filter(b => 
        b.business.companySize?.toLowerCase() === companySize.toLowerCase()
      );
    }

    // Theme filter - filter businesses that have at least one project with the selected theme
    if (selectedTheme) {
      filteredData = filteredData.map(business => {
        const filteredProjects = business.projects.filter(project =>
          project.themes?.some(t => t.id === selectedTheme)
        );
        if (filteredProjects.length > 0) {
          return { ...business, projects: filteredProjects };
        }
        return null;
      }).filter(Boolean);
    }

    // Status filter - filter projects by their end_date
    if (statusFilter && statusFilter !== 'all') {
      const now = new Date();
      filteredData = filteredData.map(business => {
        const filteredProjects = business.projects.filter(project => {
          if (statusFilter === 'active') {
            // Active: no end_date or end_date in the future
            return !project.end_date || new Date(project.end_date) >= now;
          } else if (statusFilter === 'completed') {
            // Completed: end_date in the past
            return project.end_date && new Date(project.end_date) < now;
          }
          return true;
        });
        if (filteredProjects.length > 0) {
          return { ...business, projects: filteredProjects };
        }
        return null;
      }).filter(Boolean);
    }

    // Search filter
    if (formattedSearch) {
      filteredData = filteredData.map(business => {
        const businessNameMatch = isSearchInString(formattedSearch, business.business.name);
        const businessLocationMatch = isSearchInString(formattedSearch, business.business.location || "");
        const filteredProjects = business.projects.filter(project =>
          isSearchInString(formattedSearch, project.title) ||
          isSearchInString(formattedSearch, project.location || "")
        );

        if (businessNameMatch || businessLocationMatch || filteredProjects.length > 0) {
          return {
            ...business,
            projects: (businessNameMatch || businessLocationMatch) ? business.projects : filteredProjects
          };
        }
        return null;
      })
        .filter(data => data !== null)
        .sort((a, b) => a.business.name.localeCompare(b.business.name));
    }

    // Skills filter
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
      const activeFilters = [];
      if (showOnlyMyWork) activeFilters.push('mijn werk');
      if (formattedSearch) activeFilters.push(`"${formattedSearch}"`);
      if (selectedSkills.length > 0) activeFilters.push(selectedSkills.map(s => s.name).join(', '));
      if (sector) activeFilters.push(`sector: ${sector}`);
      if (location) activeFilters.push(`stad: ${location}`);
      if (companySize) activeFilters.push(`grootte: ${companySize}`);
      if (selectedTheme) {
        const theme = themes.find(t => t.id === selectedTheme);
        activeFilters.push(`thema: ${theme?.name || selectedTheme}`);
      }
      if (statusFilter && statusFilter !== 'all') activeFilters.push(`status: ${statusFilter}`);
      
      setError(`Geen resultaten gevonden voor ${activeFilters.join(' + ')}.`);
    }

    setShownBusinesses(filteredData);
  };

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
        onFilter={handleFilter} 
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

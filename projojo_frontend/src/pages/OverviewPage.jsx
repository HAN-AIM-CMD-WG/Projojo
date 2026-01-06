import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import DashboardsOverview from "../components/DashboardsOverview";
import Filter from "../components/Filter";
import Loading from '../components/Loading';
import { getBusinessesComplete } from '../services';
import { normalizeSkill } from '../utils/skills';
import { useStudentSkills } from '../context/StudentSkillsContext';

export default function OverviewPage() {
  const { studentName, studentSkills } = useStudentSkills();
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

  const handleFilter = ({ searchInput, selectedSkills, country, sector, location, companySize }) => {
    const formattedSearch = searchInput.trim().replace(/\s+/g, ' ')
    setError(null);

    // Check if any filter is active
    const hasFilters = formattedSearch || selectedSkills.length > 0 || country || sector || location || companySize;

    if (!hasFilters) {
      setShownBusinesses(initialBusinesses);
      return;
    }

    let filteredData = initialBusinesses;

    // Country filter
    if (country) {
      filteredData = filteredData.filter(b => 
        b.business.country?.toLowerCase() === country.toLowerCase()
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

    // Search filter
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
      if (formattedSearch) activeFilters.push(`"${formattedSearch}"`);
      if (selectedSkills.length > 0) activeFilters.push(selectedSkills.map(s => s.name).join(', '));
      if (country) activeFilters.push(`land: ${country}`);
      if (sector) activeFilters.push(`sector: ${sector}`);
      if (location) activeFilters.push(`stad: ${location}`);
      if (companySize) activeFilters.push(`grootte: ${companySize}`);
      
      setError(`Geen resultaten gevonden voor ${activeFilters.join(' + ')}.`);
    }

    setShownBusinesses(filteredData);
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  // Count OPEN POSITIONS that match student skills (marketplace model)
  const studentSkillIds = new Set(studentSkills.map(s => s.id));
  
  const { totalOpenPositions, matchingOpenPositions } = shownBusinesses.reduce((acc, business) => {
    business.projects.forEach(project => {
      project.tasks?.forEach(task => {
        const available = Math.max(0, (task.total_needed || 0) - (task.total_accepted || 0));
        acc.totalOpenPositions += available;
        
        // Check if task matches student skills
        const taskSkillIds = new Set(task.skills?.map(s => s.skillId || s.id) || []);
        const hasMatchingSkill = [...taskSkillIds].some(id => studentSkillIds.has(id));
        if (hasMatchingSkill) {
          acc.matchingOpenPositions += available;
        }
      });
    });
    return acc;
  }, { totalOpenPositions: 0, matchingOpenPositions: 0 });

  return (
    <>
      {/* Page header - clear purpose */}
      <div className="pt-4 mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Ontdek projecten
        </h1>
        <p className="text-base text-[var(--text-muted)] font-medium mt-2">
          {matchingOpenPositions > 0 && studentSkills.length > 0 ? (
            <>
              <span className="text-primary font-bold">{matchingOpenPositions}</span> {matchingOpenPositions === 1 ? 'project matcht' : 'projecten matchen'} met jouw skills
            </>
          ) : totalOpenPositions > 0 ? (
            <>
              <span className="text-[var(--text-primary)] font-bold">{totalOpenPositions}</span> open {totalOpenPositions === 1 ? 'plek' : 'plekken'} beschikbaar
            </>
          ) : (
            'Vind projecten die passen bij jouw skills en interesses'
          )}
        </p>
      </div>

      <Filter 
        onFilter={handleFilter} 
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
      />
      <div className={`flex flex-col gap-2 ${(error != null) && 'mb-4'}`}>
        <Alert text={error} isCloseable={false} />
      </div>
      {isLoading && <Loading />}
      <DashboardsOverview businesses={shownBusinesses} />
    </>
  );
}

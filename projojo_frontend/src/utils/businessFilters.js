/**
 * What Filter reports back while the user has not touched any of its controls.
 *
 * Must stay key-for-key in step with the object Filter builds - a criterion added
 * there and not here is `undefined` on the first render, before Filter has called
 * back for the first time.
 *
 * @see Filter.jsx `triggerFilter`
 */
export const NO_FILTERS = {
  searchInput: '',
  selectedSkills: [],
  sector: null,
  location: null,
  companySize: null,
  showOnlyMyWork: false,
  selectedTheme: null,
  statusFilter: 'all'
};

const isSearchInString = (search, string) => string.toLowerCase().includes(search.toLowerCase());

/**
 * Apply the active filters to the businesses the page has loaded.
 *
 * Deliberately pure, and deliberately not a callback that writes its result to
 * state. Filter debounces a keystroke by 300ms, so it calls back from a timer that
 * was created in an earlier render: a callback closing over the business list would
 * filter that list as it was when the key was pressed - empty, if the page was still
 * loading - and nothing would re-apply the filter to the data arriving afterwards.
 * Deriving the shown list from the current data and the current filters makes the
 * ordering of the two irrelevant.
 *
 * @returns {{ businesses: Array, noResultsMessage: string | null }}
 */
export function applyFilters(initialBusinesses, filters, workingBusinessIds, themes) {
  const { searchInput, selectedSkills, sector, location, companySize, showOnlyMyWork, selectedTheme, statusFilter } = filters;
  const formattedSearch = searchInput.trim().replace(/\s+/g, ' ')

  // Check if any filter is active
  const hasFilters = formattedSearch || selectedSkills.length > 0 || sector || location || companySize || showOnlyMyWork || selectedTheme || (statusFilter && statusFilter !== 'all');

  // Load-bearing, not a fast path: falling through with no filters active would
  // reach the empty-result branch below with nothing to name, and report the
  // malformed "Geen resultaten gevonden voor ." on every page that loads no data.
  if (!hasFilters) {
    return { businesses: initialBusinesses, noResultsMessage: null };
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

  let noResultsMessage = null;

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

    noResultsMessage = `Geen resultaten gevonden voor ${activeFilters.join(' + ')}.`;
  }

  return { businesses: filteredData, noResultsMessage };
}

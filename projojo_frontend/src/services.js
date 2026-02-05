export const API_BASE_URL = "http://localhost:8000/";
export const IMAGE_BASE_URL = `${API_BASE_URL}image/`;
export const PDF_BASE_URL = `${API_BASE_URL}pdf/`;

export class HttpError extends Error {
    #statusCode;

    /**
     * @return {number}
     */
    get statusCode() {
        return this.#statusCode;
    }

    constructor(message, statusCode) {
        super(message);
        this.#statusCode = statusCode;
    }
}

/**
 *
 * @param {string} url
 * @param {RequestInit} request
 * @param {true|false} returnsVoid
 * @returns
 */
function fetchWithError(url, request = {}, returnsVoid = false) {
    let errorStatus = undefined;

    // Set intelligent defaults based on HTTP method and request body
    const method = request.method?.toLowerCase() || 'get';
    const hasFormData = request.body instanceof FormData;

    let defaultHeaders = {
        'Accept': 'application/json',
    };

    // Add Content-Type for requests that send data, but not for FormData
    if (['post', 'put', 'patch'].includes(method) && !hasFormData) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    // Merge headers: defaults < provided headers (allows overrides)
    let headers = {
        ...defaultHeaders,
        ...request.headers,
    };

    // Automatically add authorization header if token exists
    const token = localStorage.getItem("token");

    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    return fetch(url, {
        ...request,
        headers: headers,
    })
        .then(response => {
            if (!response.ok) {
                errorStatus = response.status;
                return response.text();
            }

            if (!returnsVoid) {
                return response.json();
            }
        })
        .then(json => {
            if (errorStatus !== undefined) {
                let message;
                try {
                    const jsonObj = JSON.parse(json);
                    // checks if detail field exists and is non-empty
                    if (typeof jsonObj !== "object" || jsonObj.detail === undefined || jsonObj.detail === null || jsonObj.detail === "") {
                        // doesnt exist or is empty. Go to catch block
                        throw new Error();
                    }
                    message = jsonObj.detail;
                } catch {
                    // assign default message based on status code
                    switch (errorStatus) {
                        case 400:
                            message = "Ongeldig verzoek. Controleer je invoer.";
                            break;
                        case 401:
                            message = "Je moet ingelogd zijn om dit te doen.";
                            break;
                        case 403:
                            message = "Je hebt geen rechten voor deze actie.";
                            break;
                        case 404:
                            message = "Dit konden we niet vinden.";
                            break;
                        case 409:
                            message = "Er is een conflict met bestaande gegevens. Controleer je invoer.";
                            break;
                        case 429:
                            message = "Te veel verzoeken. Probeer het later opnieuw.";
                            break;
                        default:
                            message = "Er is een onverwachte fout opgetreden.";
                            break;
                    }
                }

                // makes the error catchable in the calling code
                throw new HttpError(message, errorStatus);
            }
            return json;
        })
}

/**
 * @param {string} businessId business ID parameter for getting only the projects for 1 business
 * @returns { Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string}[]> }
 */
export function getProjectsWithBusinessId(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/projects`)
}

/**
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string}[]>}
 */
export function getProjects() {
    return fetchWithError(`${API_BASE_URL}projects`);
}

/**
 * Get all public projects for the discovery page (no authentication required)
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, business: object, open_positions: number, skills: string[]}[]>}
 */
export function getPublicProjects() {
    // Fetch without authentication
    return fetch(`${API_BASE_URL}projects/public`, {
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new HttpError("Failed to fetch public projects", response.status);
        }
        return response.json();
    });
}

/**
 * Get a specific public project by ID (no authentication required)
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export function getPublicProject(projectId) {
    return fetch(`${API_BASE_URL}projects/public/${projectId}`, {
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new HttpError("Project niet gevonden", response.status);
        }
        return response.json();
    });
}

/**
 * Set project visibility (public/private)
 * @param {string} projectId
 * @param {boolean} isPublic
 */
export function setProjectVisibility(projectId, isPublic) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/visibility?is_public=${isPublic}`, {
        method: 'PATCH'
    });
}

/**
 * Set project impact summary
 * @param {string} projectId
 * @param {string|null} impactSummary
 */
export function setProjectImpact(projectId, impactSummary) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/impact`, {
        method: 'PATCH',
        body: JSON.stringify({ impact_summary: impactSummary })
    });
}

// ============================================================================
// THEME ENDPOINTS
// ============================================================================

/**
 * Get all themes (public endpoint)
 * @returns {Promise<{id: string, name: string, sdg_code?: string, icon?: string, description?: string, color?: string, display_order?: number}[]>}
 */
export function getThemes() {
    return fetch(`${API_BASE_URL}themes/`, {
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new HttpError("Failed to fetch themes", response.status);
        }
        return response.json();
    });
}

/**
 * Get themes for a specific project (public endpoint)
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export function getProjectThemes(projectId) {
    return fetch(`${API_BASE_URL}themes/project/${projectId}`, {
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new HttpError("Failed to fetch project themes", response.status);
        }
        return response.json();
    });
}

/**
 * Create a new theme (teacher only)
 * @param {object} theme
 * @returns {Promise<object>}
 */
export function createTheme(theme) {
    return fetchWithError(`${API_BASE_URL}themes`, {
        method: 'POST',
        body: JSON.stringify(theme)
    });
}

/**
 * Update a theme (teacher only)
 * @param {string} themeId
 * @param {object} theme
 * @returns {Promise<object>}
 */
export function updateTheme(themeId, theme) {
    return fetchWithError(`${API_BASE_URL}themes/${themeId}`, {
        method: 'PUT',
        body: JSON.stringify(theme)
    });
}

/**
 * Delete a theme (teacher only)
 * @param {string} themeId
 * @returns {Promise<object>}
 */
export function deleteTheme(themeId) {
    return fetchWithError(`${API_BASE_URL}themes/${themeId}`, {
        method: 'DELETE'
    });
}

/**
 * Link a project to themes (replaces existing links)
 * @param {string} projectId
 * @param {string[]} themeIds
 * @returns {Promise<object>}
 */
export function linkProjectThemes(projectId, themeIds) {
    return fetchWithError(`${API_BASE_URL}themes/project/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ theme_ids: themeIds })
    });
}

/**
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, location: string[], projects: any[]}[]>}
 */
export function getBusinessesComplete() {
    return fetchWithError(`${API_BASE_URL}businesses/complete`);
}

/**
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, location: string[]}[]>}
 */
export function getBusinessesBasic() {
    return fetchWithError(`${API_BASE_URL}businesses/basic`);
}

/**
 *
 * @param {string} projectId
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string, tasks: any[]}>}
 */
export function getProject(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/complete`)
}

// This function is not available in the backend

/**
 *
 * @returns {Promise<{ type: "none" } | { type: "student" | "invalid" | "teacher", userId: number } | { type: "supervisor", userId: number, businessId: number }>}
 */
export function getAuthorization() {
    return localStorage.getItem("token")
}

// This function is not available in the backend

// This function is not available in the backend

/**
 * @param {string} projectId
 * @returns {Promise<{id: string, name: string, description: string, total_needed: number, created_at: string, project_id: string, skills: skill[]}[]>}
 */
export function getTasks(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/tasks`);
}

// This function is not available in the backend

/**
 *
 * @param {string} userId
 * @returns {Promise<{id: string, email: string, full_name: string, image_path: string, type: string, oauth_providers: {provider_name: string, oauth_sub: string}[] | null, skill_ids: {skill_id: string}[], registered_task_ids: {task_id: string}[], Skills: {id: string, name: string, is_pending: boolean, created_at: string, description: string}[]}>}
 */
export function getUser(userId) {
    return fetchWithError(`${API_BASE_URL}users/${userId}`);
}

// This function is not available in the backend

// This function is not available in the backend

/**
 *
 * @returns {Promise<{id: string, name: string, is_pending: boolean}[]>}
 */
export function getSkills() {
    return fetchWithError(`${API_BASE_URL}skills`);
}
/**
 * @param {string} studentId
 * @returns {Promise<{student: any, skills: {id: string, name: string, is_pending: boolean, created_at: string, description: string}[]}>}
 */
export function getSkillsFromStudent(studentId) {
    return fetchWithError(`${API_BASE_URL}students/${studentId}/skills`);
}


/**
 * @param {string} studentId
 * @param {string[]} skillIds - Array of skill IDs
 */
export function updateStudentSkills(studentId, skillIds) {
    return fetchWithError(`${API_BASE_URL}students/${studentId}/skills`, {
        method: "PUT",
        body: JSON.stringify(skillIds),
    });
}

export function updateStudentSkillDescription(studentId, skill) {
    const skillId = skill.skillId || skill.id;
    return fetchWithError(`${API_BASE_URL}students/${studentId}/skills/${skillId}`, {
        method: "PATCH",
        body: JSON.stringify(skill),
    });
}

/**
 * Update student profile (description, profile picture, CV)
 * @param {string} email - Student email
 * @param {FormData} formData - Form data containing description, profilePicture, and cv
 * @returns {Promise<{message: string}>}
 */
export function updateStudent(email, formData) {
    return fetchWithError(`${API_BASE_URL}students/${email}`, {
        method: "PUT",
        body: formData,
    });
}

/**
 * @param {string} taskId
 * @returns {Promise<{student: {id: string, full_name: string, skills: {id: string, name: string, is_pending: boolean, created_at: string, description: string}[]}, reason: string}[]>}
 */
export function getRegistrations(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations`);
}

/**
 * Get all registrations for a task (pending and accepted) with full timeline.
 * Used for task progress management UI.
 * @param {string} taskId
 * @returns {Promise<{
 *   pending: Array<{student: {id: string, full_name: string, skills: Array}, reason: string, requested_at: string}>,
 *   accepted: Array<{student: {id: string, full_name: string, skills: Array}, reason: string, requested_at: string, accepted_at: string, started_at: string|null, completed_at: string|null}>
 * }>}
 */
export function getAllRegistrations(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations/all`);
}

/**
 * @returns {Promise<string[]>}
 */
export function getStudentRegistrations() {
    return fetchWithError(`${API_BASE_URL}students/registrations`);
}


/**
 *
 * @param {Skill} skill - The skill object to create
 * @returns {Promise<{id: string, name: string, is_pending: boolean}>}
 */
export function createSkill(skill) {
    return fetchWithError(`${API_BASE_URL}skills`, {
        method: "POST",
        body: JSON.stringify(skill),
    });
}

/**
 *
 * @param {ProjectCreation} project_creation - The project_creation object to create with image file
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string, supervisor_id: string}>}
 */
export function createProject(project_data) {
    // Create form data for multi-part form submission
    const formData = new FormData();

    // Add text fields
    formData.append("name", project_data.name);
    formData.append("description", project_data.description);
    formData.append("supervisor_id", project_data.supervisor_id);
    formData.append("business_id", project_data.business_id);
    if (project_data.location !== undefined) {
        formData.append("location", project_data.location);
    }
    
    // Add date fields (as ISO strings)
    if (project_data.start_date) {
        formData.append("start_date", project_data.start_date);
    }
    if (project_data.end_date) {
        formData.append("end_date", project_data.end_date);
    }

    // Add image file
    if (project_data.imageFile) {
        formData.append("image", project_data.imageFile);
    }

    return fetchWithError(`${API_BASE_URL}projects`, {
        method: "POST",
        // Don't set Content-Type header, it will be set automatically with the correct boundary
        body: formData,
    });
}

export function createTask(projectId, formDataObj) {
    const taskData = {
        name: formDataObj.title,
        description: formDataObj.description,
        total_needed: formDataObj.totalNeeded,
        start_date: formDataObj.start_date || null,
        end_date: formDataObj.end_date || null
    };

    return fetchWithError(`${API_BASE_URL}tasks/${projectId}`, {
        method: "POST",
        body: JSON.stringify(taskData),
    });
}

/**
 * @param {string} taskId
 * @param {string} motivation
 * @returns {Promise<void>}
 */
export function createRegistration(taskId, motivation) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations`, {
        method: "POST",
        body: JSON.stringify({ motivation: motivation }),
    });
}

/**
 * @param {Object} registration - The registration object to update
 * @param {string} registration.taskId - The ID of the task
 * @param {string} registration.userId - The ID of the user
 * @param {boolean} registration.accepted - Whether the registration is accepted
 * @param {string} registration.response - The response to the registration
 * @return {Promise<void>}
 */
export function updateRegistration(registration) {
    return fetchWithError(`${API_BASE_URL}tasks/${registration.taskId}/registrations/${registration.userId}`, {
        method: "PUT",
        body: JSON.stringify({
            accepted: registration.accepted,
            response: registration.response || ""
        }),
    });
}

/**
 * Cancel a pending registration for a task
 * @param {string} taskId - The ID of the task
 * @returns {Promise<void>}
 */
export function cancelRegistration(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations`, {
        method: "DELETE",
    });
}

/**
 * Get dashboard data for the authenticated supervisor
 * @returns {Promise<{business_id: string, projects: Array, pending_registrations: Array, active_students: Array, stats: Object}>}
 */
export function getSupervisorDashboard() {
    return fetchWithError(`${API_BASE_URL}supervisors/dashboard`);
}

//Not implemented in the backend yet
export function updateTaskSkills(taskId, taskSkills) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/skills`, {
        method: "PUT",
        body: JSON.stringify(taskSkills),
    });
}

/**
 * @param {string} businessId - The business ID to update
 * @param {FormData} formData - The form data containing business information (name, location, description, image)
 * @returns {Promise<void>}
 */
export function updateBusiness(businessId, formData) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}`, {
        method: "PUT",
        body: formData,
    }, true);
    }

/**
 * @param {string} taskId - The task ID to update
 * @param {FormData} formData - The form data containing task information (name, description, total_needed)
 * @returns {Promise<void>}
 */
export function updateTask(taskId, formData) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}`, {
        method: "PUT",
        body: formData,
    }, true);
}

/**
 * Update a project's full data (name, description, location, image)
 * @param {string} projectId
 * @param {FormData} formData
 */
export function updateProject(projectId, formData) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}`, {
        method: "PUT",
        body: formData,
    }, true);
}

/**
 * @param {string} skillId
 * @returns {Promise<void>}
 */
export function getSkill(skillId) {
    return fetchWithError(`${API_BASE_URL}skills/${skillId}`);
}

/**
 * @param {string} studentId
 * @returns {Promise<void>}
 */
export function getStudentSkills(studentId) {
    return fetchWithError(`${API_BASE_URL}students/${studentId}/skills`);
}

// This function is not available in the backend

/**
 *
 * @param {string} taskId
 * @returns {Promise<{id: string, name: string, is_pending: boolean}[]>}
 */
export function getTaskSkills(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/skills`)
}

/**
 * @param {string} newBusinessName
 * @param {boolean} asDraft - If true, create as archived (hidden from students)
 */
export function createNewBusiness(newBusinessName, asDraft = false) {
    return fetchWithError(`${API_BASE_URL}businesses/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newBusinessName, as_draft: asDraft }),
    });
}

/**
 * @param {string} businessId
 * @returns {Promise<{ key: string, inviteType: "business", isUsed: boolean, createdAt: string, businessId: string }>}
 */
export function createSupervisorInviteKey(businessId) {
    return fetchWithError(`${API_BASE_URL}invites/supervisor/${businessId}`, {
        method: "POST",
    });
}

/**
 * @returns {Promise<{ key: string, inviteType: "teacher", isUsed: boolean, createdAt: string }>}
 */
export function createTeacherInviteKey() {
    return fetchWithError(`${API_BASE_URL}invites/teacher`, {
        method: "POST",
    });
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllUsers() {
    return fetchWithError(`${API_BASE_URL}users`);
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllSupervisors() {
    return fetchWithError(`${API_BASE_URL}supervisors`);
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllStudents() {
    return fetchWithError(`${API_BASE_URL}students`);
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllTeachers() {
    return fetchWithError(`${API_BASE_URL}teachers`);
}

/**
 * @param {string} businessId
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, location: string[], projects: any[]}>}
 */
export function getBusinessById(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}`);
}

/**
 * Get all archived businesses (teacher only)
 * @returns {Promise<Array>}
 */
export function getArchivedBusinesses() {
    return fetchWithError(`${API_BASE_URL}businesses/archived`);
}

/**
 * Archive a business (teacher only)
 * @param {string} businessId
 * @returns {Promise<{message: string}>}
 */
export function archiveBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/archive`, {
        method: "PATCH",
    });
}

/**
 * Restore an archived business (teacher only)
 * @param {string} businessId
 * @returns {Promise<{message: string}>}
 */
export function restoreBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/restore`, {
        method: "PATCH",
    });
}

/**
 * @param {string} taskId
 * @returns {Promise<Task>}
 */
export function getTaskById(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}`);
}

export function preprocessMarkdown(input) {
    return input
        .replace(/__([^_]+)__/g, '<u>$1</u>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/&gt;/g, '>')
}

/**
 * Get student email addresses for a specific task based on selection criteria
 * @param {string[]} selection - Array of status strings: ['registered', 'accepted', 'rejected']
 * @param {string} taskId - Task ID
 * @returns {Promise<string[]>} Array of email addresses
 */
export function getStudentEmailAddresses(selection, taskId) {
    const selectionString = selection.join(',');
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/student-emails?selection=${selectionString}`);
}

/**
 * Get colleague email addresses (teachers and supervisors)
 * @returns {Promise<string[]>} Array of email addresses
 */
export function getColleaguesEmailAddresses(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/emails/colleagues`);
}

/**
 * Mark a skill as accepted/declined (both remove pending state)
 * @param {string} skillId
 * @param {boolean} accepted
 * @returns {Promise<void>}
 */
export function updateSkillAcceptance(skillId, accepted) {
    return fetchWithError(`${API_BASE_URL}skills/${skillId}/acceptance`, {
        method: "PATCH",
        body: JSON.stringify({ accepted }),
    }, true);
}

/**
 * Rename a skill (teacher-only)
 * @param {string} skillId
 * @param {string} name
 * @returns {Promise<void>}
 */
export function updateSkillName(skillId, name) {
    return fetchWithError(`${API_BASE_URL}skills/${skillId}/name`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    }, true);
}

// ============================================================================
// EMAIL TEST FUNCTION - REMOVE AFTER TESTING
// ============================================================================
/**
 * Send a test email to verify MailHog integration
 * @param {string} recipientEmail - Email address to send the test email to
 * @returns {Promise<{status: string, message: string}>}
 *
 * REMOVE THIS FUNCTION AFTER TESTING EMAIL FUNCTIONALITY
 */
export function sendTestEmail(recipientEmail) {
    return fetchWithError(`${API_BASE_URL}test/email`, {
        method: "POST",
        body: JSON.stringify({ recipient_email: recipientEmail }),
    });
}
// ============================================================================
// END EMAIL TEST FUNCTION - REMOVE AFTER TESTING
// ============================================================================

// ============================================
// Project Archive/Delete Functions
// ============================================

/**
 * Get all students registered for tasks in a project
 * @param {string} projectId
 * @returns {Promise<Array<{student_id: string, student_name: string, student_email: string, task_id: string, task_name: string, is_accepted: boolean, is_completed: boolean}>>}
 */
export function getProjectStudents(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/students`);
}

/**
 * Archive a project (supervisor: own projects, teacher: all)
 * @param {string} projectId
 * @param {boolean} confirm - Set to true to confirm despite affected students
 * @returns {Promise<{message: string, notified_count?: number} | {message: string, affected_students: Array, requires_confirmation: boolean}>}
 */
export function archiveProject(projectId, confirm = false) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/archive?confirm=${confirm}`, {
        method: "PATCH",
    });
}

/**
 * Restore an archived project (supervisor: own projects, teacher: all)
 * @param {string} projectId
 * @returns {Promise<{message: string}>}
 */
export function restoreProject(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/restore`, {
        method: "PATCH",
    });
}

/**
 * Permanently delete a project (teacher only)
 * Creates portfolio snapshots for completed tasks before deletion
 * @param {string} projectId
 * @param {boolean} confirm - Set to true to confirm despite affected students
 * @returns {Promise<{message: string, snapshots_created?: number, notified_count?: number} | {message: string, affected_students: Array, requires_confirmation: boolean}>}
 */
export function deleteProject(projectId, confirm = false) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}?confirm=${confirm}`, {
        method: "DELETE",
    });
}

/**
 * Get student portfolio (completed tasks + snapshots)
 * @param {string} studentId
 * @returns {Promise<{student_id: string, student_name: string, items: Array, total_count: number, live_count: number, snapshot_count: number}>}
 */
export function getStudentPortfolio(studentId) {
    return fetchWithError(`${API_BASE_URL}students/${studentId}/portfolio`);
}

// ============================================
// Task Timeline Functions
// ============================================

/**
 * Mark a task registration as started
 * @param {string} taskId
 * @param {string} studentId
 * @returns {Promise<{message: string}>}
 */
export function markTaskStarted(taskId, studentId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations/${studentId}/start`, {
        method: "PATCH",
    });
}

/**
 * Mark a task registration as completed (supervisor/teacher only)
 * @param {string} taskId
 * @param {string} studentId
 * @returns {Promise<{message: string}>}
 */
export function markTaskCompleted(taskId, studentId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations/${studentId}/complete`, {
        method: "PATCH",
    });
}

/**
 * Get the timeline for a task registration
 * @param {string} taskId
 * @param {string} studentId
 * @returns {Promise<{requested_at: string, accepted_at: string, started_at: string, completed_at: string, is_accepted: boolean}>}
 */
export function getRegistrationTimeline(taskId, studentId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/registrations/${studentId}/timeline`);
}

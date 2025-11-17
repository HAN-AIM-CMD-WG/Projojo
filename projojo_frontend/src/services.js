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
                const jsonObj = JSON.parse(json);
                try {
                    if (typeof jsonObj !== "object" || jsonObj.detail === undefined || jsonObj.detail === null || jsonObj.detail === "") {
                        throw new Error();
                    }
                    message = jsonObj.detail;
                } catch {

                    switch (errorStatus) {
                        case 401:
                            message = message ?? "U bent niet geautoriseerd om dit te doen.";
                            break;
                        case 403:
                            message = message ?? "U bent niet geautoriseerd om dit te doen.";
                            break;
                        case 404:
                            message = message ?? "De url waar naar gezocht wordt kan niet gevonden worden.";
                            break;
                        case 409:
                            message = message ?? "Er is een probleem opgetreden, mogelijk omdat de ingevoerde gegevens al bestaan in het systeem.";
                            break;
                        default:
                            message = message ?? "Er is een onverwachte fout opgetreden.";
                            break;
                    }
                }


                throw new HttpError(message, errorStatus);
            }
            return json;
        })
}

/**
 * @param {Error} error
 * @param {Record<number, string>} mapper
 */
export function createErrorMessage(error, mapper) {
    let message = error?.message;
    if (error instanceof HttpError) {
        message = mapper[error.statusCode];
    }
    return message ?? "Er is een onverwachte fout opgetreden.";
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
    return fetchWithError(`${API_BASE_URL}students/${studentId}/skills/${skill.id}`, {
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
        project_id: projectId
    };

    return fetchWithError(`${API_BASE_URL}tasks/`, {
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

//Not implemented in the backend yet
export function updateTaskSkills(taskId, taskSkills) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/skills`, {
        method: "PUT",
        body: JSON.stringify(taskSkills),
    });
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
 *
 * @param {string} newBusinessName
 */
export function createNewBusiness(newBusinessName) {
    return fetchWithError(`${API_BASE_URL}businesses/`, {
        method: "POST",
        body: JSON.stringify(newBusinessName),
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
export function getColleaguesEmailAddresses() {
    return fetchWithError(`${API_BASE_URL}tasks/emails/colleagues`);
}

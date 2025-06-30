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
        headers.authorization = `bearer ${token}`;
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

// These functions have been replaced by getBusinessByName

/**
 * @param {string} businessName optional business name parameter for getting only the projects for 1 business
 * @returns { Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string}[]> }
 */
export function getProjectsWithBusinessId(businessName) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessName}/projects`)
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
 * @param {string} projectName
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, created_at: string, business_id: string, tasks: any[]}>}
 */
export function getProject(projectName) {
    return fetchWithError(`${API_BASE_URL}projects/${projectName}/complete`)
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
 * @param {string} projectName
 * @returns {Promise<{id: string, name: string, description: string, total_needed: number, created_at: string, project_id: string, skills: skill[]}[]>}
 */
export function getTasks(projectName) {
    return fetchWithError(`${API_BASE_URL}projects/${projectName}/tasks`);
}

// This function is not available in the backend

/**
 *
 * @param {string} email
 * @returns {Promise<{id: string, email: string, full_name: string, image_path: string, password_hash: string, type: string, school_account_name: string, skill_ids: string[], registered_task_ids: string[]}>}
 */
export function getUser(email) {
    return fetchWithError(`${API_BASE_URL}users/${email}`);
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
 * @param {string} email
 * @returns {Promise<{student: any, skills: {id: string, name: string, is_pending: boolean, created_at: string, description: string}[]}>}
 */
export function getSkillsFromStudent(email) {
    return fetchWithError(`${API_BASE_URL}students/${email}/skills`);
}

export function getRegistrations() {
    return fetchWithError(`${API_BASE_URL}registrations`);
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
//not implemented in the backend yet
export function createTask(task) {
    return fetchWithError(`${API_BASE_URL}projects`, {
        method: "POST",
        body: JSON.stringify(task),
    });
}
//not implemented in the backend yet
export function createRegistration(registration) {
    return fetchWithError(`${API_BASE_URL}registrations`, {
        method: "POST",
        body: JSON.stringify(registration),
    });
}
//Not implemented in the backend yet
export function updateRegistration(registration) {
    return fetchWithError(`${API_BASE_URL}registrations`, {
        method: "PUT",
        body: JSON.stringify(registration),
    });
}

//Not implemented in the backend yet
export function updateTaskSkills(name, taskSkills) {
    return fetchWithError(`${API_BASE_URL}tasks/${name}/skills`, {
        method: "PUT",
        body: JSON.stringify(taskSkills),
    });
}

/**
 * @param {string} name
 * @returns {Promise<void>}
 */
export function getSkill(name) {
    return fetchWithError(`${API_BASE_URL}task/${name}/skills`);
}

/**
 * @param {string} email
 * @returns {Promise<void>}
 */
export function getStudentSkills(email) {
    return fetchWithError(`${API_BASE_URL}students/${email}/skills`);
}

// This function is not available in the backend

/**
 *
 * @param {string} taskName
 * @returns {Promise<{id: string, name: string, is_pending: boolean}[]>}
 */
export function getTaskSkills(taskName) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskName}/skills`)
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


export function login(credentials) {
    return fetchWithError(`${API_BASE_URL}login`, {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("payload");
    return this
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
 * @param {string} name
 * @returns {Promise<{id: string, name: string, description: string, image_path: string, location: string[], projects: any[]}>}
 */
export function getBusinessByName(name) {
    return fetchWithError(`${API_BASE_URL}businesses/${name}`);
}

/**
 * @param {string} name
 * @returns {Promise<Task>}
 */
export function getTaskByName(name) {
    return fetchWithError(`${API_BASE_URL}tasks/${name}`);
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

export const API_BASE_URL = "http://localhost:8000/test/";
export const FILE_BASE_URL = `${API_BASE_URL}files`;

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
function fetchWithError(url, request, returnsVoid = false) {
    let errorStatus = undefined;

    return fetch(url, {
        ...request,
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
                    if (typeof jsonObj !== "object" || jsonObj.message === undefined || jsonObj.message === null || jsonObj.message === "") {
                        throw new Error();
                    }
                    message = jsonObj.message;
                } catch {

                    switch (errorStatus) {
                        case 401:
                            message = "U bent niet ingelogd.";
                            break;
                        case 403:
                            message = "U bent niet geautoriseerd om dit te doen.";
                            break;
                        case 404:
                            message = "De url waar naar gezocht wordt kan niet gevonden worden.";
                            break;
                        default:
                            message = "Er is een onverwachte fout opgetreden.";
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
 * @returns { Promise<{ id: string, title: string, description: string, business: { name: string, description: string, location: string, photo: { path: string }  }, photo: { path: string }, projectTopSkills: { skillId: number, name: string, isPending: boolean }  }[] | undefined> }
 */
export function getProjectsWithBusinessId(businessName) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessName}/projects`, {
        headers: {
            Accept: 'application/json',
        },
        method: "GET"
    })
}

/**
 * 
 */
export function getProjects() {
    return fetchWithError(`${API_BASE_URL}projects`);
}
export function getBusinesses() {
    return fetchWithError(`${API_BASE_URL}businesses`);
}

/**
 * 
 * @param {string} projectName 
 * @returns {Promise<{ id: number, title: string, description: string, projectTopSkills: Awaited<ReturnType<typeof getSkills>>, business: Awaited<ReturnType<typeof getBusiness>>, photo: { path: string } }>}
 */
export function getProject(projectName) {
    return fetchWithError(`${API_BASE_URL}projects/${projectName}`)
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
 * @returns {Promise<{taskId: number, title: string, description: string, totalNeeded: number, totalAccepted: number, skills: { skillId: number, name: string, isPending: boolean }[]}[]>}
 */
export function getTasks(projectName) {
    return fetchWithError(`${API_BASE_URL}projects/${projectName}/tasks`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

// This function is not available in the backend

/**
 * 
 * @param {string} email 
 * @returns {Promise<User>}
 */
export function getUser(email) {
    return fetchWithError(`${API_BASE_URL}users/${email}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

// This function is not available in the backend

// This function is not available in the backend

/**
 * 
 * @returns {Promise<{id: string, name: string, isPending: boolean}[]>}
 */
export function getSkills() {
    return fetchWithError(`${API_BASE_URL}skills`);
}
export function getSkillsFromStudent(email) {
    return fetchWithError(`${API_BASE_URL}students/${email}/skills`);
}

/**
 * 
 * @param {Skill} skill - The skill object to create
 * @returns {Promise<{skillId: number, name: string, isPending: boolean}>}
 */
export function createSkill(skill) {
    return fetchWithError(`${API_BASE_URL}skills`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(skill),
    });
}

/**
 * @param {string} name
 * @returns {Promise<void>}
 */
export function getSkill(name) {
    return fetchWithError(`${API_BASE_URL}skills/${name}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @param {string} email
 * @returns {Promise<void>}
 */
export function getStudentSkills(email) {
    return fetchWithError(`${API_BASE_URL}students/${email}/skills`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

// This function is not available in the backend

/**
 * 
 * @param {string} taskName 
 * @returns {Promise<{skillId: number, name: string, isPending: boolean}[]>}
 */
export function getTaskSkills(taskName) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskName}/skills`)
}




export function login(credentials) {
    return fetchWithError(`${API_BASE_URL}login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
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
    return fetchWithError(`${API_BASE_URL}users`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllSupervisors() {
    return fetchWithError(`${API_BASE_URL}supervisors`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllStudents() {
    return fetchWithError(`${API_BASE_URL}students`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @returns {Promise<User[]>}
 */
export function getAllTeachers() {
    return fetchWithError(`${API_BASE_URL}teachers`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @param {string} name
 * @returns {Promise<Business>}
 */
export function getBusinessByName(name) {
    return fetchWithError(`${API_BASE_URL}businesses/${name}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @param {string} name
 * @returns {Promise<Task>}
 */
export function getTaskByName(name) {
    return fetchWithError(`${API_BASE_URL}tasks/${name}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
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

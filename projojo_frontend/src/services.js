export const API_BASE_URL = "http://localhost:8080/";
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
        credentials: "include",
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

/**
 * @param {FormData} formData 
 * @returns {Promise<void>}
 */
export function updateBusiness(formData) {
    return fetchWithError(`${API_BASE_URL}business`, {
        body: formData,
        method: "PUT",
    }, true);
}

/**
 * gets the business using the {@link businessId}
 * @param {number} businessId 
 * @returns { Promise<{ name: string, description: string, location: string, photo: { path: string }  } | undefined> }
 */
export function getBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}business/${businessId}`, {
        headers: {
            Accept: 'application/json',
        },
        method: "GET"
    });
}

/**
 * @param {number} businessId
 * @returns {Promise<{ link: string, expires: string }>}
 */
export function getBusinessInviteLink(businessId) {
    return fetchWithError(`${API_BASE_URL}invite`, {
        headers: {
            Accept: 'application/json',
        },
        body: businessId,
        method: "POST"
    });
}

/**
 * @param {string} businessName
 * @returns {Promise<{ id: number }>}
 */
export function createNewBusiness(businessName) {
    return fetchWithError(`${API_BASE_URL}business`, {
        headers: {
            Accept: 'application/json',
        },
        body: businessName,
        method: "POST"
    });
}

/**
 * @param {number | undefined} businessId optional businessId parameter for getting only the projects for 1 business
 * @returns { Promise<{ id: number, title: string, description: string, business: { name: string, description: string, location: string, photo: { path: string }  }, photo: { path: string }, projectTopSkills: { skillId: number, name: string, isPending: boolean }  }[] | undefined> }
 */
export function getProjectsWithBusinessId(businessId = undefined) {
    let url = `${API_BASE_URL}projects`;
    if (businessId !== undefined) {
        url = `${url}?businessId=${businessId}`;
    }

    return fetchWithError(url, {
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
    return fetchWithError(`${API_BASE_URL}projects/all`);
}

/**
 * 
 * @param {number} projectId 
 * @returns {Promise<{ id: number, title: string, description: string, projectTopSkills: Awaited<ReturnType<typeof getSkills>>, business: Awaited<ReturnType<typeof getBusiness>>, photo: { path: string } }>}
 */
export function getProject(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}`)
}

/**
 * @param {FormData} formData 
 * @returns {Promise<void>}
 */
export function createProject(formData) {
    return fetchWithError(`${API_BASE_URL}projects`, {
        method: 'POST',
        body: formData
    })
}

/**
 * 
 * @returns {Promise<{ type: "none" } | { type: "student" | "invalid" | "teacher", userId: number } | { type: "supervisor", userId: number, businessId: number }>}
 */
export function getAuthorization() {
    return fetchWithError(`${API_BASE_URL}verify`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    }).then(authentication => {
        if (authentication.type !== undefined) {
            authentication.type = authentication.type.toLowerCase();
        }
        return authentication;
    });
}

export function logout() {
    return fetchWithError(`${API_BASE_URL}logout`, {
        method: "POST",
    }, true);
}

export function getFile(filePath) {
    return fetch(`${FILE_BASE_URL}${filePath}`, {
        method: "GET",
        credentials: "include",
    }).then(response => {
        if (!response.ok) {
            throw new HttpError("An unexpected error occured", response.status);
        }
        return response.blob();
    }).then(blob => new File([blob], filePath, { type: blob.type }));
}

/**
 * @param {number} projectId 
 * @returns {Promise<{taskId: number, title: string, description: string, totalNeeded: number, totalAccepted: number, skills: { skillId: number, name: string, isPending: boolean }[]}[]>}
 */
export function getTasks(projectId) {
    return fetchWithError(`${API_BASE_URL}tasks/${projectId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * @param {number} projectId 
 * @param {{ taskId: number, projectId: number, title: string, description: string, totalNeeded: number }} taskDto 
 */
export function createTask(projectId, taskDto) {
    return fetchWithError(`${API_BASE_URL}tasks/${projectId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(taskDto),
    }, true);
}

/**
 * 
 * @param {number} studentId 
 * @returns {Promise<{ username: string, description: string, profilePicture: { path: string }, cv: { path: string }, skills: { description: string, skill: { name: string, skillId: number, isPending: boolean } }[]> }}
 */
export function getStudent(studentId) {
    return fetchWithError(`${API_BASE_URL}students/${studentId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });
}

/**
 * 
 * @param {FormData} formData 
 */
export function updateStudent(formData) {
    return fetchWithError(`${API_BASE_URL}students`, {
        method: "PUT",
        headers: {
            Accept: "application/json",
        },
        body: formData,
    }, true);
}

/**
 * 
 * @returns {Promise<number[]>}
 */
export function getUserRegistrations() {
    return fetchWithError(`${API_BASE_URL}registrations/existing-user-registrations`);
}

/**
 * 
 * @returns {Promise<{skillId: number, name: string, isPending: boolean}[]>}
 */
export function getSkills() {
    return fetchWithError(`${API_BASE_URL}skills`);
}

/**
 * 
 * @param {string} name
 * @returns {Promise<{skillId: number, name: string, isPending: boolean}>}
 */
export function createSkill(name) {
    return fetchWithError(`${API_BASE_URL}skills`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: name,
    });
}

/**
 * @param {number} skillId
 * @param {string} name
 * @returns {Promise<void>}
 */
export function updateSkillName(skillId, name) {
    return fetchWithError(`${API_BASE_URL}skills/${skillId}/name`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/text",
        },
        body: name,
    }, true);
}

/**
 * @param {number} skillId
 * @param {boolean} accepted
 * @returns {Promise<void>}
 */
export function updateSkillAcceptance(skillId, accepted) {
    return fetchWithError(`${API_BASE_URL}skills/${skillId}/acceptance`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: accepted,
    }, true);
}

/**
 * 
 * @param {number} taskId 
 * @param {string} motivation 
 * @returns {Promise<void>}
 */
export function createRegistration(taskId, motivation) {
    return fetchWithError(`${API_BASE_URL}registrations/${taskId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: motivation,
    }, true);
}

/**
 * 
 * @param {number} taskId 
 * @returns {Promise<{taskId: number, reason: string, accepted: boolean | null, response: string, student: Awaited<ReturnType<typeof getStudent>>}[]>}
 */
export function getRegistrations(taskId) {
    return fetchWithError(`${API_BASE_URL}registrations/${taskId}`)
}

/**
 * 
 * @param {{taskId: number, userId: number, accepted: boolean, response: string}} updatedRegistration 
 * @returns {Promise<void>}
 */
export function updateRegistration(updatedRegistration) {
    return fetchWithError(`${API_BASE_URL}registrations`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRegistration),
    }, true);
}

/**
 * @param {number[]} skillIds 
 * @returns {Promise<void>}
 */
export function updateTaskSkills(taskId, skillIds) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/skills`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(skillIds),
    }, true);
}

export function updateStudentSkills(skillIds) {
    return fetchWithError(`${API_BASE_URL}students/skills`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(skillIds),
    }, true);
}

export function login(username) {
    return fetchWithError(`${API_BASE_URL}login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(username),
    }, true);
}

/**
 * @param {number|undefined} businessId
 * @returns {Promise<{ link: string, date: Date }>}
 */
export function createBusinessInviteLink(businessId) {
    const json = (businessId ?? null)
    return fetchWithError(`${API_BASE_URL}invite`, {
        method: "POST",
        body: json,
        headers: {
            "Content-Type": "application/json",
        }
    }).then(r => {
        r.timestamp = new Date(new Date(r.timestamp).getTime() + 7 * 24 * 60 * 60 * 1000);
        return r;
    });
}

export function createColleagueInviteLink() {
    return fetchWithError(`${API_BASE_URL}invite`, {
        method: "POST",
    }).then(r => {
        r.timestamp = new Date(new Date(r.timestamp).getTime() + 7 * 24 * 60 * 60 * 1000);
        return r;
    });
}

/**
 * @param {string} email 
 * @returns 
 */
export function setEmail(email) {
    return fetchWithError(`${API_BASE_URL}set-email`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: email,
    }, true);
}

/**
 * @param {number} selection 
 * @param {number} taskId
 * @returns {Promise<string[]>}
 */
export function getStudentEmailAdresses(selection, taskId) {
    return fetchWithError(`${API_BASE_URL}students/email?selection=${selection}&taskId=${taskId}`, {
        method: "GET",
    });
}

/**
 * @returns {Promise<string[]>}
 */
export function getColleaguesEmailAdresses() {
    return fetchWithError(`${API_BASE_URL}business/email/all`, {
        method: "GET",
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
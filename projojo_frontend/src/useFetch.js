import { useEffect, useState } from "react";

/**
 * @template T
 * @param {{setIsLoading: (state: boolean) => void, setData: (state: T | undefined) => void, setError: (state: Error | undefined) => void; totalRetries: number, invalidate: boolean, retryCount: number}} wrapperData
 * @param {(invalid: { invalidate: boolean }) => Promise<T>} fetchCall
 */
function retry(fetchCall, wrapperData) {
    if (wrapperData.invalidate) {
        return false;
    }

    wrapperData.retryCount++;

    if (wrapperData.retryCount >= wrapperData.totalRetries) {
        return false;
    }
    fetchWrapper(fetchCall, wrapperData);
    return true;
}

/**
 * @template T
 * @param {{setIsLoading: (state: boolean) => void, setData: (state: T | undefined) => void, setError: (state: Error | undefined) => void; totalRetries: number, invalidate: boolean, retryCount: number}} wrapperData
 * @param {(invalid: { invalidate: boolean }) => Promise<T>} fetchCall
 */
function fetchWrapper(fetchCall, wrapperData) {
    return fetchCall(wrapperData)
        .then(gotData => {
            if (!wrapperData.invalidate) {
                wrapperData.setData(gotData);
                wrapperData.setError(undefined);
                wrapperData.setIsLoading(false);
            }
        })
        .catch(error => {
            if (!wrapperData.invalidate) {
                if (!retry(fetchCall, wrapperData)) {
                    wrapperData.setError(error);
                    wrapperData.setData(undefined);
                    wrapperData.setIsLoading(false);
                }
            }
        });
}

/**
 * Fetches a url safely using specific fetchData while retrying a number of times.
 * @template T
 * @param {(invalid: { invalidate: boolean }) => Promise<T>} fetchCall the fetch call that is used
 * @param {any[]} deps dependencies for when to rerun the {@link fetchCall}
 * @param {number} totalRetries the total number of retries for getting the {@link fetchCall} data
 * @returns { { data:undefined | T, error: undefined | Error, isLoading: boolean } }
 */
export default function useFetch(fetchCall, deps = undefined, totalRetries = 3) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState();
    const [error, setError] = useState();

    useEffect(() => {
        const wrapperData = {
            setIsLoading,
            setData,
            setError,
            totalRetries,
            invalidate: false,
            retryCount: 0,
        };
        fetchWrapper(fetchCall, wrapperData);
        return () => { wrapperData.invalidate = true; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps ?? []);

    return { data, error, isLoading };
}
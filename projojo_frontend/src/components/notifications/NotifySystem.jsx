import { useEffect, useState } from "react";
import Notification from "./Notification";

class NotificationSystem {
    #listeners = [];
    #queue = [];
    #showingMessage = false;
    #previousMessage = undefined;

    /**
     * 
     * @param {(message: string, color: string) => void} callback 
     */
    listen(callback) {
        this.#listeners.push(callback);
        if (this.#queue.length !== 0) {
            this.#emitQueue();
        }
    }

    removeListener(callback) {
        const index = this.#listeners.indexOf(callback);
        if (index !== -1) {
            this.#listeners.splice(index, 1);
        }
    }

    success(message) {
        this.#emit(message, "success");
    }

    error(message) {
        this.#emit(message, "error");
    }

    info(message) {
        this.#emit(message, "info");
    }

    async #emit(message, type) {
        if (this.#showingMessage || this.#listeners.length === 0) {
            this.#queue.push({ message, type });
            return;
        }

        this.#showingMessage = true;
        await this.#emitListeners(message, type);
        await this.#emitQueue();

        this.#showingMessage = false;
    }

    async #emitListeners(message, type) {
        if (message === this.#previousMessage) {
            return;
        }
        this.#previousMessage = message;

        setTimeout(() => {
            this.#previousMessage = undefined;
        }, 1000);

        const listeners = this.#listeners;
        const promises = [];
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            const value = listener(message, type);
            if (value instanceof Promise) {
                promises.push(value);
            }
        }
        await Promise.all(promises);
    }

    async #emitQueue() {
        for (let i = 0; i < this.#queue.length; i++) {
            const item = this.#queue[i];
            await this.#emitListeners(item.message, item.type);
        }
        this.#queue = [];
    }
}

const notificationDuration = 3000; // in milliseconds   
// eslint-disable-next-line react-refresh/only-export-components
export const notification = new NotificationSystem();

export default function NotifySystem({ children }) {
    const [notificationMessage, setNotificationMessage] = useState();
    const [notificationType, setNotificationType] = useState();
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const callback = (message, type) => {
            setNotificationMessage(message);
            setIsShown(true);
            setNotificationType(type);

            return new Promise(r => setTimeout(() => {
                setIsShown(false);
                setTimeout(() => {
                    r();
                }, 200);
            }, notificationDuration));
        };

        notification.listen(callback);

        return () => notification.removeListener(callback);
    }, []);

    return <>
        {children}
        <Notification message={notificationMessage} isShown={isShown} type={notificationType} onClose={() => setIsShown(false)} />
    </>;
}
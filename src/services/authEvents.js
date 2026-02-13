export const AUTH_EVENTS = {
    UNAUTHORIZED: 'auth_unauthorized'
};

export const emitUnauthorized = () => {
    window.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
};

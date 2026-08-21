export function canParseRedirectDestination(destination?: string | null): boolean {
    if (!destination) {
        return false;
    }

    return URL.canParse(destination) || URL.canParse(destination, window.location.href);
}

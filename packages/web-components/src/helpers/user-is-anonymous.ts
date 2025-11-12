import { User } from '@relewise/client';

export function userIsAnonymous(user: User) {
    return (!user.authenticatedId || user.authenticatedId === '')
        && (!user.temporaryId || user.temporaryId === '')
        && (!user.email || user.email === '')
        && (!user.identifiers || Object.keys(user.identifiers).length === 0);
}
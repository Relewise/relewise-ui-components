import { User, userIsAnonymous } from '@relewise/client';
type FavoriteRenderGuardArgs = {
    favoriteEnabled: boolean;
    entityId: string | null | undefined;
    user: User | null;
};

export function canRenderFavoriteButton({
    favoriteEnabled,
    entityId,
    user,
}: FavoriteRenderGuardArgs): boolean {
    if (!favoriteEnabled) {
        return false;
    }

    if (!entityId) {
        return false;
    }

    if (!user || userIsAnonymous(user)) {
        return false;
    }

    return true;
}

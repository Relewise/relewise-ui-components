import { User, userIsAnonymous } from '@relewise/client';
import { RelewiseUIOptions } from '../initialize';

type FavoriteRenderGuardArgs = {
    options: RelewiseUIOptions | null;
    favoriteEnabled: boolean;
    entityId: string | null | undefined;
    user: User | null;
    host: HTMLElement;
};

export function canRenderFavoriteButton({
    options,
    favoriteEnabled,
    entityId,
    user,
    host,
}: FavoriteRenderGuardArgs): boolean {
    if (!options) {
        host.toggleAttribute('hidden', true);
        return false;
    }

    if (!favoriteEnabled) {
        host.toggleAttribute('hidden', true);
        return false;
    }

    if (!entityId) {
        host.toggleAttribute('hidden', true);
        return false;
    }

    if (!user || userIsAnonymous(user)) {
        host.toggleAttribute('hidden', true);
        return false;
    }

    host.toggleAttribute('hidden', false);
    return true;
}

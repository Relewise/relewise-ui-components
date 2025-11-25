import { User, userIsAnonymous } from '@relewise/client';

type RenderGuardArgs = {
    enabled: boolean;
    entityId: string | null | undefined;
    user: User | null;
};

export function canRenderUserEngagementAction({
    enabled,
    entityId,
    user,
}: RenderGuardArgs): boolean {
    if (!enabled) {
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

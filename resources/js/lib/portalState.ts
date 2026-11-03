import { reactive } from 'vue';
import { portalRequest } from '@/lib/portalApi';
import { readIdentity } from '@/lib/portalData';
import type { PortalIdentity } from '@/types/portal';

export const portalState = reactive<{
    identity: PortalIdentity | null;
    loading: boolean;
    error: string | null;
}>({ identity: null, loading: true, error: null });
export async function refreshIdentity(background = false) {
    if (!background) {
        portalState.loading = true;
    }

    portalState.error = null;

    try {
        const identity = readIdentity(await portalRequest<unknown>('/me'));
        portalState.identity = identity;
    } catch (error) {
        portalState.identity = null;

        if (
            error instanceof Error &&
            !('status' in error && error.status === 401)
        ) {
            portalState.error =
                'We could not load your portal account. Please try again.';
        }
    } finally {
        portalState.loading = false;
    }
}

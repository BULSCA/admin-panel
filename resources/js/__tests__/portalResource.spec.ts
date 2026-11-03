import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { usePortalResource } from '@/composables/usePortalResource';
import { PortalError } from '@/lib/portalApi';
import {
    readIdentity,
    readOrganisationDetail,
    readOrganisationIndex,
    readCompetitions,
    readPresentation,
} from '@/lib/portalData';
import { identity, organisationDetail } from './portalFixtures';
vi.mock('@/lib/portalDiagnostics', () => ({ reportPortalError: vi.fn() }));
describe('portal resources', () => {
    it('cancels stale responses when navigating between organisations', async () => {
        const scope = effectScope();
        const path = ref('/organisations/2');
        const requests: {
            signal: AbortSignal;
            resolve: (value: unknown) => void;
        }[] = [];
        const loader = (_: string, signal: AbortSignal) =>
            new Promise((resolve) => {
                requests.push({ signal, resolve });
            });
        const resource = scope.run(() =>
            usePortalResource<string>(() => path.value, loader),
        )!;
        path.value = '/organisations/3';
        await flushPromises();
        expect(requests[0].signal.aborted).toBe(true);
        requests[1].resolve('Club three');
        await flushPromises();
        requests[0].resolve('Private club two');
        await flushPromises();
        expect(resource.data.value).toBe('Club three');
        scope.stop();
        expect(requests[1].signal.aborted).toBe(true);
    });
    it('offers a fresh read after a failure without an automatic retry loop', async () => {
        const scope = effectScope();
        const loader = vi
            .fn()
            .mockRejectedValueOnce(new PortalError(503, 'Unavailable'))
            .mockResolvedValueOnce('Ready');
        const resource = scope.run(() =>
            usePortalResource<string>(() => '/me', loader),
        )!;
        await flushPromises();
        expect(loader).toHaveBeenCalledOnce();
        expect(resource.error.value?.status).toBe(503);
        await resource.reload();
        expect(resource.data.value).toBe('Ready');
        expect(resource.error.value).toBeNull();
        scope.stop();
    });
    it('validates real DTOs and rejects nested corruption before rendering', () => {
        expect(readIdentity(identity()).user.name).toBe('Test Manager');
        expect(
            readOrganisationDetail(organisationDetail()).members,
        ).toHaveLength(2);
        expect(
            readOrganisationIndex({ organisations: [], legacy_clubs: [] }),
        ).toEqual({ organisations: [], legacy_clubs: [] });
        const malformed = organisationDetail();
        (malformed.members[0] as any).roles = null;
        expect(() => readOrganisationDetail(malformed)).toThrow(PortalError);
        expect(() =>
            readIdentity({ ...identity(), organisations: [null] }),
        ).toThrow(PortalError);
        expect(() => readCompetitions([null])).toThrow(PortalError);
        expect(() =>
            readPresentation({ championship_campaign: { title: {} } }),
        ).toThrow(PortalError);
        expect(
            readPresentation({ championship_campaign: null })
                .championship_campaign,
        ).toBeNull();
    });
});

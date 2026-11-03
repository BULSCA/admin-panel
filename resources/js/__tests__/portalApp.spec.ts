import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import PortalBoundary from '@/components/portal/PortalBoundary.vue';
import { portalRequest } from '@/lib/portalApi';
import { reportPortalError } from '@/lib/portalDiagnostics';
import { portalState } from '@/lib/portalState';
import PortalApp from '@/PortalApp.vue';
import { identity } from './portalFixtures';
vi.mock('@/lib/portalApi', async (original) => ({
    ...(await original<Record<string, unknown>>()),
    portalRequest: vi.fn(),
}));
vi.mock('@/lib/portalDiagnostics', () => ({ reportPortalError: vi.fn() }));
vi.mock('@/lib/portalState', async (original) => ({
    ...(await original<Record<string, unknown>>()),
    refreshIdentity: vi.fn().mockResolvedValue(undefined),
}));
let wrapper: VueWrapper;
async function start(component: any = PortalApp) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/:pathMatch(.*)*',
                component: { template: '<h1>Private member space</h1>' },
            },
        ],
    });
    await router.push('/');
    await router.isReady();
    wrapper = mount(component, { global: { plugins: [router] } });
    await flushPromises();

    return router;
}
beforeEach(() => {
    vi.clearAllMocks();
    portalState.identity = identity();
    portalState.loading = false;
    portalState.error = null;
});
afterEach(() => wrapper?.unmount());
describe('portal session and navigation', () => {
    it('provides SSO onboarding without private navigation for signed-out visitors', async () => {
        portalState.identity = null;
        await start();
        expect(wrapper.get('a[href="/auth/sso?portal=1"]').text()).toContain(
            'Sign in',
        );
        expect(wrapper.text()).not.toContain('Private member space');
        expect(wrapper.find('nav').exists()).toBe(false);
    });
    it('shows members only their permitted navigation', async () => {
        await start();
        const navigation = wrapper.get('nav').text();
        expect(navigation).toContain('Dashboard');
        expect(navigation).not.toContain('Administration');
        expect(wrapper.text()).toContain('Private member space');
    });
    it('provides central management links for a superadmin', async () => {
        portalState.identity = {
            ...identity(),
            is_superadmin: true,
            can_administer: true,
        };
        await start();
        expect(wrapper.find('a[href="/admin"]').exists()).toBe(true);
        expect(wrapper.find('a[href="/organisations/1"]').exists()).toBe(true);
    });
    it('removes private content immediately when the API announces session expiry', async () => {
        await start();
        window.dispatchEvent(new Event('portal-session-expired'));
        await flushPromises();
        expect(wrapper.text()).not.toContain('Private member space');
        expect(wrapper.text()).toContain('Sign in with BULSCA');
    });
    it('signs out through the session API and clears local membership state', async () => {
        vi.mocked(portalRequest).mockResolvedValue({ signed_out: true });
        await start();
        await wrapper.get('button').trigger('click');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith('/logout', {
            method: 'POST',
        });
        expect(portalState.identity).toBeNull();
    });
    it('keeps the page accessible with a retryable message if logout cannot be confirmed', async () => {
        vi.mocked(portalRequest).mockRejectedValue(Error('Offline'));
        await start();
        await wrapper.get('button').trigger('click');
        await flushPromises();
        expect(wrapper.get('[role=alert]').text()).toContain(
            'could not confirm sign out',
        );
        expect(wrapper.text()).toContain('Private member space');
    });
    it('keeps navigation available when a page component throws and reports no exception text', async () => {
        const broken = defineComponent({
            setup() {
                throw Error('private-email@example.test');
            },
            template: '<div />',
        });
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: '/:pathMatch(.*)*',
                    component: { template: '<div />' },
                },
            ],
        });
        await router.push('/organisations/2');
        wrapper = mount(PortalBoundary, {
            slots: { default: broken },
            global: { plugins: [router] },
        });
        await flushPromises();
        expect(wrapper.get('[role=alert]').text()).toContain(
            'could not be displayed',
        );
        expect(reportPortalError).toHaveBeenCalledWith(
            'component',
            '/organisations/2',
        );
        expect(wrapper.text()).not.toContain('private-email');
    });
});

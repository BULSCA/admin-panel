import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { PortalError, portalRequest, publicData } from '@/lib/portalApi';
import { portalState } from '@/lib/portalState';
import Administration from '@/pages/portal/Administration.vue';
import Dashboard from '@/pages/portal/Dashboard.vue';
import Organisation from '@/pages/portal/Organisation.vue';
import { club, identity, organisationDetail } from './portalFixtures';
vi.mock('@/lib/portalApi', async (original) => ({
    ...(await original<Record<string, unknown>>()),
    portalRequest: vi.fn(),
    publicData: vi.fn(),
}));
vi.mock('@/lib/portalDiagnostics', () => ({ reportPortalError: vi.fn() }));
vi.mock('@/lib/portalState', async (original) => ({
    ...(await original<Record<string, unknown>>()),
    refreshIdentity: vi.fn().mockResolvedValue(undefined),
}));
let wrapper: VueWrapper;
async function open(component: any, path = '/organisations/2') {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/organisations/:id', component: { template: '<div />' } },
            { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
        ],
    });
    await router.push(path);
    await router.isReady();
    wrapper = mount(component, { global: { plugins: [router] } });
    await flushPromises();

    return router;
}
function button(text: string) {
    const match = wrapper
        .findAll('button')
        .find((item) => item.text() === text);
    expect(match, `Missing button: ${text}`).toBeDefined();

    return match!;
}
beforeEach(() => {
    vi.clearAllMocks();
    portalState.identity = identity();
    portalState.error = null;
    portalState.loading = false;
    vi.mocked(portalRequest).mockResolvedValue(organisationDetail());
    vi.mocked(publicData).mockImplementation(async (path) =>
        path === 'presentation'
            ? {
                  championship_campaign: {
                      title: 'Champs 2027',
                      location: 'Sheffield',
                      start_date: '2027-03-13',
                      end_date: '2027-03-14',
                  },
              }
            : [
                  {
                      id: 8,
                      title: 'Test Competition',
                      slug: 'test.8',
                      date: '2026-11-04',
                      location: 'Test Pool',
                  },
              ],
    );
});
afterEach(() => wrapper?.unmount());
describe('club member space', () => {
    it('shows members and committee history while hiding private contacts and management from ordinary members', async () => {
        vi.mocked(portalRequest).mockResolvedValue(organisationDetail([]));
        await open(Organisation);
        expect(wrapper.text()).toContain('Test University');
        expect(wrapper.text()).toContain('Test Member');
        expect(wrapper.text()).not.toContain('manager@example.test');
        expect(wrapper.find('input[type=email]').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('Roles and permissions');
        expect(wrapper.text()).not.toContain('Branding');
        await button('Committees').trigger('click');
        expect(wrapper.text()).toContain('Committee 2026–27');
        expect(wrapper.text()).toContain('Organisation manager');
        expect(wrapper.text()).not.toContain('End appointment');
        expect(wrapper.text()).not.toContain('Create a committee');
    });
    it('adds an existing member with the organisation path and prevents duplicate pending submissions', async () => {
        await open(Organisation);
        await wrapper.get('input[type=email]').setValue('new@example.test');
        let resolve: (value: unknown) => void = () => {};
        vi.mocked(portalRequest).mockReturnValueOnce(
            new Promise((done) => {
                resolve = done;
            }),
        );
        const form = wrapper.get('input[type=email]').element.closest('form')!;
        form.dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true }),
        );
        await flushPromises();
        expect(button('Saving…').attributes('disabled')).toBeDefined();
        form.dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true }),
        );
        expect(
            vi
                .mocked(portalRequest)
                .mock.calls.filter(([, options]) => options?.method === 'POST'),
        ).toHaveLength(1);
        expect(portalRequest).toHaveBeenCalledWith('/organisations/2/members', {
            method: 'POST',
            body: { email: 'new@example.test' },
        });
        resolve({ id: 7 });
        await flushPromises();
        expect(wrapper.text()).toContain('Member added.');
    });
    it('keeps an entered email and form when validation fails', async () => {
        await open(Organisation);
        await wrapper.get('input[type=email]').setValue('unknown@example.test');
        vi.mocked(portalRequest).mockRejectedValueOnce(
            new PortalError(422, 'Check the fields.', {
                email: ['Sign in through SSO first.'],
            }),
        );
        await wrapper.get('input[type=email]').trigger('submit');
        await flushPromises();
        expect(
            wrapper.get<HTMLInputElement>('input[type=email]').element.value,
        ).toBe('unknown@example.test');
        expect(wrapper.get('[role=alert]').text()).toContain(
            'Sign in through SSO first.',
        );
    });
    it('supports member search and pagination', async () => {
        const detail = organisationDetail();
        detail.pagination.last_page = 2;
        detail.pagination.total = 26;
        vi.mocked(portalRequest).mockResolvedValue(detail);
        await open(Organisation);
        await button('Next').trigger('click');
        await flushPromises();
        expect(portalRequest).toHaveBeenLastCalledWith(
            '/organisations/2?page=2&q=',
            expect.anything(),
        );
        await wrapper.get('input[type=search]').setValue('Name & Club');
        await wrapper.get('input[type=search]').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenLastCalledWith(
            '/organisations/2?page=1&q=Name%20%26%20Club',
            expect.anything(),
        );
    });
    it('keeps branding inputs after a failed multipart save', async () => {
        await open(Organisation);
        await button('Branding').trigger('click');
        await wrapper.findAll('input[type=color]')[0].setValue('#abcdef');
        vi.mocked(portalRequest).mockRejectedValueOnce(
            new PortalError(
                503,
                'Storage is unavailable. Your input has been kept.',
            ),
        );
        await wrapper.get('input[type=color]').trigger('submit');
        await flushPromises();
        expect(
            wrapper.get<HTMLInputElement>('input[type=color]').element.value,
        ).toBe('#abcdef');
        expect(wrapper.get('[role=alert]').text()).toContain(
            'Storage is unavailable',
        );
        const [path, options] = vi.mocked(portalRequest).mock.calls.at(-1)!;
        expect(path).toBe('/organisations/2/branding');
        expect(options?.method).toBe('POST');
        expect((options?.body as FormData).get('primary_colour')).toBe(
            '#abcdef',
        );
    });
    it('creates restricted roles and disables permissions the actor does not hold', async () => {
        vi.mocked(portalRequest).mockResolvedValue(
            organisationDetail(['roles.manage', 'branding.manage']),
        );
        await open(Organisation);
        await button('Roles and permissions').trigger('click');
        expect(
            wrapper.get('input[value="members.manage"]').attributes('disabled'),
        ).toBeDefined();
        expect(wrapper.text()).toContain('Built-in manager');
        await wrapper.get('input[maxlength="80"]').setValue('Kit officer');
        await wrapper.get('input[value="branding.manage"]').setValue(true);
        await wrapper.get('input[maxlength="80"]').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith('/organisations/2/roles', {
            method: 'POST',
            body: { name: 'Kit officer', permissions: ['branding.manage'] },
        });
    });
    it('edits existing roles without granting global permissions', async () => {
        await open(Organisation);
        await button('Roles and permissions').trigger('click');
        await button('Edit').trigger('click');
        await wrapper.get('input[maxlength="80"]').setValue('Media officer');
        await wrapper.get('input[maxlength="80"]').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith('/organisations/2/roles/2', {
            method: 'PATCH',
            body: { name: 'Media officer', permissions: ['branding.manage'] },
        });
        expect(wrapper.text()).not.toContain('super_admin');
    });
    it('creates and updates committee terms with explicit dates', async () => {
        await open(Organisation);
        await button('Committees').trigger('click');
        await wrapper
            .get('input[maxlength="100"]')
            .setValue('Committee 2027–28');
        await wrapper.findAll('input[type=date]')[0].setValue('2027-09-01');
        await wrapper.findAll('input[type=date]')[1].setValue('2028-08-31');
        await wrapper.get('input[maxlength="100"]').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith(
            '/organisations/2/committees',
            {
                method: 'POST',
                body: {
                    name: 'Committee 2027–28',
                    starts_on: '2027-09-01',
                    ends_on: '2028-08-31',
                },
            },
        );
        await button('Edit committee dates/name').trigger('click');
        await wrapper.get('input[maxlength="100"]').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith(
            '/organisations/2/committees/3',
            expect.objectContaining({ method: 'PATCH' }),
        );
    });
    it('appoints committee members using membership, committee and role IDs', async () => {
        await open(Organisation);
        await button('Committees').trigger('click');
        const selects = wrapper.findAll('select');
        await selects[0].setValue('6');
        await selects[1].setValue('3');
        await selects[2].setValue('2');
        await selects[0].trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith(
            '/organisations/2/appointments',
            {
                method: 'POST',
                body: { membership_id: 6, committee_id: 3, role_id: 2 },
            },
        );
    });
    it('deactivates memberships and ends appointments explicitly', async () => {
        await open(Organisation);
        await button('Deactivate').trigger('click');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith(
            '/organisations/2/members/4',
            { method: 'PATCH', body: { active: false } },
        );
        await button('Committees').trigger('click');
        await button('End appointment').trigger('click');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith(
            '/organisations/2/appointments/9',
            { method: 'DELETE', body: undefined },
        );
    });
    it('shows a safe retry state for a malformed organisation response', async () => {
        vi.mocked(portalRequest).mockResolvedValue({
            organisation: club(),
            members: null,
        });
        await open(Organisation);
        expect(wrapper.get('[role=alert]').text()).toContain(
            'unexpected response',
        );
        expect(wrapper.text()).toContain('Try loading again');
        expect(wrapper.find('table').exists()).toBe(false);
    });
});
describe('dashboard and administration', () => {
    it('shows the campaign, upcoming events and direct club access', async () => {
        await open(Dashboard, '/');
        expect(wrapper.text()).toContain('Champs 2027');
        expect(wrapper.text()).toContain('Test Competition');
        expect(wrapper.get('a[href="/organisations/2"]').text()).toContain(
            'Test University',
        );
        expect(
            wrapper
                .find('a[href="https://www.bulsca.co.uk/competitions/test.8"]')
                .exists(),
        ).toBe(true);
    });
    it('retains club access when only the competition feed fails', async () => {
        vi.mocked(publicData).mockRejectedValue(
            new PortalError(503, 'Temporarily unavailable'),
        );
        await open(Dashboard, '/');
        expect(wrapper.get('a[href="/organisations/2"]').text()).toContain(
            'Test University',
        );
        expect(wrapper.text()).toContain('Try loading again');
    });
    it('explains the membership onboarding state and an empty competition list', async () => {
        portalState.identity = { ...identity(), organisations: [] };
        vi.mocked(publicData)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce({ championship_campaign: null });
        await open(Dashboard, '/');
        expect(wrapper.text()).toContain('No organisation membership yet');
        expect(wrapper.text()).toContain('No upcoming competitions');
    });
    it('creates an affiliated club with an initial manager and optional public club link', async () => {
        vi.mocked(portalRequest)
            .mockResolvedValueOnce({
                organisations: [club()],
                legacy_clubs: [{ id: 10, name: 'Existing club' }],
            })
            .mockResolvedValueOnce(club());
        const router = await open(Administration, '/admin');
        await wrapper.get('input[maxlength="150"]').setValue('New club');
        await wrapper.get('input[type=email]').setValue('manager@example.test');
        await wrapper.get('select').setValue('10');
        await wrapper.get('form').trigger('submit');
        await flushPromises();
        expect(portalRequest).toHaveBeenCalledWith('/organisations', {
            method: 'POST',
            body: {
                name: 'New club',
                administrator_email: 'manager@example.test',
                university_id: 10,
            },
        });
        expect(router.currentRoute.value.path).toBe('/organisations/2');
    });
    it('does not render the club creation form when administration access is denied', async () => {
        vi.mocked(portalRequest).mockRejectedValue(
            new PortalError(404, 'Unavailable to your account'),
        );
        await open(Administration, '/admin');
        expect(wrapper.get('[role=alert]').text()).toContain('Unavailable');
        expect(wrapper.find('form').exists()).toBe(false);
    });
});

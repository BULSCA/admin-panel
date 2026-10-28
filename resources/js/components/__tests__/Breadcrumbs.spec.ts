import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '@/components/Breadcrumbs.vue';

describe('breadcrumbs', () => {
    it('links ancestors and identifies the current page without making it a link', () => {
        const wrapper = mount(Breadcrumbs, {
            props: {
                breadcrumbs: [
                    { title: 'Dashboard', href: '/' },
                    { title: 'Settings', href: '/settings' },
                    { title: 'Profile', href: '/settings/profile' },
                ],
            },
            global: {
                stubs: {
                    Link: {
                        props: ['href'],
                        template: '<a :href="href"><slot /></a>',
                    },
                },
            },
        });
        expect(
            wrapper.findAll('a').map((link) => link.attributes('href')),
        ).toEqual(['/', '/settings']);
        expect(wrapper.get('[aria-current="page"]').text()).toBe('Profile');
        expect(
            wrapper.findAll('[data-slot="breadcrumb-separator"]'),
        ).toHaveLength(2);
        wrapper.unmount();
    });

    it('renders a single current page without an extra separator', () => {
        const wrapper = mount(Breadcrumbs, {
            props: { breadcrumbs: [{ title: 'Dashboard', href: '/' }] },
        });
        expect(wrapper.get('[aria-current="page"]').text()).toBe('Dashboard');
        expect(wrapper.find('a').exists()).toBe(false);
        expect(
            wrapper.find('[data-slot="breadcrumb-separator"]').exists(),
        ).toBe(false);
        wrapper.unmount();
    });
});

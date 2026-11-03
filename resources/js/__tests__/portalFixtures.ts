import type {
    Organisation,
    OrganisationDetail,
    PortalIdentity,
} from '@/types/portal';
export const management = [
    'branding.manage',
    'members.manage',
    'committees.manage',
    'roles.manage',
];
export function club(permissions: string[] = management): Organisation {
    return {
        id: 2,
        name: 'Test University',
        slug: 'test-university',
        kind: 'club',
        parent_id: 1,
        active: true,
        primary_colour: '#112233',
        secondary_colour: '#445566',
        logo_url: null,
        permissions: [...permissions],
    };
}
export function identity(permissions = management): PortalIdentity {
    return {
        user: { id: 5, name: 'Test Manager', email: 'manager@example.test' },
        organisations: [club(permissions)],
        association_id: 1,
        can_administer: false,
        is_superadmin: false,
        today: '2026-10-30',
    };
}
export function organisationDetail(
    permissions = management,
): OrganisationDetail {
    return {
        organisation: club(permissions),
        members: [
            {
                id: 4,
                name: 'Test Manager',
                active: true,
                email: 'manager@example.test',
                roles: [{ id: 1, name: 'Organisation manager' }],
            },
            {
                id: 6,
                name: 'Test Member',
                active: true,
                email: 'member@example.test',
                roles: [],
            },
        ],
        pagination: { current_page: 1, last_page: 1, total: 2 },
        committees: [
            {
                id: 3,
                name: 'Committee 2026–27',
                starts_on: '2026-09-01',
                ends_on: '2027-08-31',
                appointments: [
                    {
                        id: 9,
                        membership_id: 4,
                        role_id: 1,
                        name: 'Test Manager',
                        role: 'Organisation manager',
                        active: true,
                    },
                ],
            },
        ],
        roles: [
            {
                id: 1,
                name: 'Organisation manager',
                protected: true,
                permissions: [...management],
            },
            {
                id: 2,
                name: 'Web officer',
                protected: false,
                permissions: ['branding.manage'],
            },
        ],
        permission_catalogue: {
            'branding.manage': 'Edit colours and logo',
            'members.manage': 'Add and manage members',
            'committees.manage': 'Create committees and appoint members',
            'roles.manage': 'Create and manage restricted roles',
        },
        audit: [
            {
                id: 1,
                action: 'organisation.created',
                created_at: '2026-10-30 12:00:00',
            },
        ],
    };
}

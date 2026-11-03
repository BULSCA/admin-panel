export type Organisation = {
    id: number;
    name: string;
    slug: string;
    kind: 'association' | 'club';
    parent_id: number | null;
    active: boolean;
    primary_colour: string;
    secondary_colour: string;
    logo_url: string | null;
    permissions: string[];
};
export type PortalIdentity = {
    user: { id: number; name: string; email: string };
    organisations: Organisation[];
    association_id: number;
    can_administer: boolean;
    is_superadmin: boolean;
    today: string;
};
export type PortalRole = {
    id: number;
    name: string;
    permissions: string[];
    protected: boolean;
};
export type PortalMember = {
    id: number;
    name: string;
    active: boolean;
    email?: string;
    roles: { id: number; name: string }[];
};
export type PortalCommittee = {
    id: number;
    name: string;
    starts_on: string;
    ends_on: string | null;
    appointments: {
        id: number;
        membership_id: number;
        role_id: number;
        name: string;
        role: string;
        active: boolean;
    }[];
};
export type OrganisationDetail = {
    organisation: Organisation;
    members: PortalMember[];
    pagination: { current_page: number; last_page: number; total: number };
    committees: PortalCommittee[];
    roles: PortalRole[];
    permission_catalogue: Record<string, string>;
    audit: { id: number; action: string; created_at: string }[];
};

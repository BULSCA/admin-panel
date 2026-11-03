import { invalidResponse } from '@/lib/portalApi';
import type {
    Organisation,
    OrganisationDetail,
    PortalCommittee,
    PortalIdentity,
    PortalMember,
    PortalRole,
} from '@/types/portal';

type ObjectValue = Record<string, unknown>;
const record = (value: unknown): value is ObjectValue =>
    !!value && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is number =>
    Number.isSafeInteger(value) && Number(value) > 0;
const text = (value: unknown): value is string => typeof value === 'string';
const bool = (value: unknown): value is boolean => typeof value === 'boolean';
const date = (value: unknown): value is string =>
    text(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
const texts = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(text);
const all = <T>(
    value: unknown,
    check: (item: unknown) => item is T,
): value is T[] => Array.isArray(value) && value.every(check);
const label = (
    value: unknown,
): value is ObjectValue & { id: number; name: string } =>
    record(value) && id(value.id) && text(value.name);
const organisation = (value: unknown): value is Organisation =>
    label(value) &&
    record(value) &&
    text(value.slug) &&
    ['club', 'association'].includes(String(value.kind)) &&
    (value.parent_id === null || id(value.parent_id)) &&
    bool(value.active) &&
    text(value.primary_colour) &&
    text(value.secondary_colour) &&
    (value.logo_url === null || text(value.logo_url)) &&
    texts(value.permissions);
const role = (value: unknown): value is PortalRole =>
    label(value) &&
    record(value) &&
    bool(value.protected) &&
    texts(value.permissions);
const member = (value: unknown): value is PortalMember =>
    label(value) &&
    record(value) &&
    bool(value.active) &&
    (value.email === undefined || text(value.email)) &&
    all(value.roles, label);
const committee = (value: unknown): value is PortalCommittee =>
    label(value) &&
    record(value) &&
    date(value.starts_on) &&
    (value.ends_on === null || date(value.ends_on)) &&
    Array.isArray(value.appointments) &&
    value.appointments.every(
        (entry) =>
            label(entry) &&
            record(entry) &&
            id(entry.membership_id) &&
            id(entry.role_id) &&
            text(entry.role) &&
            bool(entry.active),
    );
export function readOrganisation(value: unknown): Organisation {
    return organisation(value) ? value : invalidResponse('/organisations');
}
export function readIdentity(value: unknown): PortalIdentity {
    if (
        !record(value) ||
        !label(value.user) ||
        !record(value.user) ||
        !text(value.user.email) ||
        !all(value.organisations, organisation) ||
        !id(value.association_id) ||
        !bool(value.can_administer) ||
        !bool(value.is_superadmin) ||
        !date(value.today)
    ) {
        return invalidResponse('/me');
    }

    return value as PortalIdentity;
}
export type OrganisationIndex = {
    organisations: Organisation[];
    legacy_clubs: { id: number; name: string }[];
};
export function readOrganisationIndex(value: unknown): OrganisationIndex {
    if (
        !record(value) ||
        !all(value.organisations, organisation) ||
        !all(value.legacy_clubs, label)
    ) {
        return invalidResponse('/organisations');
    }

    return value as OrganisationIndex;
}
export function readOrganisationDetail(value: unknown): OrganisationDetail {
    if (
        !record(value) ||
        !organisation(value.organisation) ||
        !all(value.members, member) ||
        !all(value.roles, role) ||
        !all(value.committees, committee) ||
        !record(value.pagination) ||
        !id(value.pagination.current_page) ||
        !id(value.pagination.last_page) ||
        !Number.isSafeInteger(value.pagination.total) ||
        Number(value.pagination.total) < 0 ||
        !record(value.permission_catalogue) ||
        !Object.values(value.permission_catalogue).every(text) ||
        !Array.isArray(value.audit) ||
        !value.audit.every(
            (event) =>
                record(event) &&
                id(event.id) &&
                text(event.action) &&
                text(event.created_at),
        )
    ) {
        return invalidResponse('/organisations');
    }

    return value as OrganisationDetail;
}
export type Competition = {
    id: number | string;
    title: string;
    slug: string;
    date?: string;
    location?: string;
    summary?: string;
};
export function readCompetitions(value: unknown): Competition[] {
    if (
        !Array.isArray(value) ||
        !value.every(
            (entry) =>
                record(entry) &&
                (id(entry.id) || text(entry.id)) &&
                text(entry.title) &&
                text(entry.slug) &&
                [entry.date, entry.location, entry.summary].every(
                    (item) => item === undefined || text(item),
                ),
        )
    ) {
        return invalidResponse('/homepage/highlights');
    }

    return value as Competition[];
}
export type Campaign = {
    title: string;
    location: string;
    start_date: string;
    end_date: string;
};
export function readPresentation(value: unknown): {
    championship_campaign?: Campaign | null;
} {
    if (!record(value)) {
        return invalidResponse('/presentation');
    }

    const campaign = value.championship_campaign;

    if (
        campaign !== undefined &&
        campaign !== null &&
        (!record(campaign) ||
            !text(campaign.title) ||
            !text(campaign.location) ||
            !date(campaign.start_date) ||
            !date(campaign.end_date))
    ) {
        return invalidResponse('/presentation');
    }

    return value as { championship_campaign?: Campaign | null };
}

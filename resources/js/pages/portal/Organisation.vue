<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PortalNotice from '@/components/portal/PortalNotice.vue';
import { usePortalResource } from '@/composables/usePortalResource';
import {
    PortalError,
    portalRequest,
    safeColour,
    safeLogo,
} from '@/lib/portalApi';
import { readOrganisationDetail } from '@/lib/portalData';
import { portalState, refreshIdentity } from '@/lib/portalState';
import type {
    OrganisationDetail,
    PortalCommittee,
    PortalRole,
} from '@/types/portal';

const route = useRoute();
const page = ref(1);
const query = ref('');
const search = ref('');
const path = `/organisations/${route.params.id}`;
const resource = usePortalResource<OrganisationDetail>(
    () => `${path}?page=${page.value}&q=${encodeURIComponent(query.value)}`,
    undefined,
    readOrganisationDetail,
);
const brokenLogo = ref(false);
const detail = computed(() => resource.data.value);
const permissions = computed(
    () => detail.value?.organisation.permissions || [],
);
const can = (permission: string) => permissions.value.includes(permission);
const tab = ref('members');
const saving = ref(false);
const saveError = ref<PortalError | null>(null);
const saved = ref('');
const email = ref('');
const primary = ref('#B1040B');
const secondary = ref('#070660');
const logo = ref<File | null>(null);
const brandingDirty = ref(false);
const roleId = ref<number | null>(null);
const roleName = ref('');
const rolePermissions = ref<string[]>([]);
const committeeId = ref<number | null>(null);
const committeeName = ref('');
const startsOn = ref(portalState.identity?.today || '');
const endsOn = ref('');
const assignMember = ref('');
const assignCommittee = ref('');
const assignRole = ref('');
watch(detail, (value) => {
    if (value && !brandingDirty.value) {
        primary.value = value.organisation.primary_colour;
        secondary.value = value.organisation.secondary_colour;
    }
});
function searchMembers() {
    page.value = 1;
    query.value = search.value;
}
async function save(
    suffix: string,
    method: string,
    body?: unknown,
    message = 'Saved.',
) {
    if (saving.value) {
        return false;
    }

    saving.value = true;
    saveError.value = null;
    saved.value = '';

    try {
        await portalRequest(path + suffix, { method, body });
        saved.value = message;
        await refreshIdentity(true);
        await resource.reload();

        return true;
    } catch (failure) {
        saveError.value =
            failure instanceof PortalError
                ? failure
                : new PortalError(
                      0,
                      'We could not confirm the change. Your input has been kept. Refresh the record before trying again.',
                  );

        return false;
    } finally {
        saving.value = false;
    }
}
async function addMember() {
    if (
        await save('/members', 'POST', { email: email.value }, 'Member added.')
    ) {
        email.value = '';
    }
}
function editRole(role?: PortalRole) {
    roleId.value = role?.id || null;
    roleName.value = role?.name || '';
    rolePermissions.value = [...(role?.permissions || [])];
}
async function saveRole() {
    if (
        await save(
            roleId.value ? `/roles/${roleId.value}` : '/roles',
            roleId.value ? 'PATCH' : 'POST',
            { name: roleName.value, permissions: rolePermissions.value },
            'Role saved.',
        )
    ) {
        editRole();
    }
}
function editCommittee(committee?: PortalCommittee) {
    committeeId.value = committee?.id || null;
    committeeName.value = committee?.name || '';
    startsOn.value = committee?.starts_on || portalState.identity?.today || '';
    endsOn.value = committee?.ends_on || '';
}
async function saveCommittee() {
    if (
        await save(
            committeeId.value
                ? `/committees/${committeeId.value}`
                : '/committees',
            committeeId.value ? 'PATCH' : 'POST',
            {
                name: committeeName.value,
                starts_on: startsOn.value,
                ends_on: endsOn.value || null,
            },
            'Committee saved.',
        )
    ) {
        editCommittee();
    }
}
async function appoint() {
    await save(
        '/appointments',
        'POST',
        {
            membership_id: Number(assignMember.value),
            committee_id: Number(assignCommittee.value),
            role_id: Number(assignRole.value),
        },
        'Committee appointment saved.',
    );
}
async function saveBranding() {
    const body = new FormData();
    body.set('primary_colour', primary.value);
    body.set('secondary_colour', secondary.value);

    if (logo.value) {
        body.set('logo', logo.value);
    }

    if (await save('/branding', 'POST', body, 'Branding saved.')) {
        brandingDirty.value = false;
        logo.value = null;
    }
}
function pickLogo(event: Event) {
    logo.value = (event.target as HTMLInputElement).files?.[0] || null;
    brandingDirty.value = true;
}
function termStatus(committee: PortalCommittee) {
    const today = portalState.identity?.today || '';

    return committee.starts_on > today
        ? 'Upcoming'
        : committee.ends_on && committee.ends_on < today
          ? 'Past'
          : 'Current';
}
</script>

<template>
    <p v-if="resource.loading.value" role="status">Loading organisation…</p>
    <PortalNotice
        v-else-if="resource.error.value"
        :error="resource.error.value"
        :retry="resource.reload"
    />
    <template
        v-else-if="
            detail?.organisation &&
            Array.isArray(detail.members) &&
            Array.isArray(detail.committees) &&
            Array.isArray(detail.roles)
        "
    >
        <header
            class="portal-organisation-heading"
            :style="{
                borderColor: safeColour(detail.organisation.primary_colour),
            }"
        >
            <img
                :src="
                    (!brokenLogo && safeLogo(detail.organisation.logo_url)) ||
                    '/bulsca-logo.png'
                "
                alt=""
                @error="brokenLogo = true"
            />
            <div>
                <small>{{
                    detail.organisation.kind === 'club'
                        ? 'Club member space'
                        : 'Association space'
                }}</small>
                <h1>{{ detail.organisation.name }}</h1>
                <p>
                    Members, committees and the people who keep your
                    organisation running.
                </p>
            </div>
        </header>
        <div
            class="portal-tabs"
            role="navigation"
            aria-label="Organisation sections"
        >
            <button
                :aria-current="tab === 'members' ? 'page' : undefined"
                @click="tab = 'members'"
            >
                Members
            </button>
            <button
                :aria-current="tab === 'committees' ? 'page' : undefined"
                @click="tab = 'committees'"
            >
                Committees
            </button>
            <button
                v-if="can('branding.manage')"
                :aria-current="tab === 'branding' ? 'page' : undefined"
                @click="tab = 'branding'"
            >
                Branding
            </button>
            <button
                v-if="can('roles.manage')"
                :aria-current="tab === 'roles' ? 'page' : undefined"
                @click="tab = 'roles'"
            >
                Roles and permissions
            </button>
        </div>
        <PortalNotice v-if="saveError" :error="saveError" />
        <p v-if="saved" class="portal-success" role="status">{{ saved }}</p>

        <section v-if="tab === 'members'" class="portal-panel">
            <div class="portal-section-heading">
                <h2>Members</h2>
                <span>{{ detail.pagination.total }} members</span>
            </div>
            <form class="portal-inline-form" @submit.prevent="searchMembers">
                <label
                    >Find a member<input
                        v-model="search"
                        type="search"
                        maxlength="100" /></label
                ><button class="portal-button secondary">Search</button>
            </form>
            <div class="portal-table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Current roles</th>
                            <th v-if="can('members.manage')">Email</th>
                            <th v-if="can('members.manage')">Membership</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="member in detail.members" :key="member.id">
                            <td>{{ member.name }}</td>
                            <td>
                                {{
                                    member.roles
                                        ?.map((role) => role.name)
                                        .join(', ') || 'Member'
                                }}
                            </td>
                            <td v-if="can('members.manage')">
                                {{ member.email }}
                            </td>
                            <td v-if="can('members.manage')">
                                <button
                                    type="button"
                                    :disabled="saving"
                                    class="portal-text-button"
                                    @click="
                                        save(
                                            `/members/${member.id}`,
                                            'PATCH',
                                            { active: !member.active },
                                            'Membership updated.',
                                        )
                                    "
                                >
                                    {{
                                        member.active
                                            ? 'Deactivate'
                                            : 'Reactivate'
                                    }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="!detail.members.length" class="portal-empty">
                No members match this search.
            </p>
            <nav
                v-if="detail.pagination.last_page > 1"
                aria-label="Member pages"
                class="portal-inline-form"
            >
                <button :disabled="page <= 1" @click="page--">Previous</button
                ><span
                    >Page {{ page }} of {{ detail.pagination.last_page }}</span
                ><button
                    :disabled="page >= detail.pagination.last_page"
                    @click="page++"
                >
                    Next
                </button>
            </nav>
            <form
                v-if="can('members.manage')"
                class="portal-form portal-form-divider"
                @submit.prevent="addMember"
            >
                <h3>Add a member</h3>
                <p>
                    Use the email address of an account that has already signed
                    in through BULSCA SSO. Adding membership does not grant
                    committee permissions.
                </p>
                <label
                    >Registered email<input
                        v-model="email"
                        required
                        type="email"
                        autocomplete="off"
                        maxlength="254" /></label
                ><button class="portal-button" :disabled="saving">
                    {{ saving ? 'Saving…' : 'Add member' }}
                </button>
            </form>
        </section>

        <section v-if="tab === 'committees'" class="portal-panel">
            <h2>Committees</h2>
            <p>
                Permissions apply during a committee's dates, while the person's
                membership and appointment remain active.
            </p>
            <details
                v-for="committee in detail.committees"
                :key="committee.id"
                class="portal-committee"
                :open="termStatus(committee) === 'Current'"
            >
                <summary>
                    <strong>{{ committee.name }}</strong
                    ><span
                        >{{ termStatus(committee) }} ·
                        {{ committee.starts_on }} –
                        {{ committee.ends_on || 'ongoing' }}</span
                    >
                </summary>
                <ul class="portal-roster">
                    <li
                        v-for="appointment in committee.appointments"
                        :key="appointment.id"
                    >
                        <span
                            >{{ appointment.name }}
                            <small
                                >{{ appointment.role
                                }}{{
                                    appointment.active ? '' : ' · ended'
                                }}</small
                            ></span
                        ><button
                            v-if="
                                can('committees.manage') && appointment.active
                            "
                            class="portal-text-button"
                            :disabled="saving"
                            @click="
                                save(
                                    `/appointments/${appointment.id}`,
                                    'DELETE',
                                    undefined,
                                    'Appointment ended.',
                                )
                            "
                        >
                            End appointment
                        </button>
                    </li>
                </ul>
                <p v-if="!committee.appointments.length">
                    No committee appointments yet.
                </p>
                <button
                    v-if="can('committees.manage')"
                    class="portal-text-button"
                    @click="editCommittee(committee)"
                >
                    Edit committee dates/name
                </button>
            </details>
            <p v-if="!detail.committees.length" class="portal-empty">
                No committees have been created yet.
            </p>
            <template v-if="can('committees.manage')">
                <form
                    class="portal-form portal-form-divider"
                    @submit.prevent="saveCommittee"
                >
                    <h3>
                        {{
                            committeeId
                                ? 'Edit committee'
                                : 'Create a committee'
                        }}
                    </h3>
                    <label
                        >Committee name<input
                            v-model="committeeName"
                            required
                            maxlength="100"
                    /></label>
                    <div class="portal-form-grid">
                        <label
                            >Starts on<input
                                v-model="startsOn"
                                required
                                type="date" /></label
                        ><label
                            >Ends on (optional)<input
                                v-model="endsOn"
                                type="date"
                        /></label>
                    </div>
                    <div class="portal-inline-form">
                        <button class="portal-button" :disabled="saving">
                            Save committee</button
                        ><button
                            v-if="committeeId"
                            type="button"
                            class="portal-text-button"
                            @click="editCommittee()"
                        >
                            Cancel edit
                        </button>
                    </div>
                </form>
                <form
                    class="portal-form portal-form-divider"
                    @submit.prevent="appoint"
                >
                    <h3>Appoint a committee member</h3>
                    <label
                        >Member<select v-model="assignMember" required>
                            <option value="">Choose an active member</option>
                            <option
                                v-for="member in detail.members.filter(
                                    (person) => person.active,
                                )"
                                :key="member.id"
                                :value="member.id"
                            >
                                {{ member.name }}
                            </option></select
                        ><small
                            >Use the member search if the person is on another
                            page.</small
                        ></label
                    ><label
                        >Committee<select v-model="assignCommittee" required>
                            <option value="">Choose a committee</option>
                            <option
                                v-for="committee in detail.committees"
                                :key="committee.id"
                                :value="committee.id"
                            >
                                {{ committee.name }}
                            </option>
                        </select></label
                    ><label
                        >Role<select v-model="assignRole" required>
                            <option value="">Choose a role</option>
                            <option
                                v-for="role in detail.roles.filter((item) =>
                                    item.permissions.every((permission) =>
                                        can(permission),
                                    ),
                                )"
                                :key="role.id"
                                :value="role.id"
                            >
                                {{ role.name }}
                            </option>
                        </select></label
                    ><button class="portal-button" :disabled="saving">
                        Save appointment
                    </button>
                </form>
            </template>
        </section>

        <section
            v-if="tab === 'branding' && can('branding.manage')"
            class="portal-panel"
        >
            <h2>Organisation branding</h2>
            <p>
                Choose your primary and secondary colours and upload a club
                logo.
            </p>
            <form class="portal-form" @submit.prevent="saveBranding">
                <div class="portal-form-grid">
                    <label
                        >Primary colour<input
                            v-model="primary"
                            type="color"
                            @input="brandingDirty = true"
                        /><span>{{ primary }}</span></label
                    ><label
                        >Secondary colour<input
                            v-model="secondary"
                            type="color"
                            @input="brandingDirty = true"
                        /><span>{{ secondary }}</span></label
                    >
                </div>
                <div
                    class="portal-brand-preview"
                    :style="{
                        borderColor: safeColour(primary),
                        background: safeColour(secondary),
                    }"
                >
                    <span>{{ detail.organisation.name }}</span>
                </div>
                <label
                    >Replacement logo<input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        @change="pickLogo"
                    /><small
                        >PNG, JPEG or WebP; maximum 2 MB and 2048 × 2048 pixels.
                        The existing logo is retained if saving fails.</small
                    ></label
                ><button class="portal-button" :disabled="saving">
                    {{ saving ? 'Saving…' : 'Save branding' }}
                </button>
            </form>
        </section>

        <section
            v-if="tab === 'roles' && can('roles.manage')"
            class="portal-panel"
        >
            <h2>Roles and permissions</h2>
            <p>
                Roles belong to this organisation. You can delegate only
                permissions you currently hold. Club roles cannot grant
                BULSCA-wide or superadmin access.
            </p>
            <ul class="portal-roster">
                <li v-for="role in detail.roles" :key="role.id">
                    <span
                        ><strong>{{ role.name }}</strong
                        ><small>{{
                            role.permissions
                                .map(
                                    (permission) =>
                                        detail?.permission_catalogue[
                                            permission
                                        ] || permission,
                                )
                                .join(' · ') || 'No management permissions'
                        }}</small></span
                    ><span v-if="role.protected" class="portal-tag"
                        >Built-in manager</span
                    >
                    <div
                        v-else-if="
                            role.permissions.every((permission) =>
                                can(permission),
                            )
                        "
                        class="portal-inline-form"
                    >
                        <button
                            type="button"
                            class="portal-text-button"
                            :disabled="saving"
                            @click="editRole(role)"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            class="portal-text-button"
                            :disabled="saving"
                            @click="
                                save(
                                    `/roles/${role.id}`,
                                    'DELETE',
                                    undefined,
                                    'Unused role removed.',
                                )
                            "
                        >
                            Remove unused role
                        </button>
                    </div>
                </li>
            </ul>
            <form
                class="portal-form portal-form-divider"
                @submit.prevent="saveRole"
            >
                <h3>{{ roleId ? 'Edit role' : 'Create a role' }}</h3>
                <label
                    >Role name<input v-model="roleName" required maxlength="80"
                /></label>
                <fieldset>
                    <legend>Permissions</legend>
                    <label
                        v-for="(
                            description, permission
                        ) in detail.permission_catalogue"
                        :key="permission"
                        class="portal-checkbox"
                        ><input
                            v-model="rolePermissions"
                            type="checkbox"
                            :value="permission"
                            :disabled="!can(String(permission))"
                        /><span>{{ description }}</span></label
                    >
                </fieldset>
                <div class="portal-inline-form">
                    <button class="portal-button" :disabled="saving">
                        Save role</button
                    ><button
                        v-if="roleId"
                        type="button"
                        class="portal-text-button"
                        @click="editRole()"
                    >
                        Cancel edit
                    </button>
                </div>
            </form>
            <details v-if="detail.audit.length" class="portal-committee">
                <summary>Recent administration activity</summary>
                <ul>
                    <li v-for="event in detail.audit" :key="event.id">
                        {{ event.action }} · {{ event.created_at }}
                    </li>
                </ul>
            </details>
        </section>
    </template>
    <PortalNotice
        v-else
        message="The organisation response could not be read. Please try loading it again."
        :retry="resource.reload"
    />
</template>

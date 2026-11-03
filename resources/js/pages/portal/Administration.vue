<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import OrganisationCard from '@/components/portal/OrganisationCard.vue';
import PortalNotice from '@/components/portal/PortalNotice.vue';
import { usePortalResource } from '@/composables/usePortalResource';
import { PortalError, portalRequest } from '@/lib/portalApi';
import { readOrganisationIndex, readOrganisation } from '@/lib/portalData';
import type { OrganisationIndex } from '@/lib/portalData';

const resource = usePortalResource<OrganisationIndex>(
    () => '/organisations',
    undefined,
    readOrganisationIndex,
);
const router = useRouter();
const name = ref('');
const email = ref('');
const university = ref('');
const busy = ref(false);
const error = ref<PortalError | null>(null);
async function create() {
    if (busy.value) {
        return;
    }

    busy.value = true;
    error.value = null;

    try {
        const org = readOrganisation(
            await portalRequest('/organisations', {
                method: 'POST',
                body: {
                    name: name.value,
                    administrator_email: email.value,
                    university_id: university.value
                        ? Number(university.value)
                        : null,
                },
            }),
        );
        await router.push(`/organisations/${org.id}`);
    } catch (failure) {
        error.value =
            failure instanceof PortalError
                ? failure
                : new PortalError(
                      0,
                      'We could not confirm the new club. Your input has been kept. Refresh the list before trying again.',
                  );
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <section class="portal-page-heading">
        <small>BULSCA administration</small>
        <h1>Organisations</h1>
        <p>
            Manage the association and its affiliated clubs. Club committees
            manage their own spaces.
        </p>
    </section>
    <p v-if="resource.loading.value" role="status">Loading organisations…</p>
    <PortalNotice
        v-else-if="resource.error.value"
        :error="resource.error.value"
        :retry="resource.reload"
    />
    <template v-else-if="resource.data.value">
        <section class="portal-panel">
            <h2>Association and member clubs</h2>
            <div class="portal-org-grid">
                <OrganisationCard
                    v-for="org in resource.data.value.organisations"
                    :key="org.id"
                    :organisation="org"
                />
            </div>
        </section>
        <section class="portal-panel">
            <h2>Add a member club</h2>
            <p>
                The first manager will be added to an initial committee. They
                can then create their club's roles and appoint its committee.
            </p>
            <PortalNotice v-if="error" :error="error" />
            <form
                class="portal-form"
                :aria-busy="busy"
                @submit.prevent="create"
            >
                <label
                    >Club name<input v-model="name" required maxlength="150"
                /></label>
                <label
                    >Initial manager's registered email<input
                        v-model="email"
                        required
                        type="email"
                        maxlength="254"
                        autocomplete="off"
                    /><small
                        >The person must have signed in through BULSCA SSO at
                        least once.</small
                    ></label
                >
                <label
                    >Existing public website club (optional)<select
                        v-model="university"
                    >
                        <option value="">No public club link</option>
                        <option
                            v-for="club in resource.data.value.legacy_clubs"
                            :key="club.id"
                            :value="club.id"
                        >
                            {{ club.name }}
                        </option></select
                    ><small
                        >Linking an existing club lets its new logo appear in
                        the public club directory.</small
                    ></label
                >
                <button class="portal-button" :disabled="busy">
                    {{
                        busy
                            ? 'Creating club…'
                            : 'Create club and appoint manager'
                    }}
                </button>
            </form>
        </section>
    </template>
</template>

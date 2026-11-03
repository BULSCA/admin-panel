<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import OrganisationCard from '@/components/portal/OrganisationCard.vue';
import PortalNotice from '@/components/portal/PortalNotice.vue';
import { usePortalResource } from '@/composables/usePortalResource';
import { publicData } from '@/lib/portalApi';
import { readCompetitions, readPresentation } from '@/lib/portalData';
import type { Competition, Campaign } from '@/lib/portalData';
import { portalState } from '@/lib/portalState';

const competitions = usePortalResource<Competition[]>(
    () => 'homepage/highlights',
    publicData,
    readCompetitions,
);
const presentation = usePortalResource<{
    championship_campaign?: Campaign | null;
}>(() => 'presentation', publicData, readPresentation);
const entries = computed(() =>
    Array.isArray(competitions.data.value)
        ? competitions.data.value.filter(
              (event) =>
                  event &&
                  typeof event.title === 'string' &&
                  typeof event.slug === 'string' &&
                  (!event.date ||
                      event.date >= (portalState.identity?.today || '')),
          )
        : [],
);
const campaign = computed(() => presentation.data.value?.championship_campaign);
const website = String(
    import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.bulsca.co.uk',
).replace(/\/$/, '');
const identity = computed(() => portalState.identity);
</script>

<template>
    <section class="portal-page-heading">
        <small>Your BULSCA space</small>
        <h1>Welcome, {{ identity?.user.name }}</h1>
        <p>
            Your clubs, committee work and upcoming competitions in one place.
        </p>
    </section>
    <section
        v-if="campaign?.title"
        class="portal-campaign"
        aria-label="Current campaign"
    >
        <div>
            <small>BULSCA Championships</small>
            <h2>{{ campaign.title }}</h2>
            <p>
                {{ campaign.location }} · {{ campaign.start_date }} –
                {{ campaign.end_date }}
            </p>
        </div>
        <a
            :href="`${website}/competitions/championships`"
            class="portal-button light"
            >Explore the championships →</a
        >
    </section>
    <section class="portal-panel" aria-labelledby="organisations-heading">
        <div class="portal-section-heading">
            <h2 id="organisations-heading">My organisations</h2>
            <RouterLink
                v-if="identity?.can_administer"
                :to="`/organisations/${identity.association_id}`"
                >BULSCA space →</RouterLink
            >
        </div>
        <div v-if="identity?.organisations.length" class="portal-org-grid">
            <OrganisationCard
                v-for="organisation in identity.organisations"
                :key="organisation.id"
                :organisation="organisation"
            />
        </div>
        <div v-else class="portal-empty">
            <h3>No organisation membership yet</h3>
            <p>
                Your account is ready. Ask BULSCA or your club committee to add
                your registered email address to the appropriate organisation.
            </p>
        </div>
    </section>
    <section
        class="portal-panel"
        aria-labelledby="competitions-heading"
        :aria-busy="competitions.loading.value"
    >
        <div class="portal-section-heading">
            <h2 id="competitions-heading">Upcoming competitions</h2>
            <a :href="`${website}/competitions/calendar`">Full calendar →</a>
        </div>
        <p>Competitions in the next two weeks.</p>
        <p v-if="competitions.loading.value" role="status">
            Loading competitions…
        </p>
        <PortalNotice
            v-else-if="competitions.error.value"
            :error="competitions.error.value"
            :retry="competitions.reload"
        />
        <div v-else-if="entries.length" class="portal-competition-grid">
            <article
                v-for="event in entries"
                :key="event.id"
                class="portal-event"
            >
                <small>{{ event.date || 'Date to be confirmed' }}</small>
                <h3>{{ event.title }}</h3>
                <p>{{ event.location }}</p>
                <p v-if="event.summary">{{ event.summary }}</p>
                <a
                    :href="`${website}/competitions/${encodeURIComponent(event.slug)}`"
                    >Competition details →</a
                >
            </article>
        </div>
        <p v-else class="portal-empty">
            No upcoming competitions have been published yet.
        </p>
    </section>
    <PortalNotice
        v-if="presentation.error.value"
        message="The campaign banner is temporarily unavailable. Your club spaces remain available."
        :retry="presentation.reload"
    />
</template>

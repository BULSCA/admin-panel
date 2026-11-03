<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { safeColour, safeLogo } from '@/lib/portalApi';
import type { Organisation } from '@/types/portal';
defineProps<{ organisation: Organisation }>();
const brokenLogo = ref(false);
</script>

<template>
    <RouterLink
        :to="`/organisations/${organisation.id}`"
        class="portal-org-card"
        :style="{ borderTopColor: safeColour(organisation.primary_colour) }"
    >
        <img
            :src="
                !brokenLogo && safeLogo(organisation.logo_url)
                    ? safeLogo(organisation.logo_url)!
                    : '/bulsca-logo.png'
            "
            alt=""
            @error="brokenLogo = true"
        />
        <div>
            <small>{{
                organisation.kind === 'club'
                    ? 'Club space'
                    : 'Association space'
            }}</small>
            <h3>{{ organisation.name }}</h3>
            <span>Members, committees and club information →</span>
        </div>
    </RouterLink>
</template>

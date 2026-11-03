<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PortalBoundary from '@/components/portal/PortalBoundary.vue';
import PortalNotice from '@/components/portal/PortalNotice.vue';
import { portalRequest } from '@/lib/portalApi';
import { portalState, refreshIdentity } from '@/lib/portalState';

const signingOut = ref(false);
const logoutError = ref('');
const authenticationFailed =
    new URLSearchParams(window.location.search).get('auth') === 'failed';
const canManageClubs = computed(
    () =>
        portalState.identity?.is_superadmin ||
        portalState.identity?.organisations.some((org) =>
            org.permissions.includes('clubs.manage'),
        ),
);
function expired() {
    portalState.identity = null;
}
onMounted(() => {
    window.addEventListener('portal-session-expired', expired);
    void refreshIdentity();
});
onUnmounted(() =>
    window.removeEventListener('portal-session-expired', expired),
);
async function logout() {
    if (signingOut.value) {
        return;
    }

    signingOut.value = true;
    logoutError.value = '';

    try {
        await portalRequest('/logout', { method: 'POST' });
        portalState.identity = null;
    } catch {
        logoutError.value = 'We could not confirm sign out. Please try again.';
    } finally {
        signingOut.value = false;
    }
}
</script>

<template>
    <a class="portal-skip" href="#portal-main">Skip to content</a>
    <header class="portal-header">
        <RouterLink to="/" class="portal-brand"
            ><img src="/bulsca-logo.png" alt="BULSCA" /><span
                >Member portal</span
            ></RouterLink
        >
        <nav v-if="portalState.identity" aria-label="Portal navigation">
            <RouterLink to="/">Dashboard</RouterLink>
            <RouterLink
                v-if="portalState.identity.can_administer"
                :to="`/organisations/${portalState.identity.association_id}`"
                >BULSCA</RouterLink
            >
            <RouterLink v-if="canManageClubs" to="/admin"
                >Administration</RouterLink
            >
        </nav>
        <div v-if="portalState.identity" class="portal-account">
            <span>{{ portalState.identity.user.name }}</span
            ><button type="button" :disabled="signingOut" @click="logout">
                {{ signingOut ? 'Signing out…' : 'Sign out' }}
            </button>
        </div>
    </header>
    <main id="portal-main" class="portal-main" :aria-busy="portalState.loading">
        <p v-if="portalState.loading" role="status">Loading your portal…</p>
        <PortalNotice
            v-else-if="portalState.error"
            :message="portalState.error"
            :retry="() => refreshIdentity()"
        />
        <section
            v-else-if="!portalState.identity"
            class="portal-panel portal-login"
        >
            <h1>Welcome to the BULSCA member portal</h1>
            <p>
                Sign in to access your clubs, committees and organisation roles.
            </p>
            <p v-if="authenticationFailed" role="alert">
                Sign-in could not be completed. Please try again.
            </p>
            <a class="portal-button" href="/auth/sso?portal=1"
                >Sign in with BULSCA</a
            >
            <p>
                Membership is assigned by BULSCA or your club committee after
                your first sign-in.
            </p>
        </section>
        <template v-else
            ><PortalNotice
                v-if="logoutError"
                :message="logoutError" /><PortalBoundary
                ><RouterView v-slot="{ Component, route }"
                    ><component
                        :is="Component"
                        :key="route.path" /></RouterView></PortalBoundary
        ></template>
    </main>
    <footer class="portal-footer">
        <a href="https://www.bulsca.co.uk">BULSCA website</a
        ><span>Supporting university lifesaving</span>
    </footer>
</template>

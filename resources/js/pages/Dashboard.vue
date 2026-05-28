<template>
    <div class="dashboard">
        <h1>{{ userExists ? 'Logged in' : 'Not logged in' }}</h1>

        <div v-if="userExists" class="info">
            <p><strong>Name:</strong> {{ name ?? '—' }}</p>
            <p><strong>Email:</strong> {{ email ?? '—' }}</p>
            <p><strong>authentik id:</strong> {{ id ?? '—' }}</p>

            <h2>Raw user object</h2>
            <pre class="raw">{{ json }}</pre>
        </div>

        <button @click="logout">Logout</button>

    </div>
</template>


<script setup>
import { computed } from 'vue'
import { usePage, router } from '@inertiajs/vue3'

const page = usePage()

const resolvedUser = computed(() => page.props.auth?.user ?? null)
const userExists   = computed(() => !!resolvedUser.value)
const name         = computed(() => resolvedUser.value?.name ?? null)
const email        = computed(() => resolvedUser.value?.email ?? null)
const id           = computed(() => resolvedUser.value?.authentik_id ?? null)
const json         = computed(() => JSON.stringify(resolvedUser.value, null, 2))

async function logout() {
    const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': page.props.csrf_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })
    const data = await response.json()
    window.location.href = data.redirect
}
</script>

<style scoped>
.dashboard {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    padding: 1.25rem;
}
.info p {
    margin: 0.25rem 0;
}
.raw {
    background: #0f172a;
    color: #e6eef8;
    padding: 0.75rem;
    border-radius: 6px;
    overflow: auto;
    max-width: 100%;
    white-space: pre-wrap;
}
</style>
<script setup lang="ts">
import type { PortalError } from '@/lib/portalApi';
defineProps<{
    error?: PortalError | null;
    message?: string;
    retry?: () => void;
}>();
</script>

<template>
    <div class="portal-notice" role="alert">
        <p>{{ error?.message || message }}</p>
        <ul v-if="error && Object.keys(error.fields).length">
            <li v-for="(messages, field) in error.fields" :key="field">
                {{ messages.join(' ') }}
            </li>
        </ul>
        <small v-if="error?.requestId">Reference: {{ error.requestId }}</small>
        <button
            v-if="retry"
            type="button"
            class="portal-button secondary"
            @click="retry"
        >
            Try loading again
        </button>
    </div>
</template>

<script setup>
defineProps({
    content: {
        type: String,
        default: '',
    },
});
</script>

<template>
    <div
        v-if="content"
        class="flex items-center justify-center bg-red-600 p-3 text-white"
    >
        <div v-html="content" />
    </div>
</template>

<style scoped>
/* Component styles */
</style>

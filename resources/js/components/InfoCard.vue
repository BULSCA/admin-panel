<script setup>
defineProps({
    icon: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div
        class="flex w-full flex-col items-center justify-center space-y-6 md:flex-row md:space-y-0 md:space-x-12"
    >
        <div class="flex justify-center">
            <div v-html="icon" class="h-20 w-20 text-blue-500"></div>
        </div>
        <div class="flex max-w-3xl flex-col text-center md:text-left">
            <h3 class="mb-2 text-2xl font-semibold">{{ title }}</h3>
            <p class="text-gray-600">{{ description }}</p>
        </div>
    </div>
</template>

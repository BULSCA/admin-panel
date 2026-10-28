<script setup>
defineProps({
    status: {
        type: String,
        enum: ['today', 'future', 'past'],
        required: true,
    },
});
</script>

<template>
    <small class="font-semibold text-white">
        <span v-if="status === 'today'">Today</span>
        <span v-else-if="status === 'future'">Upcoming Competition</span>
        <span v-else>See you next year!</span>
    </small>
</template>

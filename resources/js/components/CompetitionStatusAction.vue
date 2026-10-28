<script setup>
defineProps({
    status: {
        type: String,
        enum: ['today', 'future', 'past'],
        required: true,
    },
    daysUntil: {
        type: Number,
        default: 0,
    },
    formattedDate: {
        type: String,
        default: '',
    },
    resultsUrl: {
        type: String,
        default: '',
    },
});
</script>

<template>
    <div>
        <a
            v-if="status === 'today'"
            href="https://live.bulsca.co.uk"
            class="rounded-md bg-green-500 px-4 py-2 text-sm text-white no-underline transition-all duration-200 ease-in-out hover:bg-green-600 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
        >
            Follow live
        </a>
        <span v-else-if="status === 'future'">
            {{ formattedDate }} ({{ daysUntil }} day{{
                daysUntil !== 1 ? 's' : ''
            }}
            to go!)
        </span>
        <a
            v-else
            :href="resultsUrl"
            class="rounded-md bg-white px-4 py-2 text-sm no-underline transition-all duration-200 ease-in-out hover:bg-gray-200 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
        >
            Results
        </a>
    </div>
</template>

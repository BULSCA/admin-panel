<script setup>
import CompetitionStatusAction from './CompetitionStatusAction.vue';
import CompetitionStatusBadge from './CompetitionStatusBadge.vue';

defineProps({
    competition: {
        type: Object,
        required: true,
    },
    status: {
        type: String,
        enum: ['today', 'future', 'past'],
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    compUrl: {
        type: String,
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
    <div class="flex h-full w-full items-center justify-center">
        <div
            class="bg-opacity-60 flex items-center justify-center rounded-md bg-black px-8 py-2 md:px-0 md:py-8"
        >
            <img
                v-if="imageUrl"
                :src="imageUrl"
                class="hidden w-[20%] md:block"
                alt="Competition host university"
            />
            <div class="border-white py-8 md:ml-12 md:border-l-2 md:pl-12">
                <CompetitionStatusBadge :status="status" />
                <h2 class="text-4xl font-bold text-white md:text-6xl">
                    <a :href="compUrl" class="text-white hover:underline">
                        {{ competition.name }}
                    </a>
                </h2>
                <p class="mt-3 text-white">
                    <CompetitionStatusAction
                        :status="status"
                        :days-until="daysUntil"
                        :formatted-date="formattedDate"
                        :results-url="resultsUrl"
                    />
                </p>
            </div>
        </div>
    </div>
</template>

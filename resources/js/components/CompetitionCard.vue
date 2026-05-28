<script setup>
import CompetitionStatusBadge from './CompetitionStatusBadge.vue'
import CompetitionStatusAction from './CompetitionStatusAction.vue'

defineProps({
  competition: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['today', 'future', 'past'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  compUrl: {
    type: String,
    required: true
  },
  daysUntil: {
    type: Number,
    default: 0
  },
  formattedDate: {
    type: String,
    default: ''
  },
  resultsUrl: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <div class="flex items-center justify-center bg-black bg-opacity-60 rounded-md py-2 md:py-8 px-8 md:px-0">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        class="w-[20%] hidden md:block"
        alt="Competition host university"
      />
      <div class="md:border-l-2 border-white md:ml-12 md:pl-12 py-8">
        <CompetitionStatusBadge :status="status" />
        <h2 class="md:text-6xl text-4xl font-bold text-white">
          <a :href="compUrl" class="text-white hover:underline">
            {{ competition.name }}
          </a>
        </h2>
        <p class="text-white mt-3">
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

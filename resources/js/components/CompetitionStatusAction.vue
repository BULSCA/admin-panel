<script setup>
defineProps({
  status: {
    type: String,
    enum: ['today', 'future', 'past'],
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
  <div>
    <a
      v-if="status === 'today'"
      href="https://live.bulsca.co.uk"
      class="bg-green-500 rounded-md px-4 py-2 text-sm no-underline text-white hover:bg-green-600 transition-all duration-200 ease-in-out hover:underline"
      rel="noopener noreferrer"
      target="_blank"
    >
      Follow live
    </a>
    <span v-else-if="status === 'future'">
      {{ formattedDate }} ({{ daysUntil }}
      day{{ daysUntil !== 1 ? 's' : '' }} to go!)
    </span>
    <a
      v-else
      :href="resultsUrl"
      class="bg-white rounded-md px-4 py-2 text-sm no-underline hover:bg-gray-200 transition-all duration-200 ease-in-out hover:underline"
      rel="noopener noreferrer"
      target="_blank"
    >
      Results
    </a>
  </div>
</template>

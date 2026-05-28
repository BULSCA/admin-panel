<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="flex flex-col md:flex-row items-center justify-center md:space-x-12 space-y-6 md:space-y-0 w-full">
    <div class="flex justify-center">
      <div v-html="icon" class="w-20 h-20 text-blue-500"></div>
    </div>
    <div class="flex flex-col max-w-3xl text-center md:text-left">
      <h3 class="text-2xl font-semibold mb-2">{{ title }}</h3>
      <p class="text-gray-600">{{ description }}</p>
    </div>
  </div>
</template>

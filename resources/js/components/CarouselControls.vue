<script setup>
defineProps({
  totalPanes: {
    type: Number,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['switch-pane'])
</script>

<template>
  <div class="flex justify-center gap-2 mt-4">
    <button
      v-for="(_, index) in Array(totalPanes)"
      :key="index"
      @click="emit('switch-pane', index)"
      :class="[
        'w-3 h-3 rounded-full transition-colors',
        currentIndex === index ? 'bg-white' : 'bg-gray-400 hover:bg-gray-300'
      ]"
      :aria-label="`Go to carousel pane ${index + 1}`"
    />
  </div>
</template>

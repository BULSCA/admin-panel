<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CarouselControls from './CarouselControls.vue'

defineProps({
  banners: {
    type: Array,
    required: true
  }
})

const currentIndex = ref(0)
let autoAdvanceInterval = null

const totalPanes = computed(() => props.banners.length)

onMounted(() => {
  autoAdvanceInterval = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % totalPanes.value
  }, 6000)
})

onUnmounted(() => {
  if (autoAdvanceInterval) clearInterval(autoAdvanceInterval)
})

const switchToPane = (index) => {
  currentIndex.value = index
  // Reset auto-advance timer
  if (autoAdvanceInterval) clearInterval(autoAdvanceInterval)
  autoAdvanceInterval = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % totalPanes.value
  }, 6000)
}
</script>

<template>
  <div class="relative overflow-hidden rounded-lg shadow-lg">
    <div class="flex transition-transform duration-500" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
      <div v-for="(banner, index) in banners" :key="index" class="min-w-full">
        <img :src="banner.image" :alt="banner.alt" class="w-full h-96 object-cover" />
      </div>
    </div>
    <CarouselControls
      :total-panes="totalPanes"
      :current-index="currentIndex"
      @switch-pane="switchToPane"
    />
  </div>
</template>

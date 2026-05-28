<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Head } from '@inertiajs/vue3'
import AlertBanner from '@/components/AlertBanner.vue'
import GuestLayout from '@/layouts/GuestLayout.vue'
import CompetitionCard from '@/components/CompetitionCard.vue'
import InfoCard from '@/components/InfoCard.vue'

// Define layout
defineOptions({
  layout: GuestLayout
})

// Import static assets
const blogo = '/storage/logo/blogo.png'
const benPhoto = '/storage/photos/ben.jpg'
const manikinPhoto = '/storage/photos/manikin_swimmer_down_view.jpg'
const freshersPhoto = '/storage/photos/freshers/freshers (4).jpeg'

const governingBodyIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>'
const byStudentsIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>'
const aimsIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>'

const props = defineProps({
  nearComp: {
    type: Object,
    default: null
  }
})

const currentIndex = ref(0)
const logoClicks = ref(0)
const countdownTime = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

// Computed properties
const isShowFreshers = computed(() => {
  const month = new Date().getMonth() + 1
  return month >= 7 && month <= 11
})

const banners = computed(() => {
  const bannerList = [
    {
      image: manikinPhoto,
      alt: 'BULSCA Logo on Background'
    }
  ]

  if (isShowFreshers.value) {
    bannerList.push({
      image: freshersPhoto,
      alt: 'Freshers Welcome'
    })
  }

  bannerList.push({
    image: manikinPhoto,
    alt: 'BULSCA Logo on Background'
  })

  return bannerList
})

const compStatus = computed(() => {
  if (!props.nearComp) return null
  const when = new Date(props.nearComp.when)
  const now = new Date()
  
  if (when.toDateString() === now.toDateString()) {
    return 'today'
  } else if (when > now) {
    return 'future'
  } else {
    return 'past'
  }
})

const daysUntilComp = computed(() => {
  if (!props.nearComp) return 0
  const when = new Date(props.nearComp.when)
  const now = new Date()
  const diff = Math.ceil((when - now) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
})

const formattedCompDate = computed(() => {
  if (!props.nearComp) return ''
  const when = new Date(props.nearComp.when)
  return when.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const compImageUrl = computed(() => {
  if (!props.nearComp?.hostUni?.image_path) return '/storage/logo/blogo.png'
  return `/image/${props.nearComp.hostUni.image_path}`
})

const compUrl = computed(() => {
  if (!props.nearComp) return '#'
  const name = props.nearComp.hostUni.name.toLowerCase().replace(/\s+/g, '-')
  const year = new Date(props.nearComp.when).getFullYear()
  return `/lc/${name}-${year}.${props.nearComp.id}`
})

const bannerStyle = computed(() => {
  if (!props.nearComp?.hostUni?.page?.banner_color) {
    return { background: '#000000ff' }
  }
  return { background: props.nearComp.hostUni.page.banner_color }
})

const resultsUrl = computed(() => {
  if (!props.nearComp) return ''
  const dateStr = new Date(props.nearComp.when).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
  return `https://results.bulsca.co.uk/resolve/${dateStr}/${props.nearComp.hostUni.name}`
})

// Methods
const handleLogoDoubleClick = (target) => {
  logoClicks.value++
  if (logoClicks.value >= 2) {
    target.src = benPhoto
    target.classList.add('animate-spin')
  }
}

const switchSlide = (index) => {
  currentIndex.value = index
  // Reset auto-advance timer when user manually switches
  if (carouselInterval) clearInterval(carouselInterval)
  carouselInterval = setInterval(() => {
    const totalSlides = (props.nearComp ? 2 : 1) + (isShowFreshers.value ? 1 : 0) + 1
    currentIndex.value = (currentIndex.value + 1) % totalSlides
  }, 6000)
}

const updateCountdown = () => {
  const targetDate = new Date('2026-03-07T09:00:00').getTime()
  const now = new Date().getTime()
  const distance = targetDate - now

  if (distance < 0) {
    countdownTime.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  countdownTime.value = {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000)
  }
}

// Lifecycle hooks
let carouselInterval
let countdownInterval

onMounted(() => {
  // Auto-advance carousel every 6 seconds
  carouselInterval = setInterval(() => {
    const totalSlides = (props.nearComp ? 2 : 1) + (isShowFreshers.value ? 1 : 0) + 1
    currentIndex.value = (currentIndex.value + 1) % totalSlides
  }, 6000)

  // Update countdown every second
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  clearInterval(carouselInterval)
  clearInterval(countdownInterval)
})
</script>

<template>
  <div>
    <Head>
      <meta name="description" content="The British Universities Life Saving Clubs' Association (BULSCA) acts as the governing body for, and oversees competitive lifesaving between, university clubs. Our competitions test lifesaving athletes on their prioritisation, rescue skills, fitness, first aid knowledge and ability to adapt and show initiative in an emergency." />
    </Head>

    <!-- Banner Carousel -->
    <div id="banner-carousel" data-snow-container class="h-[60vh] max-h-[70vh] overflow-hidden w-screen bg-gray-100">
      <div class="h-full w-screen relative">
        <!-- Panes Container -->
        <div class="h-full w-full flex flex-row overflow-hidden transition-transform duration-500" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
          <!-- Upcoming Competition Pane -->
          <div v-if="nearComp" class="w-full flex flex-col items-center justify-center head-bg-4">
            <CompetitionCard
              :competition="nearComp"
              :status="compStatus"
              :image-url="compImageUrl"
              :comp-url="compUrl"
              :days-until="daysUntilComp"
              :formatted-date="formattedCompDate"
              :results-url="resultsUrl"
            />
          </div>

          <!-- Logo Pane 1 -->
          <div class="w-full h-full flex items-center justify-center head-bg-3 transition-opacity duration-1000" :style="{ backgroundImage: `url(${manikinPhoto})` }">
            <img
              :src="blogo"
              @dblclick="handleLogoDoubleClick"
              class="md:w-[12.5%] w-[50%] h-auto cursor-pointer"
              alt="BULSCA Logo"
            />
          </div>

          <!-- Freshers Pane -->
          <div
            v-if="isShowFreshers"
            class="w-full flex flex-col items-center justify-center head-bg-3 transition-opacity duration-1000 !bg-right md:bg-center"
            :style="{ backgroundImage: `url(${freshersPhoto})` }"
          >
            <div class="py-8 text-center flex flex-col">
              <p class="md:text-[5rem] text-5xl font-bold text-white mb-3 md:mb-0">Hello Freshers 👋</p>
              <p class="text-xl font-semibold text-white">Welcome to university lifesaving</p>
              <a
                href="/freshers#clubs"
                class="btn self-center btn-thinner mt-8 rounded-full"
              >
                Find my club & more
              </a>
            </div>
          </div>

          <!-- Logo Pane 2 -->
          <div class="w-full h-full flex items-center justify-center head-bg-3 transition-opacity duration-1000">
            <img
              :src="blogo"
              @dblclick="handleLogoDoubleClick"
              class="md:w-[12.5%] w-[50%] h-auto cursor-pointer"
              alt="BULSCA Logo"
            />
          </div>
        </div>

        <!-- Carousel Controls -->
        <div class="absolute bottom-4 left-0 w-screen flex items-center justify-center space-x-3">
          <button
            v-for="(_, index) in (nearComp ? 3 : 2) + (isShowFreshers ? 1 : 0)"
            :key="index"
            @click="switchSlide(index)"
            :class="[
              'cursor-pointer size-3 rounded-full transition-colors',
              currentIndex === index ? 'bg-bulsca' : 'bg-gray-100 opacity-90'
            ]"
            :aria-label="`Go to slide ${index + 1}`"
          />
        </div>
      </div>
    </div>

    <!-- Alert Banner -->
    <AlertBanner />

    <!-- Content Section -->
    <div class="container-responsive">
      <div class="flex flex-col space-y-9">
        <!-- Governing Body Section -->
        <InfoCard
          :icon="governingBodyIcon"
          title="Acting Governing Body"
          description="BULSCA acts as the governing body for lifesaving sport while at University. We are an organisation overseeing the development of university lifesaving clubs, and ensure the smooth-running of an annual league."
        />

        <!-- Students Section -->
        <div class="flex flex-col-reverse md:flex-row items-center justify-center md:space-x-12 space-y-6 md:space-y-0 text-center md:text-left w-full">
          <InfoCard
            :icon="byStudentsIcon"
            title="By Students, For Students"
            description="The BULSCA committee is made up entirely of volunteers, either current students or graduates from higher education institutions."
          />
        </div>

        <!-- Aims Section -->
        <InfoCard
          :icon="aimsIcon"
          title="Our aims"
          description="Our aims are to promote the training and development of lifesaving skills, to promote and develop lifesaving as a sport and to oversee competitive lifesaving between Higher Education institutions."
        />
      </div>
    </div>

    <!-- Competition Boast Section -->
    <div v-if="nearComp" class="container-boast" :style="bannerStyle">
      <img :src="compImageUrl" class="w-56" alt="Competition host university" />
      <div class="flex flex-col">
        <p class="text-white 2xl:text-2xl text-1xl font-bold uppercase text-center md:text-left">
          <span v-if="compStatus === 'today'">Today</span>
          <span v-else-if="compStatus === 'future'">Upcoming Competition</span>
          <span v-else>See you next year!</span>
        </p>
        <p>
          <a :href="compUrl" class="text-white 2xl:text-4xl text-3xl font-bold uppercase text-center md:text-left hover:underline">
            {{ nearComp.name }}
          </a>
        </p>
        <p class="text-gray-300 2xl:text-xl text-lg font-semibold uppercase text-center md:text-left">
          <a
            v-if="compStatus === 'today'"
            href="https://live.bulsca.co.uk"
            class="bg-green-500 rounded-md px-4 py-2 text-sm no-underline text-white hover:bg-green-600 transition-all duration-200 ease-in-out hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Follow live
          </a>
          <span v-else-if="compStatus === 'future'">
            {{ formattedCompDate }} ({{ daysUntilComp }}
            day{{ daysUntilComp !== 1 ? 's' : '' }} to go!)
          </span>
          <a
            v-else
            :href="`https://results.bulsca.co.uk/resolve/${new Date(nearComp.when).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}/${nearComp.hostUni.name}`"
            class="bg-white rounded-md px-4 py-2 text-sm no-underline hover:bg-gray-200 transition-all duration-200 ease-in-out hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Results
          </a>
        </p>
      </div>
      <a
        v-if="compStatus === 'today'"
        href="https://live.bulsca.co.uk"
        class="bg-green-500 rounded-md px-4 py-2 text-sm no-underline text-white hover:bg-green-600 transition-all duration-200 ease-in-out hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        Follow live
      </a>
      <a
        v-else-if="compStatus === 'past'"
        :href="`https://results.bulsca.co.uk/resolve/${new Date(nearComp.when).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}/${nearComp.hostUni.name}`"
        class="bg-white rounded-md px-4 py-2 text-sm no-underline hover:bg-gray-200 transition-all duration-200 ease-in-out hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        Results
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Component specific styles if needed */
</style>

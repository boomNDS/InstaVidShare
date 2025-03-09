<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { searchVideos, getChannelVideos, type YouTubeVideo } from '../lib/youtube'
import { useVideoStore } from '../stores/video'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const videoStore = useVideoStore()
const searchQuery = ref('')
const videos = ref<YouTubeVideo[]>([])
const channelVideos = ref<YouTubeVideo[]>([])
const loading = ref(false)
const channelLoading = ref(false)
const userEmail = ref('')
const showDropdown = ref(false)
const activeTab = ref('search') // 'search' or 'channel'

async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return

  try {
    loading.value = true
    videos.value = await searchVideos(searchQuery.value)
  } catch (error) {
    console.error('Error searching videos:', error)
    alert('Error searching videos. Please try again.')
  } finally {
    loading.value = false
  }
}

async function loadChannelVideos() {
  try {
    channelLoading.value = true
    channelVideos.value = await getChannelVideos()
  } catch (error) {
    console.error('Error loading channel videos:', error)
    alert('Error loading channel videos. Please try again.')
  } finally {
    channelLoading.value = false
  }
}

function goToGenerator(video: YouTubeVideo) {
  videoStore.setSelectedVideo(video)
  router.push('/generate/new')
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    router.push('/')
  } else {
    userEmail.value = session.user.email || ''
    loadChannelVideos()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-primary">InstaVidShare</h1>
          
          <div class="relative">
            <button 
              @click="showDropdown = !showDropdown"
              class="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <img 
                :src="`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`"
                alt="Profile" 
                class="w-8 h-8 rounded-full bg-gray-200"
              />
              <span>{{ userEmail }}</span>
            </button>
            
            <div 
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
            >
              <button
                @click="handleSignOut"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs -->
      <div class="flex space-x-4 mb-6">
        <button 
          @click="activeTab = 'search'"
          :class="[
            'px-4 py-2 rounded-md font-medium',
            activeTab === 'search' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          Search Videos
        </button>
        <button 
          @click="activeTab = 'channel'"
          :class="[
            'px-4 py-2 rounded-md font-medium',
            activeTab === 'channel' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          My Channel
        </button>
      </div>

      <!-- Search Tab -->
      <div v-if="activeTab === 'search'">
        <div class="mb-8">
          <div class="flex gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search YouTube videos..."
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              @keyup.enter="handleSearch"
            />
            <button
              @click="handleSearch"
              :disabled="loading"
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {{ loading ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="video in videos"
            :key="video.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
            @click="goToGenerator(video)"
          >
            <img
              :src="video.thumbnail"
              :alt="video.title"
              class="w-full h-48 object-cover rounded-t-lg"
            />
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">
                {{ video.title }}
              </h3>
              <p class="text-sm text-gray-600">{{ video.channelTitle }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ video.publishedAt }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="!loading && videos.length === 0"
          class="text-center py-12 text-gray-500"
        >
          Search for YouTube videos to get started
        </div>
      </div>

      <!-- Channel Tab -->
      <div v-else>
        <h2 class="text-xl font-semibold mb-6">My Channel Videos</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="video in channelVideos"
            :key="video.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
            @click="goToGenerator(video)"
          >
            <img
              :src="video.thumbnail"
              :alt="video.title"
              class="w-full h-48 object-cover rounded-t-lg"
            />
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">
                {{ video.title }}
              </h3>
              <p class="text-sm text-gray-500 mb-2">{{ video.publishedAt }}</p>
              <p class="text-sm text-gray-600 line-clamp-2">{{ video.description }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="!channelLoading && channelVideos.length === 0"
          class="text-center py-12 text-gray-500"
        >
          No videos found in your channel
        </div>
      </div>

      <!-- Loading States -->
      <div
        v-if="loading || channelLoading"
        class="text-center py-12"
      >
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
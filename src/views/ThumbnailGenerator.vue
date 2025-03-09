<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '../stores/video'
import { supabase } from '../lib/supabase'
import { generateStoryImage } from '../lib/imageGenerator'
import { debounce } from 'lodash-es'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const videoStore = useVideoStore()
const showShareModal = ref(false)
const isGenerating = ref(false)
const generatedImage = ref<string | null>(null)
const userEmail = ref('')
const autoCloseTimer = ref<number | null>(null)
const customImage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Editor state
const textColor = ref('#ffffff')
const fontSize = ref(64)
const overlayOpacity = ref(30)
const channelNameSize = ref(48)

function goBack() {
  router.push('/dashboard')
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    customImage.value = e.target?.result as string
    updatePreview()
  }
  reader.readAsDataURL(file)
}

function resetImage() {
  customImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  updatePreview()
}

// Watch for changes and update preview
const updatePreview = debounce(async () => {
  if (!videoStore.selectedVideo) return
  
  try {
    const imageData = await generateStoryImage({
      video: videoStore.selectedVideo,
      userEmail: userEmail.value,
      textColor: textColor.value,
      fontSize: fontSize.value,
      overlayOpacity: overlayOpacity.value,
      channelNameSize: channelNameSize.value,
      customImage: customImage.value || undefined
    })
    
    generatedImage.value = imageData
  } catch (error) {
    console.error('Error updating preview:', error)
  }
}, 500)

// Watch for changes
watch([textColor, fontSize, overlayOpacity, channelNameSize], updatePreview)

// Clear auto-close timer when modal is closed
watch(showShareModal, (newValue) => {
  if (!newValue && autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
})

async function downloadImage() {
  if (!videoStore.selectedVideo) return
  
  try {
    isGenerating.value = true
    
    const imageData = await generateStoryImage({
      video: videoStore.selectedVideo,
      userEmail: userEmail.value,
      textColor: textColor.value,
      fontSize: fontSize.value,
      overlayOpacity: overlayOpacity.value,
      channelNameSize: channelNameSize.value,
      customImage: customImage.value || undefined
    })

    // Create download link
    const link = document.createElement('a')
    link.href = imageData
    link.download = `${videoStore.selectedVideo.title || 'story'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    generatedImage.value = imageData
    showShareModal.value = true

    // Auto-close modal after 3 seconds
    if (autoCloseTimer.value) {
      clearTimeout(autoCloseTimer.value)
    }
    autoCloseTimer.value = setTimeout(() => {
      showShareModal.value = false
      autoCloseTimer.value = null
    }, 3000) as unknown as number
  } catch (error) {
    console.error('Error:', error)
    alert('Failed to generate image. Please try again.')
  } finally {
    isGenerating.value = false
  }
}

async function shareToInstagram() {
  if (!generatedImage.value) {
    alert('Please generate the image first')
    return
  }
  
  if (navigator.share) {
    try {
      const blob = await fetch(generatedImage.value).then(r => r.blob())
      await navigator.share({
        files: [new File([blob], 'story.png', { type: 'image/png' })]
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  } else {
    alert('Save the image and upload it to Instagram Stories')
  }
  showShareModal.value = false
}

onMounted(async () => {
  if (!videoStore.selectedVideo) {
    router.push('/dashboard')
    return
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    userEmail.value = session.user.email || ''
    updatePreview()
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <button 
            @click="goBack"
            class="text-gray-700 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 class="text-gray-900 font-medium">Create Story</h1>
          <div class="w-10"></div>
        </div>
      </div>
    </header>

    <main class="pt-16 pb-32">
      <!-- Desktop Layout Container -->
      <div class="max-w-7xl mx-auto px-4 lg:flex lg:gap-8 lg:items-start">
        <!-- Preview Area - Takes 60% on desktop -->
        <div class="lg:flex-[0_0_60%]">
          <div class="max-w-md mx-auto lg:max-w-none">
            <div class="aspect-[9/16] mb-8 rounded-xl shadow-lg overflow-hidden">
              <img 
                v-if="generatedImage"
                :src="generatedImage"
                class="w-full h-full object-contain"
                alt="Story Preview"
              />
              <div 
                v-else 
                class="w-full h-full bg-gray-100 flex items-center justify-center"
              >
                <p class="text-gray-500">Generating preview...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Panel - Takes 40% on desktop -->
        <div class="lg:flex-[0_0_40%] lg:sticky lg:top-20">
          <div class="max-w-md mx-auto lg:max-w-none">
            <!-- Editor Controls -->
            <div class="space-y-6 bg-gray-50 p-6 rounded-xl">
              <!-- Background Image -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-4">Background Image</label>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <input
                      type="file"
                      ref="fileInput"
                      accept="image/*"
                      class="hidden"
                      @change="handleFileUpload"
                    />
                    <button
                      @click="fileInput?.click()"
                      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {{ customImage ? 'Change Image' : 'Upload Custom Image' }}
                    </button>
                    <button
                      v-if="customImage"
                      @click="resetImage"
                      class="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      Reset to Thumbnail
                    </button>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ customImage ? 'Using custom image' : 'Using video thumbnail' }}
                  </p>
                </div>
              </div>

              <!-- Text Styling -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-4">Style Settings</label>
                <div class="space-y-4">
                  <!-- Channel Name Size -->
                  <div>
                    <div class="flex justify-between text-sm text-gray-700 mb-2">
                      <label>Channel Name Size</label>
                      <span>{{ channelNameSize }}px</span>
                    </div>
                    <input
                      type="range"
                      v-model="channelNameSize"
                      min="32"
                      max="64"
                      class="w-full"
                    />
                  </div>

                  <!-- Title Size -->
                  <div>
                    <div class="flex justify-between text-sm text-gray-700 mb-2">
                      <label>Title Size</label>
                      <span>{{ fontSize }}px</span>
                    </div>
                    <input
                      type="range"
                      v-model="fontSize"
                      min="40"
                      max="80"
                      class="w-full"
                    />
                  </div>

                  <!-- Overlay Opacity -->
                  <div>
                    <div class="flex justify-between text-sm text-gray-700 mb-2">
                      <label>Overlay Opacity</label>
                      <span>{{ overlayOpacity }}%</span>
                    </div>
                    <input
                      type="range"
                      v-model="overlayOpacity"
                      min="0"
                      max="70"
                      class="w-full"
                    />
                  </div>

                  <!-- Text Color -->
                  <div>
                    <label class="block text-sm text-gray-600 mb-2">Text Color</label>
                    <input
                      type="color"
                      v-model="textColor"
                      class="w-full h-10 rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <!-- Generate Button -->
              <button 
                @click="downloadImage"
                :disabled="isGenerating"
                class="w-full py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {{ isGenerating ? 'Generating...' : 'Generate & Download' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />

    <!-- Share Modal -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Image Generated!</h3>
          <p class="text-gray-600 mb-6">Your story image has been downloaded. Ready to share?</p>
          
          <div class="space-y-3">
            <button 
              @click="shareToInstagram"
              class="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Share to Instagram
            </button>
            <button 
              @click="showShareModal = false"
              class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
input[type="range"] {
  @apply h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

input[type="range"]::-webkit-slider-thumb {
  @apply w-4 h-4 bg-black rounded-full appearance-none cursor-pointer;
}
</style>
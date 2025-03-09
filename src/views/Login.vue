<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase, getRedirectUrl } from '../lib/supabase'
import { useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'

const loading = ref(false)
const router = useRouter()

async function signInWithGoogle() {
  try {
    loading.value = true
    console.log('Starting Google sign-in process...')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      console.error('Supabase auth error:', error)
      throw error
    }
    
    if (!data.url) {
      throw new Error('No redirect URL received')
    }

    console.log('Redirecting to:', data.url)
    window.location.href = data.url
    
  } catch (error) {
    console.error('Error during sign-in:', error)
    alert('Error signing in with Google. Please try again.')
  } finally {
    loading.value = false
  }
}

// Check if we're already authenticated
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    console.log('User is already authenticated')
    router.push('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-md p-8 space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-primary mb-2">InstaVidShare</h1>
          <p class="text-gray-600">Share YouTube videos to Instagram Stories</p>
        </div>

        <div class="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
          <p class="text-gray-500">App Preview Image</p>
        </div>

        <button
          @click="signInWithGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-4 py-2 bg-white text-gray-700 rounded-md border hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5" />
          <span>{{ loading ? 'Signing in...' : 'Sign in with Google' }}</span>
        </button>
      </div>
    </div>
    
    <AppFooter />
  </div>
</template>
import { defineStore } from 'pinia'
import type { YouTubeVideo } from '../lib/youtube'

export const useVideoStore = defineStore('video', {
  state: () => ({
    selectedVideo: null as YouTubeVideo | null,
  }),
  actions: {
    setSelectedVideo(video: YouTubeVideo | null) {
      this.selectedVideo = video
    },
  },
})
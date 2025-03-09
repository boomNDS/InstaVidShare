import axios from 'axios';

const API_KEY = 'AIzaSyApcHZnmgmT4kvuxE9Vc1U7cWJYm8REQSk';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const CHANNEL_ID = 'UC-lHJZR3Gqxm24_Vd_AJ5Yw'; // Replace with your channel ID

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
}

export async function searchVideos(query: string): Promise<YouTubeVideo[]> {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: 10,
        q: query,
        type: 'video',
        key: API_KEY,
      },
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    const videosResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,snippet',
        id: videoIds,
        key: API_KEY,
      },
    });

    return videosResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

export async function getChannelVideos(): Promise<YouTubeVideo[]> {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        channelId: CHANNEL_ID,
        maxResults: 50,
        order: 'date',
        type: 'video',
        key: API_KEY,
      },
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    const videosResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,snippet',
        id: videoIds,
        key: API_KEY,
      },
    });

    return videosResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
    }));
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
}
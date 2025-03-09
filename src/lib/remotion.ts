import { renderStill } from '@remotion/renderer'
import type { YouTubeVideo } from './youtube'

interface StoryConfig {
  video: YouTubeVideo
  userEmail: string
  textColor: string
  fontSize: number
  overlayOpacity: number
  channelNameSize: number
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

export async function generateStoryImage(config: StoryConfig): Promise<string> {
  const { video, userEmail, textColor, fontSize, overlayOpacity, channelNameSize } = config

  const imageData = await renderStill({
    composition: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fps: 30,
      durationInFrames: 1,
    },
    webpackBundle: (webpackConfig) => {
      return {
        ...webpackConfig,
        module: {
          ...webpackConfig.module,
          rules: [
            {
              test: /\.(png|jpg|jpeg|gif)$/i,
              type: 'asset',
            },
          ],
        },
      }
    },
    component: ({ width, height }) => {
      return {
        template: `
          <div style="width: ${width}px; height: ${height}px; position: relative; overflow: hidden;">
            <!-- Background Image -->
            <img 
              src="${video.thumbnail}"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
              "
            />
            
            <!-- Gradient Overlay -->
            <div style="
              position: absolute;
              inset: 0;
              background: linear-gradient(
                180deg,
                rgba(0,0,0,0.7) 0%,
                rgba(0,0,0,${overlayOpacity / 100}) 40%,
                rgba(0,0,0,${overlayOpacity / 100}) 60%,
                rgba(0,0,0,0.7) 100%
              );
            "></div>

            <!-- Channel Info -->
            <div style="
              position: absolute;
              top: 40px;
              left: 40px;
              display: flex;
              align-items: center;
              gap: 20px;
            ">
              <img
                src="https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}"
                style="
                  width: 80px;
                  height: 80px;
                  border-radius: 50%;
                "
              />
              <span style="
                color: ${textColor};
                font-size: ${channelNameSize}px;
                font-weight: bold;
                text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
              ">${userEmail}</span>
            </div>

            <!-- Video Title -->
            <div style="
              position: absolute;
              bottom: 120px;
              left: 40px;
              right: 40px;
              color: ${textColor};
              font-size: ${fontSize}px;
              font-weight: bold;
              text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
              line-height: 1.2;
            ">${video.title}</div>
          </div>
        `,
      }
    },
  })

  return imageData
}
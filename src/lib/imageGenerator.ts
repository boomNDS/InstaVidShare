import type { YouTubeVideo } from './youtube'

interface StoryConfig {
  video: YouTubeVideo
  userEmail: string
  textColor: string
  fontSize: number
  overlayOpacity: number
  channelNameSize: number
  customImage?: string
}

// Instagram Story dimensions (9:16 aspect ratio) - reduced size
const STORY_WIDTH = 720
const STORY_HEIGHT = 1280

export async function generateStoryImage(config: StoryConfig): Promise<string> {
  const { video, userEmail, textColor, fontSize, overlayOpacity, channelNameSize, customImage } = config

  // Create canvas with Instagram Story dimensions
  const canvas = document.createElement('canvas')
  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Load images
  const [backgroundImage, profileImage] = await Promise.all([
    loadImage(customImage || video.thumbnail),
    loadImage(`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`)
  ])

  // Calculate background image dimensions to maintain aspect ratio
  const bgAspectRatio = backgroundImage.width / backgroundImage.height
  const canvasAspectRatio = STORY_WIDTH / STORY_HEIGHT
  
  let drawWidth = STORY_WIDTH
  let drawHeight = STORY_HEIGHT
  let drawX = 0
  let drawY = 0

  if (bgAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas
    drawHeight = STORY_HEIGHT
    drawWidth = drawHeight * bgAspectRatio
    drawX = -(drawWidth - STORY_WIDTH) / 2
  } else {
    // Image is taller than canvas
    drawWidth = STORY_WIDTH
    drawHeight = drawWidth / bgAspectRatio
    drawY = -(drawHeight - STORY_HEIGHT) / 2
  }

  // Draw and blur the background
  ctx.filter = 'blur(8px)'
  ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight)
  ctx.filter = 'none'

  // Draw the main image in the center with proper aspect ratio
  const mainImageSize = {
    width: STORY_WIDTH * 0.85, // 85% of canvas width
    height: (STORY_WIDTH * 0.85) / bgAspectRatio
  }

  // Ensure the main image doesn't exceed 60% of the story height
  if (mainImageSize.height > STORY_HEIGHT * 0.6) {
    mainImageSize.height = STORY_HEIGHT * 0.6
    mainImageSize.width = mainImageSize.height * bgAspectRatio
  }

  const mainImageX = (STORY_WIDTH - mainImageSize.width) / 2
  const mainImageY = (STORY_HEIGHT - mainImageSize.height) / 2

  // Draw the main image
  ctx.drawImage(
    backgroundImage,
    mainImageX,
    mainImageY,
    mainImageSize.width,
    mainImageSize.height
  )

  // Draw gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT)
  gradient.addColorStop(0, `rgba(0,0,0,0.7)`)
  gradient.addColorStop(0.3, `rgba(0,0,0,${overlayOpacity / 100})`)
  gradient.addColorStop(0.7, `rgba(0,0,0,${overlayOpacity / 100})`)
  gradient.addColorStop(1, `rgba(0,0,0,0.7)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  // Draw profile image
  const profileSize = 60
  ctx.save()
  ctx.beginPath()
  ctx.arc(30 + profileSize/2, 30 + profileSize/2, profileSize/2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(profileImage, 30, 30, profileSize, profileSize)
  ctx.restore()

  // Draw channel name
  const scaledChannelNameSize = Math.floor(channelNameSize * 0.75)
  ctx.font = `bold ${scaledChannelNameSize}px Inter, system-ui, sans-serif`
  ctx.fillStyle = textColor
  ctx.textBaseline = 'middle'
  
  // Add text shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  
  ctx.fillText(userEmail, 110, 60)

  // Draw video title
  const scaledFontSize = Math.floor(fontSize * 0.75)
  ctx.font = `bold ${scaledFontSize}px Inter, system-ui, sans-serif`
  ctx.fillStyle = textColor
  ctx.textBaseline = 'bottom'

  const maxWidth = STORY_WIDTH - 60
  const words = video.title.split(' ')
  let line = ''
  let y = STORY_HEIGHT - 90
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, 30, y)
      line = word
      y -= scaledFontSize * 1.2
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, 30, y)
  }

  return canvas.toDataURL('image/png', 0.9)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
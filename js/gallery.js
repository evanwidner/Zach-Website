/**
 * gallery.js — Dynamic photo loader from Supabase
 * Populates #galleryGrid and #horizontalTrack, then signals main.js to reinit.
 */

import { fetchPhotos, getPhotoUrl } from '../supabase.js'

// Height classes cycle for visual masonry rhythm
const HEIGHT_CYCLE = ['h2', 'h3', 'h1', 'h4', 'h2', 'h1', 'h3', 'h2']

/**
 * Build one gallery-item div for the masonry grid.
 */
function buildGridItem(photo, index) {
  const heightClass = photo.height_class || HEIGHT_CYCLE[index % HEIGHT_CYCLE.length]
  const url = getPhotoUrl(photo.storage_path)

  const item = document.createElement('div')
  item.className = `gallery-item gallery-item--${heightClass} glow-target tilt-card image-reveal`
  item.dataset.category = photo.category
  item.dataset.src = url
  item.dataset.title = photo.title

  item.innerHTML = `
    <div class="gallery-item__placeholder">
      <img
        src="${url}"
        alt="${photo.alt_text || photo.title}"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="gallery-item__overlay"><span>${photo.title}</span></div>
  `
  return item
}

/**
 * Build one gallery-h-item div for the horizontal drag view.
 */
function buildHorizontalItem(photo) {
  const url = getPhotoUrl(photo.storage_path)

  const item = document.createElement('div')
  item.className = 'gallery-h-item tilt-card'
  item.dataset.category = photo.category
  item.dataset.src = url
  item.dataset.title = photo.title

  item.innerHTML = `
    <div class="gallery-item__placeholder gallery-item--h2">
      <img
        src="${url}"
        alt="${photo.alt_text || photo.title}"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="gallery-item__overlay"><span>${photo.title}</span></div>
  `
  return item
}

/**
 * Show skeleton loading placeholders while photos fetch.
 */
function showSkeletons(grid, count = 8) {
  grid.innerHTML = ''
  const heights = ['h2', 'h3', 'h1', 'h4', 'h2', 'h1', 'h3', 'h2']
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    el.className = `gallery-item gallery-item--${heights[i % heights.length]} skeleton-item`
    el.innerHTML = `<div class="gallery-item__placeholder gallery-skeleton"></div>`
    grid.appendChild(el)
  }
}

/**
 * Main entry: load all photos and populate both views.
 */
async function loadGallery() {
  const grid  = document.getElementById('galleryGrid')
  const track = document.getElementById('horizontalTrack')
  if (!grid) return

  // Show skeletons while loading
  showSkeletons(grid)

  const photos = await fetchPhotos('all')

  if (!photos.length) {
    grid.innerHTML = `
      <div class="gallery-empty">
        <p>No photos yet — upload some to the <em>portfolio</em> Supabase bucket.</p>
      </div>
    `
    return
  }

  // Populate masonry grid
  grid.innerHTML = ''
  photos.forEach((photo, i) => {
    grid.appendChild(buildGridItem(photo, i))
  })

  // Populate horizontal track (first 12 for performance)
  if (track) {
    // Keep the drag hint, replace items before it
    const hint = track.querySelector('.gallery-horizontal__hint')
    track.innerHTML = ''
    photos.slice(0, 12).forEach(photo => {
      track.appendChild(buildHorizontalItem(photo))
    })
    if (hint) track.appendChild(hint)
  }

  // Signal main.js that gallery is populated so it can reinit lightbox/filters
  document.dispatchEvent(new CustomEvent('gallery:loaded'))
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGallery)
} else {
  loadGallery()
}

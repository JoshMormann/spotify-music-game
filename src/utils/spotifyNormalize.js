export function normalizeTrack(track) {
  return {
    id: track.id,
    name: track.name,
    durationMs: track.duration_ms,
    popularity: track.popularity,
    album: track.album ? normalizeAlbum(track.album) : null,
    artists: track.artists ? track.artists.map(normalizeArtist) : [],
    previewUrl: track.preview_url,
    uri: track.uri,
  };
}

export function normalizeAlbum(album) {
  return {
    id: album.id,
    name: album.name,
    releaseDate: album.release_date,
    images: album.images,
    popularity: album.popularity,
    artists: album.artists ? album.artists.map(normalizeArtist) : [],
    uri: album.uri,
  };
}

export function normalizeArtist(artist) {
  return {
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
  };
}

export function getBestImage(images, minWidth = 300) {
  if (!images || images.length === 0) return null;
  // Find the smallest image >= minWidth, or the largest if none
  const sorted = [...images].sort((a, b) => a.width - b.width);
  return (
    sorted.find(img => img.width >= minWidth) || sorted[sorted.length - 1]
  );
}

export function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
} 
import { Photo } from '../../hooks/usePhotoStorage';
import { PhotoRowVariant } from './PhotoRow';

export interface PhotoRowData {
  id: string;
  photos: Photo[];
  variant: PhotoRowVariant;
  height: number;
}

// Define a repeating pattern of layouts for visual variety
const LAYOUT_PATTERN: { count: number; variant: PhotoRowVariant; height: number }[] = [
  { count: 3, variant: 'leftLarge', height: 260 },
  { count: 2, variant: 'leftHeavy', height: 260 },
  { count: 3, variant: 'rightLarge', height: 260 },
  { count: 2, variant: 'equal', height: 260 },
  { count: 1, variant: 'full', height: 390 },
  { count: 3, variant: 'topHeavy', height: 390 },
  { count: 2, variant: 'rightHeavy', height: 260 },
  { count: 3, variant: 'bottomHeavy', height: 390 },
  { count: 3, variant: 'equal', height: 300 },
];

export function chunkPhotosIntoRows(photos: Photo[]): PhotoRowData[] {
  const rows: PhotoRowData[] = [];
  let photoIndex = 0;
  let patternIndex = 0;

  while (photoIndex < photos.length) {
    const pattern = LAYOUT_PATTERN[patternIndex % LAYOUT_PATTERN.length];
    const remainingPhotos = photos.length - photoIndex;

    // Take the number of photos for this pattern, or whatever's left
    const photosToTake = Math.min(pattern.count, remainingPhotos);
    const rowPhotos = photos.slice(photoIndex, photoIndex + photosToTake);

    // Determine the appropriate variant based on actual photo count
    let variant = pattern.variant;
    let height = pattern.height;

    // Adjust variant if we don't have enough photos for the intended layout
    if (photosToTake === 1) {
      variant = 'full';
      height = 390;
    } else if (photosToTake === 2 && pattern.count === 3) {
      // If we wanted 3 but only have 2, pick a 2-photo variant
      variant = 'leftHeavy';
      height = 260;
    }

    rows.push({
      id: `row-${photoIndex}-${photosToTake}`,
      photos: rowPhotos,
      variant,
      height,
    });

    photoIndex += photosToTake;
    patternIndex++;
  }

  return rows;
}

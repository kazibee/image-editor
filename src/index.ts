import { createImageClient } from './image-client';

export type {
  ImageInfo,
  ResizeOptions,
  CropOptions,
  ConvertOptions,
  EditResult,
} from './image-client';

export default function main() {
  return createImageClient();
}

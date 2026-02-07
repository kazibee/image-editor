import { createImageClient } from './image-client';

export type {
  ImageInfo,
  ResizeOptions,
  CropOptions,
  ConvertOptions,
  EditResult,
  FontInfo,
  PixelColor,
  ColorKeyOptions,
  ChromaKeyOptions,
  AutoEdgeKeyOptions,
  EdgeDetectOptions,
  CanvasInfo,
  TextLayerOptions,
  AddImageLayerOptions,
  ImageLayer,
  TextLayer,
  CanvasLayer,
} from './image-client';

export default function main() {
  return createImageClient();
}

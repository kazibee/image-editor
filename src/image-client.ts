import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

/** Basic metadata returned for an image file. */
export interface ImageInfo {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
}

/** Resize options for width/height and fit behavior. */
export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

/** Absolute pixel crop rectangle. */
export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Output format conversion options. */
export interface ConvertOptions {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
}

/** Result information for write/edit operations. */
export interface EditResult {
  outputPath: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  format?: string;
}

/** Installed system font information. */
export interface FontInfo {
  family: string;
  source: 'fc-list' | 'system-font-dir';
}

/** RGBA pixel sample at a specific coordinate. */
export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
  x: number;
  y: number;
}

/** Color-keying parameters for transparency extraction. */
export interface ColorKeyOptions {
  color: string | [number, number, number];
  tolerance?: number;
  feather?: number;
}

/** Chroma key parameters for green/blue screen style removal. */
export interface ChromaKeyOptions {
  keyColor: string | [number, number, number];
  similarity?: number;
  blend?: number;
}

/** Automatic edge-based keying options. */
export interface AutoEdgeKeyOptions {
  tolerance?: number;
  feather?: number;
  sampleStep?: number;
}

/** Edge detection output options. */
export interface EdgeDetectOptions {
  threshold?: number;
  invert?: boolean;
}

/** In-memory canvas descriptor. */
export interface CanvasInfo {
  canvasId: string;
  width: number;
  height: number;
  background: string;
  layerCount: number;
}

/** Text layer style options for canvas composition. */
export interface TextLayerOptions {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  color?: string;
  opacity?: number;
  align?: 'left' | 'center' | 'right';
  rotate?: number;
}

/** Placement and transform options for image layers. */
export interface AddImageLayerOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotate?: number;
  opacity?: number;
  blend?:
    | 'clear'
    | 'source'
    | 'over'
    | 'in'
    | 'out'
    | 'atop'
    | 'dest'
    | 'dest-over'
    | 'dest-in'
    | 'dest-out'
    | 'dest-atop'
    | 'xor'
    | 'add'
    | 'saturate'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'colour-dodge'
    | 'color-dodge'
    | 'colour-burn'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion';
}

/** Image layer on a canvas. */
export interface ImageLayer extends AddImageLayerOptions {
  kind: 'image';
  id: string;
  imagePath: string;
  zIndex: number;
}

/** Text layer on a canvas. */
export interface TextLayer {
  kind: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  zIndex: number;
  options: TextLayerOptions;
}

/** Any canvas layer type in draw stack order. */
export type CanvasLayer = ImageLayer | TextLayer;

interface CanvasState {
  id: string;
  width: number;
  height: number;
  background: string;
  layers: CanvasLayer[];
}

const canvases = new Map<string, CanvasState>();
let canvasCounter = 0;
let layerCounter = 0;

/** Creates the image editor client. */
export function createImageClient() {
  return {
    /** Returns image metadata for a local file. */
    getMetadata: (inputPath: string) => getMetadata(inputPath),

    /** Resizes an image and writes output to a new path. */
    resizeImage: (inputPath: string, outputPath: string, options: ResizeOptions) =>
      resizeImage(inputPath, outputPath, options),

    /** Crops an image rectangle and writes output to a new path. */
    cropImage: (inputPath: string, outputPath: string, options: CropOptions) =>
      cropImage(inputPath, outputPath, options),

    /** Rotates an image by degrees and writes output to a new path. */
    rotateImage: (inputPath: string, outputPath: string, degrees: number) =>
      rotateImage(inputPath, outputPath, degrees),

    /** Flips an image vertically and writes output to a new path. */
    flipImage: (inputPath: string, outputPath: string) => flipImage(inputPath, outputPath),

    /** Flops an image horizontally and writes output to a new path. */
    flopImage: (inputPath: string, outputPath: string) => flopImage(inputPath, outputPath),

    /** Converts image format and writes output to a new path. */
    convertImage: (inputPath: string, outputPath: string, options: ConvertOptions) =>
      convertImage(inputPath, outputPath, options),

    /** Applies basic enhancement (sharpen + normalize) and writes output. */
    enhanceImage: (inputPath: string, outputPath: string) => enhanceImage(inputPath, outputPath),

    /** Reads one pixel RGBA value from the image. */
    getPixel: (inputPath: string, x: number, y: number) => getPixel(inputPath, x, y),

    /** Reads multiple pixel RGBA values from the image. */
    samplePixels: (inputPath: string, points: Array<{ x: number; y: number }>) =>
      samplePixels(inputPath, points),

    /** Makes pixels near target color transparent. */
    makeColorTransparent: (inputPath: string, outputPath: string, options: ColorKeyOptions) =>
      makeColorTransparent(inputPath, outputPath, options),

    /** Removes background by color distance with optional feathering. */
    removeColorBackground: (inputPath: string, outputPath: string, options: ColorKeyOptions) =>
      removeColorBackground(inputPath, outputPath, options),

    /** Chroma key helper for green/blue screen style transparency. */
    chromaKey: (inputPath: string, outputPath: string, options: ChromaKeyOptions) =>
      chromaKey(inputPath, outputPath, options),

    /** Removes likely background by sampling edge colors and flood-filling inward. */
    autoKeyFromEdges: (inputPath: string, outputPath: string, options: AutoEdgeKeyOptions = {}) =>
      autoKeyFromEdges(inputPath, outputPath, options),

    /** Writes an edge-detection visualization image. */
    detectEdges: (inputPath: string, outputPath: string, options: EdgeDetectOptions = {}) =>
      detectEdges(inputPath, outputPath, options),

    /** Creates a new in-memory canvas and returns a canvas ID. */
    createCanvas: (width: number, height: number, background = '#00000000') =>
      createCanvas(width, height, background),

    /** Returns canvas info and current layer count. */
    getCanvas: (canvasId: string) => getCanvas(canvasId),

    /** Lists layers in draw order. */
    listLayers: (canvasId: string) => listLayers(canvasId),

    /** Adds an image layer to canvas. */
    addImageLayer: (canvasId: string, imagePath: string, options: AddImageLayerOptions) =>
      addImageLayer(canvasId, imagePath, options),

    /** Duplicates an existing layer and optionally moves it. */
    duplicateLayer: (canvasId: string, layerId: string, x?: number, y?: number) =>
      duplicateLayer(canvasId, layerId, x, y),

    /** Adds a text layer to canvas. */
    addTextLayer: (
      canvasId: string,
      text: string,
      x: number,
      y: number,
      options: TextLayerOptions = {},
    ) => addTextLayer(canvasId, text, x, y, options),

    /** Updates the content/options of a text layer. */
    updateTextLayer: (
      canvasId: string,
      layerId: string,
      text: string,
      options?: TextLayerOptions,
    ) => updateTextLayer(canvasId, layerId, text, options),

    /** Moves any layer to a new x/y position. */
    moveLayer: (canvasId: string, layerId: string, x: number, y: number) =>
      moveLayer(canvasId, layerId, x, y),

    /** Sets layer opacity (0..1). */
    setLayerOpacity: (canvasId: string, layerId: string, opacity: number) =>
      setLayerOpacity(canvasId, layerId, opacity),

    /** Sets the exact layer draw order using layer IDs. */
    setLayerOrder: (canvasId: string, orderedLayerIds: string[]) =>
      setLayerOrder(canvasId, orderedLayerIds),

    /** Removes a layer from the canvas. */
    deleteLayer: (canvasId: string, layerId: string) => deleteLayer(canvasId, layerId),

    /** Renders the canvas and writes it to output path. */
    exportCanvas: (canvasId: string, outputPath: string) => exportCanvas(canvasId, outputPath),

    /** Lists available system fonts for text layers. */
    listAvailableFonts: () => listAvailableFonts(),
  };
}

async function getMetadata(inputPath: string): Promise<ImageInfo> {
  const meta = await sharp(inputPath).metadata();
  return {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    space: meta.space,
    channels: meta.channels,
    depth: meta.depth,
    density: meta.density,
    hasAlpha: meta.hasAlpha,
  };
}

async function resizeImage(
  inputPath: string,
  outputPath: string,
  options: ResizeOptions,
): Promise<EditResult> {
  const image = sharp(inputPath).resize({
    width: options.width,
    height: options.height,
    fit: options.fit,
    withoutEnlargement: options.withoutEnlargement ?? true,
  });

  await image.toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function cropImage(
  inputPath: string,
  outputPath: string,
  options: CropOptions,
): Promise<EditResult> {
  await sharp(inputPath)
    .extract({
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
    })
    .toFile(outputPath);

  return readOutputInfo(outputPath);
}

async function rotateImage(
  inputPath: string,
  outputPath: string,
  degrees: number,
): Promise<EditResult> {
  await sharp(inputPath).rotate(degrees).toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function flipImage(inputPath: string, outputPath: string): Promise<EditResult> {
  await sharp(inputPath).flip().toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function flopImage(inputPath: string, outputPath: string): Promise<EditResult> {
  await sharp(inputPath).flop().toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function convertImage(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions,
): Promise<EditResult> {
  let image = sharp(inputPath);

  if (options.format === 'jpeg') {
    image = image.jpeg({ quality: options.quality ?? 85 });
  } else if (options.format === 'png') {
    image = image.png({ quality: options.quality ?? 90 });
  } else if (options.format === 'webp') {
    image = image.webp({ quality: options.quality ?? 85 });
  } else if (options.format === 'avif') {
    image = image.avif({ quality: options.quality ?? 50 });
  }

  await image.toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function enhanceImage(inputPath: string, outputPath: string): Promise<EditResult> {
  await sharp(inputPath).normalize().sharpen().toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function getPixel(inputPath: string, x: number, y: number): Promise<PixelColor> {
  const image = await readRawImage(inputPath);
  ensurePointInBounds(image.width, image.height, x, y);
  return readPixelFromRaw(image.data, image.width, image.channels, x, y);
}

async function samplePixels(
  inputPath: string,
  points: Array<{ x: number; y: number }>,
): Promise<PixelColor[]> {
  const image = await readRawImage(inputPath);
  return points.map((point) => {
    ensurePointInBounds(image.width, image.height, point.x, point.y);
    return readPixelFromRaw(image.data, image.width, image.channels, point.x, point.y);
  });
}

async function makeColorTransparent(
  inputPath: string,
  outputPath: string,
  options: ColorKeyOptions,
): Promise<EditResult> {
  return removeColorBackground(inputPath, outputPath, options);
}

async function removeColorBackground(
  inputPath: string,
  outputPath: string,
  options: ColorKeyOptions,
): Promise<EditResult> {
  const tolerance = Math.max(0, options.tolerance ?? 40);
  const feather = Math.max(0, options.feather ?? 25);
  const target = parseRgbColor(options.color);
  const maxDistance = Math.sqrt(255 * 255 * 3);

  const image = await readRawImage(inputPath);
  const data = image.data;
  const channels = image.channels;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    const distance = colorDistance(r, g, b, target[0], target[1], target[2]);

    if (distance <= tolerance) {
      data[i + 3] = 0;
      continue;
    }

    if (feather > 0 && distance <= tolerance + feather) {
      const keepRatio = (distance - tolerance) / feather;
      data[i + 3] = Math.round(alpha * keepRatio);
    } else if (distance > maxDistance) {
      data[i + 3] = alpha;
    }
  }

  await sharp(data, {
    raw: {
      width: image.width,
      height: image.height,
      channels,
    },
  }).toFile(outputPath);

  return readOutputInfo(outputPath);
}

async function chromaKey(
  inputPath: string,
  outputPath: string,
  options: ChromaKeyOptions,
): Promise<EditResult> {
  const similarity = Math.max(0, Math.min(255, options.similarity ?? 70));
  const blend = Math.max(0, options.blend ?? 40);

  return removeColorBackground(inputPath, outputPath, {
    color: options.keyColor,
    tolerance: similarity,
    feather: blend,
  });
}

async function autoKeyFromEdges(
  inputPath: string,
  outputPath: string,
  options: AutoEdgeKeyOptions,
): Promise<EditResult> {
  const tolerance = Math.max(0, options.tolerance ?? 45);
  const feather = Math.max(0, options.feather ?? 20);
  const sampleStep = Math.max(1, options.sampleStep ?? 12);

  const image = await readRawImage(inputPath);
  const { width, height, channels, data } = image;

  // Collect edge sample colors and reduce to a representative average.
  const edgeSamples: Array<[number, number, number]> = [];
  for (let x = 0; x < width; x += sampleStep) {
    edgeSamples.push(pixelRgb(data, width, channels, x, 0));
    edgeSamples.push(pixelRgb(data, width, channels, x, height - 1));
  }
  for (let y = 0; y < height; y += sampleStep) {
    edgeSamples.push(pixelRgb(data, width, channels, 0, y));
    edgeSamples.push(pixelRgb(data, width, channels, width - 1, y));
  }

  const target = averageRgb(edgeSamples);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Seed flood-fill queue from image boundary.
  for (let x = 0; x < width; x += 1) {
    queue.push(x, 0, x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    queue.push(0, y, width - 1, y);
  }

  const maxQueue = width * height * 2;
  let q = 0;
  while (q < queue.length && queue.length <= maxQueue) {
    const x = queue[q++] as number;
    const y = queue[q++] as number;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const [r, g, b] = pixelRgb(data, width, channels, x, y);
    const distance = colorDistance(r, g, b, target[0], target[1], target[2]);
    if (distance > tolerance + feather) continue;

    const pixelBase = idx * channels;
    const alpha = data[pixelBase + 3];
    if (distance <= tolerance) {
      data[pixelBase + 3] = 0;
    } else {
      const keepRatio = (distance - tolerance) / Math.max(feather, 1);
      data[pixelBase + 3] = Math.round(alpha * keepRatio);
    }

    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  await sharp(data, { raw: { width, height, channels } }).toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function detectEdges(
  inputPath: string,
  outputPath: string,
  options: EdgeDetectOptions,
): Promise<EditResult> {
  const threshold = Math.max(0, Math.min(255, options.threshold ?? 30));
  const invert = options.invert ?? false;

  const edgeKernel = [
    -1, -1, -1,
    -1, 8, -1,
    -1, -1, -1,
  ];

  let image = sharp(inputPath)
    .greyscale()
    .convolve({ width: 3, height: 3, kernel: edgeKernel })
    .threshold(threshold);

  if (invert) {
    image = image.negate();
  }

  await image.toFile(outputPath);
  return readOutputInfo(outputPath);
}

function createCanvas(width: number, height: number, background: string): CanvasInfo {
  if (width <= 0 || height <= 0) {
    throw new Error('Canvas width and height must be greater than 0.');
  }

  canvasCounter += 1;
  const id = `canvas_${canvasCounter}`;
  canvases.set(id, {
    id,
    width,
    height,
    background,
    layers: [],
  });

  return {
    canvasId: id,
    width,
    height,
    background,
    layerCount: 0,
  };
}

function getCanvas(canvasId: string): CanvasInfo {
  const canvas = requireCanvas(canvasId);
  return {
    canvasId: canvas.id,
    width: canvas.width,
    height: canvas.height,
    background: canvas.background,
    layerCount: canvas.layers.length,
  };
}

function listLayers(canvasId: string): CanvasLayer[] {
  const canvas = requireCanvas(canvasId);
  return [...canvas.layers].sort((a, b) => a.zIndex - b.zIndex);
}

function addImageLayer(
  canvasId: string,
  imagePath: string,
  options: AddImageLayerOptions,
): ImageLayer {
  const canvas = requireCanvas(canvasId);
  layerCounter += 1;

  const layer: ImageLayer = {
    kind: 'image',
    id: `layer_${layerCounter}`,
    imagePath,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    rotate: options.rotate,
    opacity: clampOpacity(options.opacity),
    blend: options.blend,
    zIndex: nextZIndex(canvas),
  };

  canvas.layers.push(layer);
  return layer;
}

function duplicateLayer(canvasId: string, layerId: string, x?: number, y?: number): CanvasLayer {
  const canvas = requireCanvas(canvasId);
  const layer = requireLayer(canvas, layerId);
  layerCounter += 1;

  if (layer.kind === 'image') {
    const duplicated: ImageLayer = {
      ...layer,
      id: `layer_${layerCounter}`,
      x: x ?? layer.x,
      y: y ?? layer.y,
      zIndex: nextZIndex(canvas),
    };
    canvas.layers.push(duplicated);
    return duplicated;
  }

  const duplicated: TextLayer = {
    ...layer,
    id: `layer_${layerCounter}`,
    x: x ?? layer.x,
    y: y ?? layer.y,
    zIndex: nextZIndex(canvas),
  };
  canvas.layers.push(duplicated);
  return duplicated;
}

function addTextLayer(
  canvasId: string,
  text: string,
  x: number,
  y: number,
  options: TextLayerOptions,
): TextLayer {
  const canvas = requireCanvas(canvasId);
  layerCounter += 1;

  const layer: TextLayer = {
    kind: 'text',
    id: `layer_${layerCounter}`,
    text,
    x,
    y,
    zIndex: nextZIndex(canvas),
    options: {
      fontFamily: options.fontFamily ?? 'Arial',
      fontSize: options.fontSize ?? 36,
      fontWeight: options.fontWeight ?? 'normal',
      color: options.color ?? '#ffffff',
      opacity: clampOpacity(options.opacity),
      align: options.align ?? 'left',
      rotate: options.rotate ?? 0,
    },
  };

  canvas.layers.push(layer);
  return layer;
}

function updateTextLayer(
  canvasId: string,
  layerId: string,
  text: string,
  options?: TextLayerOptions,
): TextLayer {
  const canvas = requireCanvas(canvasId);
  const layer = requireLayer(canvas, layerId);

  if (layer.kind !== 'text') {
    throw new Error(`Layer ${layerId} is not a text layer.`);
  }

  layer.text = text;
  if (options) {
    layer.options = {
      ...layer.options,
      ...options,
      opacity: clampOpacity(options.opacity ?? layer.options.opacity),
    };
  }

  return layer;
}

function moveLayer(canvasId: string, layerId: string, x: number, y: number): CanvasLayer {
  const canvas = requireCanvas(canvasId);
  const layer = requireLayer(canvas, layerId);

  layer.x = x;
  layer.y = y;
  return layer;
}

function setLayerOpacity(canvasId: string, layerId: string, opacity: number): CanvasLayer {
  const canvas = requireCanvas(canvasId);
  const layer = requireLayer(canvas, layerId);
  const value = clampOpacity(opacity);

  if (layer.kind === 'image') {
    layer.opacity = value;
  } else {
    layer.options.opacity = value;
  }

  return layer;
}

function setLayerOrder(canvasId: string, orderedLayerIds: string[]): CanvasLayer[] {
  const canvas = requireCanvas(canvasId);

  if (orderedLayerIds.length !== canvas.layers.length) {
    throw new Error('orderedLayerIds must include every layer exactly once.');
  }

  const idSet = new Set(orderedLayerIds);
  if (idSet.size !== canvas.layers.length) {
    throw new Error('orderedLayerIds contains duplicates.');
  }

  const byId = new Map(canvas.layers.map((layer) => [layer.id, layer]));
  canvas.layers = orderedLayerIds.map((id, idx) => {
    const layer = byId.get(id);
    if (!layer) throw new Error(`Layer not found in ordering: ${id}`);
    layer.zIndex = idx;
    return layer;
  });

  return listLayers(canvasId);
}

function deleteLayer(canvasId: string, layerId: string): void {
  const canvas = requireCanvas(canvasId);
  const index = canvas.layers.findIndex((layer) => layer.id === layerId);
  if (index === -1) throw new Error(`Layer not found: ${layerId}`);
  canvas.layers.splice(index, 1);
  reindexLayers(canvas);
}

async function exportCanvas(canvasId: string, outputPath: string): Promise<EditResult> {
  const canvas = requireCanvas(canvasId);

  let pipeline = sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: canvas.background,
    },
  });

  const composites: sharp.OverlayOptions[] = [];

  for (const layer of [...canvas.layers].sort((a, b) => a.zIndex - b.zIndex)) {
    if (layer.kind === 'image') {
      const imageBuffer = await buildImageLayerBuffer(layer);
      const composite: sharp.OverlayOptions = {
        input: imageBuffer,
        left: Math.round(layer.x),
        top: Math.round(layer.y),
      };
      if (layer.blend) composite.blend = layer.blend;
      if (layer.opacity !== undefined) composite.opacity = layer.opacity;
      composites.push(composite);
      continue;
    }

    const svg = renderTextSvg(layer, canvas.width, canvas.height);
    const composite: sharp.OverlayOptions = {
      input: Buffer.from(svg),
      left: 0,
      top: 0,
    };
    composites.push(composite);
  }

  if (composites.length) {
    pipeline = pipeline.composite(composites);
  }

  await pipeline.toFile(outputPath);
  return readOutputInfo(outputPath);
}

async function listAvailableFonts(): Promise<FontInfo[]> {
  const results = new Map<string, FontInfo>();

  const fcList = spawnSync('fc-list', [':', 'family'], {
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8',
  });

  if (fcList.status === 0 && fcList.stdout) {
    const lines = fcList.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      for (const family of line.split(',')) {
        const normalized = family.trim();
        if (!normalized) continue;
        if (!results.has(normalized)) {
          results.set(normalized, { family: normalized, source: 'fc-list' });
        }
      }
    }
  }

  const home = process.env.HOME ?? '';
  const fontDirs = [
    '/System/Library/Fonts',
    '/Library/Fonts',
    '/usr/share/fonts',
    '/usr/local/share/fonts',
    home ? `${home}/Library/Fonts` : '',
    home ? `${home}/.fonts` : '',
  ].filter(Boolean);

  for (const dir of fontDirs) {
    const families = await readFontFamiliesFromDir(dir);
    for (const family of families) {
      if (!results.has(family)) {
        results.set(family, { family, source: 'system-font-dir' });
      }
    }
  }

  return [...results.values()].sort((a, b) => a.family.localeCompare(b.family));
}

async function buildImageLayerBuffer(layer: ImageLayer): Promise<Buffer> {
  let image = sharp(layer.imagePath);

  if (layer.width || layer.height) {
    image = image.resize({
      width: layer.width,
      height: layer.height,
      fit: 'cover',
    });
  }

  if (layer.rotate) {
    image = image.rotate(layer.rotate);
  }

  return image.toBuffer();
}

function renderTextSvg(layer: TextLayer, width: number, height: number): string {
  const escapedText = escapeXml(layer.text);
  const x = layer.x;
  const y = layer.y;
  const anchor = layer.options.align === 'center' ? 'middle' : layer.options.align === 'right' ? 'end' : 'start';
  const rotate = layer.options.rotate ?? 0;

  return [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    '<style>',
    `text { font-family: ${escapeCss(layer.options.fontFamily ?? 'Arial')}; font-size: ${layer.options.fontSize ?? 36}px; font-weight: ${String(layer.options.fontWeight ?? 'normal')}; fill: ${escapeCss(layer.options.color ?? '#ffffff')}; opacity: ${layer.options.opacity ?? 1}; }`,
    '</style>',
    `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="hanging" transform="rotate(${rotate}, ${x}, ${y})">${escapedText}</text>`,
    '</svg>',
  ].join('');
}

function requireCanvas(canvasId: string): CanvasState {
  const canvas = canvases.get(canvasId);
  if (!canvas) throw new Error(`Canvas not found: ${canvasId}`);
  return canvas;
}

function requireLayer(canvas: CanvasState, layerId: string): CanvasLayer {
  const layer = canvas.layers.find((item) => item.id === layerId);
  if (!layer) throw new Error(`Layer not found: ${layerId}`);
  return layer;
}

function nextZIndex(canvas: CanvasState): number {
  if (!canvas.layers.length) return 0;
  return Math.max(...canvas.layers.map((layer) => layer.zIndex)) + 1;
}

function reindexLayers(canvas: CanvasState): void {
  canvas.layers = [...canvas.layers]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer, index) => ({ ...layer, zIndex: index }));
}

function clampOpacity(opacity: number | undefined): number | undefined {
  if (opacity === undefined) return undefined;
  return Math.max(0, Math.min(opacity, 1));
}

function pixelRgb(
  data: Uint8Array,
  width: number,
  channels: number,
  x: number,
  y: number,
): [number, number, number] {
  const i = (y * width + x) * channels;
  return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
}

function averageRgb(values: Array<[number, number, number]>): [number, number, number] {
  if (!values.length) return [0, 0, 0];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const value of values) {
    r += value[0];
    g += value[1];
    b += value[2];
  }
  return [Math.round(r / values.length), Math.round(g / values.length), Math.round(b / values.length)];
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function parseRgbColor(color: string | [number, number, number]): [number, number, number] {
  if (Array.isArray(color)) {
    return [clampByte(color[0]), clampByte(color[1]), clampByte(color[2])];
  }

  const value = color.trim().toLowerCase();
  const hex = value.startsWith('#') ? value.slice(1) : value;

  if (hex.length === 3) {
    return [
      clampByte(parseInt(hex[0] + hex[0], 16)),
      clampByte(parseInt(hex[1] + hex[1], 16)),
      clampByte(parseInt(hex[2] + hex[2], 16)),
    ];
  }

  if (hex.length === 6) {
    return [
      clampByte(parseInt(hex.slice(0, 2), 16)),
      clampByte(parseInt(hex.slice(2, 4), 16)),
      clampByte(parseInt(hex.slice(4, 6), 16)),
    ];
  }

  throw new Error(`Invalid color format: ${color}. Use #RRGGBB, #RGB, or [r,g,b].`);
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function ensurePointInBounds(width: number, height: number, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    throw new Error(`Point (${x}, ${y}) is outside image bounds ${width}x${height}.`);
  }
}

function readPixelFromRaw(
  data: Uint8Array,
  width: number,
  channels: number,
  x: number,
  y: number,
): PixelColor {
  const idx = (y * width + x) * channels;
  return {
    r: data[idx] ?? 0,
    g: data[idx + 1] ?? 0,
    b: data[idx + 2] ?? 0,
    a: channels >= 4 ? (data[idx + 3] ?? 255) : 255,
    x,
    y,
  };
}

async function readRawImage(inputPath: string): Promise<{
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
}> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCss(value: string): string {
  return value.replace(/"/g, '\\"');
}

async function readFontFamiliesFromDir(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const families: string[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const family = entry.name.replace(/\.(ttf|otf|ttc|woff|woff2)$/i, '');
      if (!family) continue;
      families.push(family);
    }

    return families;
  } catch {
    return [];
  }
}

async function readOutputInfo(outputPath: string): Promise<EditResult> {
  const meta = await sharp(outputPath).metadata();
  const stat = await Bun.file(outputPath).stat();

  return {
    outputPath,
    width: meta.width,
    height: meta.height,
    sizeBytes: stat.size,
    format: meta.format,
  };
}

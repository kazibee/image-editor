import sharp from 'sharp';

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

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ConvertOptions {
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
}

export interface EditResult {
  outputPath: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  format?: string;
}

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

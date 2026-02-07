# @kazibee/image-editor

Local image editing tool for kazibee. Resize/crop/convert images and build layered canvas compositions with image + text.

## Install

```bash
kazibee install image-editor github:kazibee/image-editor
```

Install globally with `-g`:

```bash
kazibee install -g image-editor github:kazibee/image-editor
```

## API

- `getMetadata(inputPath)`
- `getPixel(inputPath, x, y)`
- `samplePixels(inputPath, points)`
- `resizeImage(inputPath, outputPath, options)`
- `cropImage(inputPath, outputPath, options)`
- `rotateImage(inputPath, outputPath, degrees)`
- `flipImage(inputPath, outputPath)`
- `flopImage(inputPath, outputPath)`
- `convertImage(inputPath, outputPath, options)`
- `enhanceImage(inputPath, outputPath)`
- `makeColorTransparent(inputPath, outputPath, options)`
- `removeColorBackground(inputPath, outputPath, options)`
- `chromaKey(inputPath, outputPath, options)`
- `autoKeyFromEdges(inputPath, outputPath, options?)`
- `detectEdges(inputPath, outputPath, options?)`
- `listAvailableFonts()`
- `createCanvas(width, height, background?)`
- `getCanvas(canvasId)`
- `listLayers(canvasId)`
- `addImageLayer(canvasId, imagePath, options)`
- `duplicateLayer(canvasId, layerId, x?, y?)`
- `addTextLayer(canvasId, text, x, y, options?)`
- `updateTextLayer(canvasId, layerId, text, options?)`
- `moveLayer(canvasId, layerId, x, y)`
- `setLayerOpacity(canvasId, layerId, opacity)`
- `setLayerOrder(canvasId, orderedLayerIds)`
- `deleteLayer(canvasId, layerId)`
- `exportCanvas(canvasId, outputPath)`

## Usage

```javascript
const info = await tools["image-editor"].getMetadata("/tmp/input.jpg");

await tools["image-editor"].resizeImage("/tmp/input.jpg", "/tmp/resized.jpg", {
  width: 1200,
  fit: "inside"
});

await tools["image-editor"].cropImage("/tmp/input.jpg", "/tmp/cropped.jpg", {
  left: 100,
  top: 80,
  width: 800,
  height: 600
});

await tools["image-editor"].convertImage("/tmp/input.jpg", "/tmp/output.webp", {
  format: "webp",
  quality: 80
});

await tools["image-editor"].chromaKey(
  "/tmp/greenscreen.png",
  "/tmp/subject-cutout.png",
  { keyColor: "#00ff00", similarity: 72, blend: 28 }
);

await tools["image-editor"].autoKeyFromEdges(
  "/tmp/product-shot.jpg",
  "/tmp/product-shot-transparent.png",
  { tolerance: 42, feather: 22, sampleStep: 10 }
);

const fonts = await tools["image-editor"].listAvailableFonts();
const canvas = await tools["image-editor"].createCanvas(1400, 900, "#111111");

const bg = await tools["image-editor"].addImageLayer(canvas.canvasId, "/tmp/input.jpg", {
  x: 0, y: 0, width: 1400, height: 900
});

await tools["image-editor"].duplicateLayer(canvas.canvasId, bg.id, 50, 50);
await tools["image-editor"].addTextLayer(canvas.canvasId, "Summer Campaign", 80, 60, {
  fontFamily: fonts[0]?.family ?? "Arial",
  fontSize: 64,
  color: "#ffffff",
  fontWeight: "bold"
});

await tools["image-editor"].exportCanvas(canvas.canvasId, "/tmp/composite.png");
```

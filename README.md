# @kazibee/image-editor

Local image editing tool for kazibee. Resize, crop, rotate, flip, convert format, and inspect metadata.

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
- `resizeImage(inputPath, outputPath, options)`
- `cropImage(inputPath, outputPath, options)`
- `rotateImage(inputPath, outputPath, degrees)`
- `flipImage(inputPath, outputPath)`
- `flopImage(inputPath, outputPath)`
- `convertImage(inputPath, outputPath, options)`
- `enhanceImage(inputPath, outputPath)`

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
```

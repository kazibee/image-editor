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
	fit?: "cover" | "contain" | "fill" | "inside" | "outside";
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
	format: "jpeg" | "png" | "webp" | "avif";
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
	source: "fc-list" | "system-font-dir";
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
	color: string | [
		number,
		number,
		number
	];
	tolerance?: number;
	feather?: number;
}
/** Chroma key parameters for green/blue screen style removal. */
export interface ChromaKeyOptions {
	keyColor: string | [
		number,
		number,
		number
	];
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
	fontWeight?: "normal" | "bold" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
	color?: string;
	opacity?: number;
	align?: "left" | "center" | "right";
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
	blend?: "clear" | "source" | "over" | "in" | "out" | "atop" | "dest" | "dest-over" | "dest-in" | "dest-out" | "dest-atop" | "xor" | "add" | "saturate" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "colour-dodge" | "color-dodge" | "colour-burn" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
}
/** Image layer on a canvas. */
export interface ImageLayer extends AddImageLayerOptions {
	kind: "image";
	id: string;
	imagePath: string;
	zIndex: number;
}
/** Text layer on a canvas. */
export interface TextLayer {
	kind: "text";
	id: string;
	text: string;
	x: number;
	y: number;
	zIndex: number;
	options: TextLayerOptions;
}
/** Any canvas layer type in draw stack order. */
export type CanvasLayer = ImageLayer | TextLayer;
declare function main(): {
	getMetadata: (inputPath: string) => Promise<ImageInfo>;
	resizeImage: (inputPath: string, outputPath: string, options: ResizeOptions) => Promise<EditResult>;
	cropImage: (inputPath: string, outputPath: string, options: CropOptions) => Promise<EditResult>;
	rotateImage: (inputPath: string, outputPath: string, degrees: number) => Promise<EditResult>;
	flipImage: (inputPath: string, outputPath: string) => Promise<EditResult>;
	flopImage: (inputPath: string, outputPath: string) => Promise<EditResult>;
	convertImage: (inputPath: string, outputPath: string, options: ConvertOptions) => Promise<EditResult>;
	enhanceImage: (inputPath: string, outputPath: string) => Promise<EditResult>;
	getPixel: (inputPath: string, x: number, y: number) => Promise<PixelColor>;
	samplePixels: (inputPath: string, points: Array<{
		x: number;
		y: number;
	}>) => Promise<PixelColor[]>;
	makeColorTransparent: (inputPath: string, outputPath: string, options: ColorKeyOptions) => Promise<EditResult>;
	removeColorBackground: (inputPath: string, outputPath: string, options: ColorKeyOptions) => Promise<EditResult>;
	chromaKey: (inputPath: string, outputPath: string, options: ChromaKeyOptions) => Promise<EditResult>;
	autoKeyFromEdges: (inputPath: string, outputPath: string, options?: AutoEdgeKeyOptions) => Promise<EditResult>;
	detectEdges: (inputPath: string, outputPath: string, options?: EdgeDetectOptions) => Promise<EditResult>;
	createCanvas: (width: number, height: number, background?: string) => Promise<CanvasInfo>;
	getCanvas: (canvasId: string) => Promise<CanvasInfo>;
	listLayers: (canvasId: string) => Promise<CanvasLayer[]>;
	addImageLayer: (canvasId: string, imagePath: string, options: AddImageLayerOptions) => Promise<ImageLayer>;
	duplicateLayer: (canvasId: string, layerId: string, x?: number, y?: number) => Promise<CanvasLayer>;
	addTextLayer: (canvasId: string, text: string, x: number, y: number, options?: TextLayerOptions) => Promise<TextLayer>;
	updateTextLayer: (canvasId: string, layerId: string, text: string, options?: TextLayerOptions) => Promise<TextLayer>;
	moveLayer: (canvasId: string, layerId: string, x: number, y: number) => Promise<CanvasLayer>;
	setLayerOpacity: (canvasId: string, layerId: string, opacity: number) => Promise<CanvasLayer>;
	setLayerOrder: (canvasId: string, orderedLayerIds: string[]) => Promise<CanvasLayer[]>;
	deleteLayer: (canvasId: string, layerId: string) => Promise<void>;
	exportCanvas: (canvasId: string, outputPath: string) => Promise<EditResult>;
	listAvailableFonts: () => Promise<FontInfo[]>;
};

export {
	main as default,
};

export {};

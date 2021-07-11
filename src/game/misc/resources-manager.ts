import { EntityColor, getColorPalette } from './colors-palette'
import paintTextureAndGetDataUrl from './texture-painter'

export type TextureType = 'unit' | 'tileset' | 'building' | 'icons'


const loadImgAsync = (src: string): Promise<HTMLImageElement> => {
	const img = document.createElement('img')
	return new Promise((resolve, reject) => {
		img.onerror = () => reject(`Failed to load texture from ${src.substr(0, 100)}`)
		img.onload = () => resolve(img)
		img.crossOrigin = 'anonymous'
		img.src = src
	})
}

const doUnitFlip = async (img: HTMLImageElement, spriteSize: number): Promise<HTMLCanvasElement> => {
	const canvas = document.createElement('canvas')
	canvas.width = 8 * spriteSize
	canvas.height = img.height

	const context = canvas.getContext('2d')!
	context.scale(-1, 1)
	context.drawImage(img, spriteSize, 0, 4 * spriteSize, img.height, -spriteSize * 3, 0, 4 * spriteSize, img.height)
	context.scale(-1, 1)
	context.drawImage(img, spriteSize * 3, 0)

	return canvas
}

const doRepaints = async (img: HTMLImageElement | HTMLCanvasElement): Promise<HTMLImageElement[]> => {
	const redPalette = getColorPalette(EntityColor.Red)
	return await Promise.all(new Array(8)
		.map((_, i) => loadImgAsync(
			paintTextureAndGetDataUrl(img, redPalette, getColorPalette(i)))))
}

interface ResourceEntry {
	readonly id: string
	readonly fileName: string
	readonly spriteSize: number
	readonly type: TextureType
	readonly defaultImage: CanvasImageSource
	readonly paintedImages: CanvasImageSource[]
}

export class ResourcesManager {
	private readonly assetsById = new Map<string, ResourceEntry>()

	public getDefaultImage(id: string): CanvasImageSource {
		return this.getEntry(id).defaultImage
	}

	public getColorImage(id: string, color: EntityColor): CanvasImageSource {
		const image = this.getEntry(id).paintedImages[color]
		if (image === undefined)
			throw new Error(`Requested color ${color} of resource ${id}, but not found one`)
		return image
	}

	public getEntry(id: string): ResourceEntry {
		const entry = this.assetsById.get(id)
		if (entry == null)
			throw new Error(`Resource with id ${id} isn't loaded`)
		return entry
	}

	public async addAsset(id: string, fileName: string, spriteSize: number | undefined, type: TextureType): Promise<ResourceEntry> {
		if (this.assetsById.has(id))
			throw new Error(`Asset with id ${id} already exists`)

		if (spriteSize === undefined
			? (type !== 'tileset' && type !== 'icons')
			: (spriteSize <= 0 || spriteSize !== (spriteSize | 0)))
			throw new Error(`Invalid sprite size ${spriteSize}`)

		const entry = await this.internalCreateResource(id, fileName, spriteSize ?? 0, type)

		if (this.assetsById.has(id))
			throw new Error(`Asset with id ${id} already exists`)
		this.assetsById.set(id, entry)

		return entry
	}

	private async internalCreateResource(id: string, fileName: string, spriteSize: number, type: TextureType): Promise<ResourceEntry> {
		const needsAdditionalFlip = type === 'unit'
		const needsRepaint = type === 'icons' || type === 'unit' || type === 'building'


		let img: HTMLImageElement | HTMLCanvasElement = await loadImgAsync(`/res/${fileName}.png`)

		if (needsAdditionalFlip)
			img = await doUnitFlip(img, spriteSize)

		const repaintedImages = needsRepaint ? await doRepaints(img) : new Array(8).map(() => img)

		return {
			defaultImage: img,
			paintedImages: repaintedImages,
			type,
			spriteSize,
			id,
			fileName,
		} as ResourceEntry
	}
}

export type TextureType = 'unit' | 'tileset' | 'building' | 'icons'

export interface ResourceEntry {
	readonly id: string
	readonly fileName: string
	readonly spriteSize: number
	readonly type: TextureType
	readonly image: CanvasImageSource
}

export class ResourcesManager {
	private readonly assetsById = new Map<string, ResourceEntry>()

	private static createEntry(id: string,
	                           fileName: string,
	                           spriteSize: number,
	                           type: TextureType): ResourceEntry {
		let image: CanvasImageSource
		switch (type) {
			case 'unit':
				image = document.createElement('canvas')
				break
			case 'building':
			case 'icons':
			case 'tileset':
				image = document.createElement('img')
				break
			default:
				throw new Error(`Invalid resource type ${type}`)
		}
		return {
			id, fileName, type,
			spriteSize,
			image: image,
		}
	}

	public getImage(id: string): CanvasImageSource {
		return this.getEntry(id).image
	}

	public getEntry(id: string): ResourceEntry {
		const entry = this.assetsById.get(id)
		if (entry == null)
			throw new Error(`Resource with id ${id} not found`)
		return entry
	}

	public addAsset(id: string, fileName: string, spriteSize: number | undefined, type: TextureType): Promise<ResourceEntry> {
		if (this.assetsById.has(id))
			throw new Error(`Asset with id ${id} already exists`)
		if (spriteSize === undefined
			? (type !== 'tileset' && type !== 'icons')
			: (spriteSize <= 0 || spriteSize !== (spriteSize | 0)))
			throw new Error(`Invalid sprite size ${spriteSize}`)

		const entry = ResourcesManager.createEntry(id, fileName, spriteSize ?? 0, type)
		this.assetsById.set(id, entry)
		return this.loadResource(entry)
	}

	private loadResource(entry: ResourceEntry): Promise<ResourceEntry> {
		return new Promise((resolve, reject) => {

			switch (entry.type) {
				case 'unit': {
					const canvas = (entry.image as HTMLCanvasElement)
					const img = document.createElement('img')
					img.onload = () => {
						const size = entry.spriteSize
						canvas.width = 8 * size
						canvas.height = img.height
						const context = canvas.getContext('2d')!
						context.scale(-1, 1)
						context.drawImage(img, size, 0, 4 * size, img.height, -size * 3, 0, 4 * size, img.height)
						context.scale(-1, 1)
						context.drawImage(img, size * 3, 0)
						resolve(entry)
					}
					img.onerror = () => reject(`Failed to load texture ${entry.id} ${entry.fileName}`)
					img.crossOrigin = 'anonymous'
					img.src = `/res/${entry.fileName}.png`
					break
				}
				case 'icons':
				case 'building':
				case 'tileset': {
					const img = (entry.image as HTMLImageElement)
					img.onload = () => resolve(entry)
					img.onerror = () => reject(`Failed to load texture ${entry.id} ${entry.fileName}`)
					img.crossOrigin = 'anonymous'
					img.src = `/res/${entry.fileName}.png`
					break
				}
				default:
					reject(`Unknown resource type ${entry.type}`)
			}
		})
	}
}

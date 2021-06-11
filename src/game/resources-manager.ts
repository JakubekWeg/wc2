export const registry: CanvasImageSource[] = []
export type TextureType = 'unit' | 'tileset'
const newEntry = (name: string, type: TextureType) => {
	switch (type) {
		case 'unit':{
			const canvas = document.createElement('canvas')
			canvas.width = 8 * 72
			const img = document.createElement('img')
			img.src = `/res/${name}.png`
			img.onload = () => {
				canvas.height = img.height
				const context = canvas.getContext('2d')!
				context.scale(-1, 1)
				context.drawImage(img, 72, 0, 4 * 72, img.height, -72 * 3, 0, 4 * 72, img.height)
				context.scale(-1, 1)
				context.drawImage(img, 72 * 3, 0)
			}
			registry.push(canvas)
		}
		break
		case 'tileset':
			const img = document.createElement('img')
			img.src = `/res/${name}.png`
			registry.push(img)
			break
		default:
			throw new Error(`Invalid texture type ${type}`)
	}
}

newEntry('elven_archer', 'unit')
newEntry('winter', 'tileset')
newEntry('pig_farm', 'tileset')
newEntry('troll_axethrower', 'unit')


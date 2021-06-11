export const registry: CanvasImageSource[] = []
export type TextureType = 'unit' | 'tileset' | 'arrow'
const newEntry = (name: string, type: TextureType) => {
	switch (type) {
		case 'arrow':
		case 'unit':{
			const canvas = document.createElement('canvas')
			const size = (type === 'arrow' ? 40 : 72)
			canvas.width = 8 * size
			const img = document.createElement('img')
			img.src = `/res/${name}.png`
			img.onload = () => {
				canvas.height = img.height
				const context = canvas.getContext('2d')!
				context.scale(-1, 1)
				context.drawImage(img, size, 0, 4 * size, img.height, -size * 3, 0, 4 * size, img.height)
				context.scale(-1, 1)
				context.drawImage(img, size * 3, 0)
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
newEntry('guard_tower', 'tileset')
newEntry('arrow', 'arrow')


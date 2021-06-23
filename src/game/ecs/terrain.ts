// enum Variant {
// 	CornerRB = 0,
// 	CornerLB = 2,
// 	BorderB = 4,
// 	CornerRT = 7,
// 	BorderR = 9,
// 	BetweenTB = 12,
// 	CornerLT = 15,
// 	BetweenBT = 17,
// 	BorderL = 20,
// 	BorderL = 20,
// }

import { registry } from '../misc/resources-manager'
import { CHUNK_REAL_PX_SIZE, CHUNK_TILE_SIZE } from './chunk-indexer'

export enum Variant {
	Grass,
	DarkGrass,
	Dirt,
	DarkDirt,
	Water,
	DarkWater,
}


interface Tile {
	readonly x: number,
	readonly y: number,

	variant: Variant
	spriteIndex: number
}


const GRASS_VARIANT_START_INDEX = 238

class TileSystem {
	private readonly points: Variant[] = []
	private readonly pointsSize = this.tilesSize + 1

	constructor(public readonly tilesSize: number) {
		const pointsSize = this.pointsSize
		this.points.length = pointsSize * pointsSize
		for (let i = 0; i < pointsSize; i++) {
			for (let j = 0; j < pointsSize; j++) {
				// let index = GRASS_VARIANT_START_INDEX + 8 * 16 - 10
				// if (Math.random() < 0.5)
				// 	index++
				this.points[i * pointsSize + j] = Variant.Grass
			}
		}
	}

	public getPoint(x: number, y: number): Variant {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		return this.points[y * this.pointsSize + x]
	}

	public setPoint(x: number, y: number, v: Variant): void {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		this.points[y * this.pointsSize + x] = v
	}

	public getPointDefault(x: number, y: number, def: Variant): Variant {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			return def
		return this.points[y * this.pointsSize + x]
	}

	public getSpriteIndex(x: number, y: number): number {
		if (x < 0 || x >= this.tilesSize || y < 0 || y >= this.tilesSize)
			throw new Error(`Invalid tile index x=${x} y=${y}`)

		// if (x === 0 || y === 0 || x === this.tilesSize - 1 || y === this.tilesSize - 1)
		// 	return GRASS_VARIANT_START_INDEX

		const lt = this.getPoint(x, y)
		const rt = this.getPointDefault(x + 1, y, lt)
		const rb = this.getPointDefault(x + 1, y + 1, lt)
		const lb = this.getPointDefault(x, y + 1, lt)

		let output = GRASS_VARIANT_START_INDEX + 32

		const key = (((lt * 10) + rt) * 10 + rb) * 10 + lb
		// console.log(key)
		switch (key) {
			case 0: // full grass
				output = 356
				break
			case 2222: // full dirt
				output = 334
				break
			case 2202:
				output += 14 // or 15
				break
			case 2220:
				output += 22
				break
			case 2022:
				output += 26 // or 27
				break
			case 2000:
				output += 0 // or 1
				break
			case 200:
				output += 3 // or 4
				break
			case 222:
				output += 28 // or 29
				break
			case 20:
				output += 15 // or 16
				break
			case 2:
				output += 7 // or 8
				break
			case 2200:
				output += 4 //or 5 or 6
				break
			case 2002:
				output += 9 //or 10 or 11
				break
			case 220:
				output += 19 //or 20 or 21
				break
			case 22:
				output += 23 //or 24 or 25
				break
			case 2020:
				output += 17 //or 18
				break
			case 202:
				output += 12 //or 13
				break
			default:
				console.warn('DEFAULT CASE')
				return output - 1
		}

		// return 334

		return output
	}
}

const size = 128
const table = new TileSystem(size)
for (let i = 0; i < size + 1; i++) {
	for (let j = 0; j < size + 1; j++) {
		if (Math.random() < 0.4)
			table.setPoint(i, j, Variant.Dirt)
	}
}

export const setVariant = (x: number, y: number, v: Variant) => {
	table.setPoint(x, y, v)
}

export const getLayerCallback = (ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number) => {
	const TILE_SET_WIDTH = 512 / 32
	const image = registry[1]

	for (let x = 0; x < CHUNK_TILE_SIZE; x++) {
		for (let y = 0; y < CHUNK_TILE_SIZE; y++) {
			const index = table.getSpriteIndex(chunkX * CHUNK_TILE_SIZE + x, chunkY * CHUNK_TILE_SIZE + y)
			const sx = index % TILE_SET_WIDTH
			const sy = index / TILE_SET_WIDTH | 0
			ctx.drawImage(image,
				sx * 32, sy * 32,
				32, 32,
				(chunkX * CHUNK_REAL_PX_SIZE) + x * 32, (chunkY * CHUNK_REAL_PX_SIZE) + y * 32,
				32, 32)
		}
	}
}

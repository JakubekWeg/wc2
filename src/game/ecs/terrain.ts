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

import { DataPack } from '../data-pack'
import GameSettings from '../misc/game-settings'
import { CHUNK_REAL_PX_SIZE, CHUNK_TILE_SIZE } from './chunk-indexer'
import { Layer, LayerLevel } from './layers'

export enum Variant {
	Grass = 0,
	DarkGrass = 1,
	Dirt = 2,
	DarkDirt = 3,
	Water = 4,
	DarkWater = 5,
}

export const TILE_SET_WIDTH = 512 / 32

// noinspection SuspiciousTypeOfGuard
export const allVariants: Variant[] = Array.from(Object.values(Variant)).filter(it => typeof it === 'number') as Variant[]

type RandomIndexProducer = () => number
const makeRandomProducer = (start: number): (count: number) => RandomIndexProducer => {
	let current = start
	return (count: number) => {
		let myCurrent = current
		current += count
		// return () => myCurrent + Math.random() * count | 0
		return () => myCurrent
	}
}

const textureIndexes = new Map<number, RandomIndexProducer>()

const initTextureIndexes = () => {
	textureIndexes.clear()

	textureIndexes.set(0, makeRandomProducer(356)(2))
	// light dirt
	{
		textureIndexes.set(2222, makeRandomProducer(334)(2))

		const tmp = makeRandomProducer(270)
		textureIndexes.set(2000, tmp(2))
		textureIndexes.set(200, tmp(2))
		textureIndexes.set(2200, tmp(3))
		textureIndexes.set(2, tmp(2))

		textureIndexes.set(2002, tmp(3))
		textureIndexes.set(202, tmp(2))
		textureIndexes.set(2202, tmp(1))
		textureIndexes.set(20, tmp(2))

		textureIndexes.set(2020, tmp(2))
		textureIndexes.set(220, tmp(3))
		textureIndexes.set(2220, tmp(1))
		textureIndexes.set(22, tmp(3))

		textureIndexes.set(2022, tmp(2))
		textureIndexes.set(222, tmp(2))
	}
	// dark grass
	{
		textureIndexes.set(1111, makeRandomProducer(364)(2))

		const tmp = makeRandomProducer(238)
		textureIndexes.set(1000, tmp(2))
		textureIndexes.set(100, tmp(2))
		textureIndexes.set(1100, tmp(3))
		textureIndexes.set(1, tmp(2))

		textureIndexes.set(1001, tmp(3))
		textureIndexes.set(101, tmp(2))
		textureIndexes.set(1101, tmp(2))
		textureIndexes.set(10, tmp(2))

		textureIndexes.set(1010, tmp(2))
		textureIndexes.set(110, tmp(3))
		textureIndexes.set(1110, tmp(2))
		textureIndexes.set(11, tmp(3))

		textureIndexes.set(1011, tmp(2))
		textureIndexes.set(111, tmp(2))
	}
	// dark dirt
	{
		textureIndexes.set(3333, makeRandomProducer(345)(3))

		const tmp = makeRandomProducer(180)
		textureIndexes.set(3222, tmp(1))
		textureIndexes.set(2322, tmp(2))
		textureIndexes.set(3322, tmp(3))
		textureIndexes.set(2223, tmp(1))
		tmp(1) // ignore this empty

		textureIndexes.set(3223, tmp(3))
		textureIndexes.set(2323, tmp(2))
		textureIndexes.set(3323, tmp(1))
		textureIndexes.set(2232, tmp(1))

		textureIndexes.set(3232, tmp(2))
		textureIndexes.set(2332, tmp(3))
		textureIndexes.set(3332, tmp(1))
		textureIndexes.set(2233, tmp(3))

		textureIndexes.set(3233, tmp(1))
		textureIndexes.set(2333, tmp(1))
	}
	// light water
	{
		textureIndexes.set(4444, makeRandomProducer(328)(3))

		const tmp = makeRandomProducer(206)
		textureIndexes.set(4222, tmp(2))
		textureIndexes.set(2422, tmp(2))
		textureIndexes.set(4422, tmp(3))
		textureIndexes.set(2224, tmp(2))

		textureIndexes.set(4224, tmp(3))
		textureIndexes.set(2424, tmp(1))
		textureIndexes.set(4424, tmp(2))
		textureIndexes.set(2242, tmp(2))

		textureIndexes.set(4242, tmp(1))
		textureIndexes.set(2442, tmp(3))
		textureIndexes.set(4442, tmp(2))
		textureIndexes.set(2244, tmp(3))

		textureIndexes.set(4244, tmp(2))
		textureIndexes.set(2444, tmp(2))
	}
	// dark water
	{
		textureIndexes.set(5555, makeRandomProducer(331)(3))

		const tmp = makeRandomProducer(300)
		textureIndexes.set(5444, tmp(2))
		textureIndexes.set(4544, tmp(2))
		textureIndexes.set(5544, tmp(3))
		textureIndexes.set(4445, tmp(2))

		textureIndexes.set(5445, tmp(3))
		textureIndexes.set(4545, tmp(2))
		textureIndexes.set(5545, tmp(1))
		textureIndexes.set(4454, tmp(2))

		textureIndexes.set(5454, tmp(2))
		textureIndexes.set(4554, tmp(3))
		textureIndexes.set(5554, tmp(1))
		textureIndexes.set(4455, tmp(3))

		textureIndexes.set(5455, tmp(1))
		textureIndexes.set(4555, tmp(1))
	}
}
initTextureIndexes()

export const getFullTextureOfVariant = (v: Variant): RandomIndexProducer => {
	const textureProducer = textureIndexes.get(((v * 10 + v) * 10 + v) * 10 + v)
	if (textureProducer === undefined)
		throw new Error(`Unknown variant ${v}`)
	return textureProducer
}

export class TerrainSystem {
	private readonly points: Variant[] = []
	private readonly pointsSize = this.tilesSize + 1
	private readonly image = this.pack.resources.getImage('summer')

	private constructor(public readonly tilesSize: number,
	                    private pack: DataPack) {
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

	public static createNew(settings: GameSettings,
	                        pack: DataPack) {
		return new TerrainSystem(settings.mapWidth, pack)
	}

	public getPoint(x: number, y: number): Variant {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		return this.points[y * this.pointsSize + x]
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

		const key = (((lt * 10) + rt) * 10 + rb) * 10 + lb

		const index = textureIndexes.get(key)
		if (index === undefined) {
			console.error('Tile index not found!')
			return 16
		}

		return index()
	}

	setVariantForPoint(pX: number, pY: number, v: Variant) {


		const check = (x: number, y: number) => {
			const other = this.getPointDefault(x, y, v)
			if (other === v) return
			let between: Variant = v
			switch (v) {
				case Variant.DarkGrass:
					switch (other) {
						case Variant.Dirt:
						case Variant.DarkDirt:
						case Variant.Water:
						case Variant.DarkWater:
							between = Variant.Grass
							break
						default:
							return
					}
					break
				case Variant.Grass:
					switch (other) {
						case Variant.DarkDirt:
						case Variant.Water:
						case Variant.DarkWater:
							between = Variant.Dirt
							break
						default:
							return
					}
					break
				case Variant.Dirt:
					switch (other) {
						case Variant.DarkGrass:
							between = Variant.Grass
							break
						case Variant.DarkWater:
							between = Variant.Water
							break
						default:
							return
					}
					break
				case Variant.DarkDirt:
					switch (other) {
						case Variant.DarkGrass:
						case Variant.Grass:
						case Variant.Water:
						case Variant.DarkWater:
							between = Variant.Dirt
							break
						default:
							return
					}
					break
				case Variant.Water:
					switch (other) {
						case Variant.DarkGrass:
						case Variant.Grass:
						case Variant.DarkDirt:
							between = Variant.Dirt
							break
						default:
							return
					}
					break
				case Variant.DarkWater:
					switch (other) {
						case Variant.DarkGrass:
						case Variant.Grass:
						case Variant.Dirt:
						case Variant.DarkDirt:
							between = Variant.Water
							break
						default:
							return
					}
					break
			}

			if (between !== v) {
				this.setVariantForPoint(x, y, between)
			}

			// const lvl2 = getLevelOfVariant(this.getPointDefault(x, y, v))
			// const abs = Math.abs(lvl2 - lvl)
			// if (abs > 1) {
			// 	this.setVariantForPoint(x, y, getVariantBetweenLevel(lvl > lvl2 ? lvl - 1 : lvl + 1))
			// }
		}
		check(pX - 1, pY - 1)
		check(pX + 1, pY - 1)
		check(pX + 1, pY + 1)
		check(pX - 1, pY + 1)
		check(pX - 1, pY)
		check(pX, pY - 1)
		check(pX + 1, pY)
		check(pX, pY + 1)

		this.setPoint(pX, pY, v)
		// this.setPoint(tileX + 1, tileY, v)
		// this.setPoint(tileX + 1, tileY + 1, v)
		// this.setPoint(tileX, tileY + 1, v)

		this.layerTerrain.markChunkDirty(pX - 2, pY - 2)
		this.layerTerrain.markChunkDirty(pX - 2, pY + 2)
		this.layerTerrain.markChunkDirty(pX + 2, pY + 2)
		this.layerTerrain.markChunkDirty(pX + 2, pY - 2)
	}

	isValidTile(x: number, y: number): boolean {
		return !(x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
	}

	setVariantForTile(tileX: number, tileY: number, v: Variant) {
		this.setVariantForPoint(tileX, tileY, v)
		this.setVariantForPoint(tileX, tileY + 1, v)
		this.setVariantForPoint(tileX + 1, tileY, v)
		this.setVariantForPoint(tileX + 1, tileY + 1, v)
	}

	public readonly layerDrawCallback = (ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number) => {
		const image = this.image

		for (let x = 0; x < CHUNK_TILE_SIZE; x++) {
			for (let y = 0; y < CHUNK_TILE_SIZE; y++) {
				const index = this.getSpriteIndex(chunkX * CHUNK_TILE_SIZE + x, chunkY * CHUNK_TILE_SIZE + y)
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

	private readonly layerTerrain = new Layer(LayerLevel.TERRAIN, this.tilesSize, false, this.layerDrawCallback)

	public render(ctx: CanvasRenderingContext2D, l: number,
	              t: number,
	              w: number,
	              h: number): void {
		this.layerTerrain.render(ctx, l, t, w, h)
	}

	private setPoint(x: number, y: number, v: Variant): void {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		this.points[y * this.pointsSize + x] = v
	}
}

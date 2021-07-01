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

import Config from '../config'
import { DataPack } from '../data-pack'
import GameSettings from '../misc/game-settings'
import { CHUNK_REAL_PX_SIZE, CHUNK_TILE_SIZE } from './chunk-indexer'
import { Layer, LayerLevel } from './layers'
import { TileTerrainSystem } from './systems/tiles-system'
import { getIsBuildable, getIsWalkable, textureIndexes, Variant } from './variant'

export const TILE_SET_WIDTH = 512 / 32


export interface TerrainSystem {
	readonly layerDrawCallback: (ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number) => void

	setVariantForTile(tileX: number, tileY: number, v: Variant): void

	isValidTile(x: number, y: number): boolean

	render(ctx: CanvasRenderingContext2D, l: number, t: number, w: number, h: number): void

	serialize(): unknown
}

class TerrainSystemImpl implements TerrainSystem {
	private readonly points: Variant[]
	private readonly pointsSize = this.tilesSize + 1
	private readonly image = this.pack.resources.getImage('summer')

	public constructor(public readonly tilesSize: number,
	                   private readonly tileSystem: TileTerrainSystem,
	                   private pack: DataPack,
	                   restoreFrom: Config | undefined) {
		if (restoreFrom !== undefined) {
			const tmp = restoreFrom.child('points').getAsNotEmptyListOfNonNegativeIntegers()
			if (tmp.length !== this.pointsSize * this.pointsSize)
				throw new Error('Length of points array is invalid')
			this.points = tmp
		} else {
			const pointsSize = this.pointsSize
			this.points = new Array(pointsSize * pointsSize)
			for (let i = 0; i < pointsSize; i++) {
				for (let j = 0; j < pointsSize; j++) {
					// let index = GRASS_VARIANT_START_INDEX + 8 * 16 - 10
					// if (Math.random() < 0.5)
					// 	index++
					this.points[i * pointsSize + j] = Variant.Dirt
				}
			}
		}
		for (let x = 0; x < tilesSize; x++) {
			for (let y = 0; y < tilesSize; y++) {
				const tmp: [number, number, number, number] = [
					this.getPoint(x, y),
					this.getPoint(x + 1, y),
					this.getPoint(x, y + 1),
					this.getPoint(x + 1, y + 1),
				]
				this.tileSystem.updateBuildableStatusNoThrow(x, y, getIsBuildable(...tmp))
				this.tileSystem.updateWalkableStatusNoThrow(x, y, getIsWalkable(...tmp))
			}
		}
	}

	public setVariantForPoint(pX: number, pY: number, v: Variant) {


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

		this.layerTerrain.markChunkDirtyNoThrow(pX - 1, pY - 1)
		this.layerTerrain.markChunkDirtyNoThrow(pX - 1, pY + 1)
		this.layerTerrain.markChunkDirtyNoThrow(pX + 1, pY + 1)
		this.layerTerrain.markChunkDirtyNoThrow(pX + 1, pY - 1)
	}

	public isValidTile(x: number, y: number): boolean {
		return !(x < 0 || x >= this.tilesSize || y < 0 || y >= this.tilesSize)
	}

	public setVariantForTile(tileX: number, tileY: number, v: Variant) {
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

	public serialize(): unknown {
		return {points: this.points}
	}

	private getPoint(x: number, y: number): Variant {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		return this.points[y * this.pointsSize + x]
	}

	private getPointDefault(x: number, y: number, def: Variant): Variant {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			return def
		return this.points[y * this.pointsSize + x]
	}

	private getSpriteIndex(x: number, y: number): number {
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

	private setPoint(x: number, y: number, v: Variant): void {
		if (x < 0 || x >= this.pointsSize || y < 0 || y >= this.pointsSize)
			throw new Error(`Invalid point index x=${x} y=${y}`)
		this.points[y * this.pointsSize + x] = v

		const around = [
			this.getPointDefault(x - 1, y - 1, v),
			this.getPointDefault(x, y - 1, v),
			this.getPointDefault(x + 1, y - 1, v),
			this.getPointDefault(x + 1, y, v),
			this.getPointDefault(x + 1, y + 1, v),
			this.getPointDefault(x, y + 1, v),
			this.getPointDefault(x - 1, y + 1, v),
			this.getPointDefault(x - 1, y, v),
		]

		// left top
		this.tileSystem.updateBuildableStatusNoThrow(x - 1, y - 1, getIsBuildable(around[0], around[1], around[7], v))
		this.tileSystem.updateWalkableStatusNoThrow(x - 1, y - 1, getIsWalkable(around[0], around[1], around[7], v))

		// right top
		this.tileSystem.updateBuildableStatusNoThrow(x, y - 1, getIsBuildable(around[1], around[2], v, around[3]))
		this.tileSystem.updateWalkableStatusNoThrow(x, y - 1, getIsWalkable(around[1], around[2], v, around[3]))

		// right bottom
		this.tileSystem.updateBuildableStatusNoThrow(x, y, getIsBuildable(v, around[3], around[5], around[4]))
		this.tileSystem.updateWalkableStatusNoThrow(x, y, getIsWalkable(v, around[3], around[5], around[4]))

		// left bottom
		this.tileSystem.updateBuildableStatusNoThrow(x - 1, y, getIsBuildable(around[7], v, around[6], around[5]))
		this.tileSystem.updateWalkableStatusNoThrow(x - 1, y, getIsWalkable(around[7], v, around[6], around[5]))
	}
}

export const createNewTerrainSystem = (settings: GameSettings,
                                       tileSystem: TileTerrainSystem,
                                       pack: DataPack): TerrainSystem => {
	return new TerrainSystemImpl(settings.mapSize, tileSystem, pack, undefined)
}

export const deserializeTerrainSystem = (settings: GameSettings,
                                         obj: Config,
                                         tileSystem: TileTerrainSystem,
                                         pack: DataPack): TerrainSystemImpl => {
	return new TerrainSystemImpl(settings.mapSize, tileSystem, pack, obj)
}

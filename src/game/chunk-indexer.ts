import { ComponentNameType, TilesIncumbent } from '../ecs/components'
import { Entity } from '../ecs/entity-types'
import { Index, ModificationListener } from '../ecs/world'
import GameSettings from './game-settings'

export interface Chunk {
	readonly chunkKey: number
	readonly chunkX: number
	readonly chunkY: number

	getAllEntities(): IterableIterator<ChunkIndexableEntity>

	getEntitiesCount(): number
}

export type ChunkIndexableEntity = Entity & TilesIncumbent

class ChunkImpl implements Chunk {
	private entities = new Map<number, ChunkIndexableEntity>()

	constructor(public readonly chunkKey: number,
	            public readonly chunkX: number,
	            public readonly chunkY: number) {
	}

	public register(entity: ChunkIndexableEntity) {
		this.entities.set(entity.id, entity)
	}

	public unregister(entity: ChunkIndexableEntity) {
		this.entities.delete(entity.id)
	}

	public getAllEntities(): IterableIterator<ChunkIndexableEntity> {
		return this.entities.values()
	}

	public getEntitiesCount(): number {
		return this.entities.size
	}
}

export class ChunkIndexer implements Index <ChunkIndexableEntity>, ModificationListener<ChunkIndexableEntity> {
	readonly components: ComponentNameType[] = ['TilesIncumbent']
	readonly listensForChangesInComponent: ComponentNameType = 'TilesIncumbent'

	private chunks = new Map<number, ChunkImpl>()
	private readonly chunkSize: number = this.settings.chunkSize

	constructor(private readonly settings: GameSettings) {
		const chunkSize = this.chunkSize
		for (let x = 0, w = Math.ceil(settings.mapWidth / chunkSize); x < w; x++) {
			for (let y = 0, h = Math.ceil(settings.mapHeight / chunkSize); y < h; y++) {
				const key = this.coordsToChunkKey(x * chunkSize, y * chunkSize)
				this.chunks.set(key, new ChunkImpl(key, x, y))
			}
		}
	}

	private static chunkCoordsToChunkKey(x: number, y: number): number {
		return x * 1_000_000 + y
	}

	public getChunkByChunkCoords(chunkX: number, chunkY: number): Chunk {
		return this.chunks.get(ChunkIndexer.chunkCoordsToChunkKey(chunkX, chunkY))!
	}

	entityAdded(entity: ChunkIndexableEntity): void {
		const ids = new Set<number>()
		for (let left = entity.occupiedTilesWest,
			     size = entity.occupiedTilesSize,
			     right = left + size;
		     left < right; left++) {
			for (let top = entity.occupiedTilesNorth,
				     bottom = top + size;
			     top < bottom; top++) {
				ids.add(this.coordsToChunkKey(left, top))
			}
		}

		for (const id of ids) {
			const chunk = this.chunks.get(id)
			if (chunk == null)
				throw new Error(`Invalid chunk id when indexing entity id=${entity.id} chunkId=${id}`)
			entity.iAmInsideChunks.add(chunk)
			chunk.register(entity)
		}
	}

	entityRemoved(entity: ChunkIndexableEntity): void {
		for (const chunk of entity.iAmInsideChunks) {
			(chunk as ChunkImpl).unregister(entity)
		}
		entity.iAmInsideChunks.clear()
	}

	entityModified(entity: ChunkIndexableEntity): void {
		if (entity.occupiedTilesSize !== 1)
			throw new Error(`Entity occupied tiles modified but occupiedTilesSize !== 1 occupiedTilesSize=${entity.occupiedTilesSize}`)

		const first: Chunk = entity.iAmInsideChunks.values().next().value

		const updatedChunkKey = this.coordsToChunkKey(entity.occupiedTilesWest, entity.occupiedTilesNorth)
		if (first.chunkKey === updatedChunkKey) {
			// chunk not changed
			return
		}
		(first as ChunkImpl).unregister(entity)
		entity.iAmInsideChunks.clear()
		const newChunk = this.chunks.get(updatedChunkKey)!
		newChunk.register(entity)
		entity.iAmInsideChunks.add(newChunk)
	}

	getNearbyEntities(posX: number, posY: number, size: number): Set<Entity> {
		const results = new Set<Entity>()

		const westTile = posX - size
		const northTile = posY - size
		const eastTile = posX + size + 1
		const southTile = posY + size + 1

		const chunkSize = this.chunkSize
		const mostWestChunk = westTile / chunkSize | 0
		const mostEastChunk = (eastTile / chunkSize | 0) + 1
		const mostNorthChunk = northTile / chunkSize | 0
		const mostSouthChunk = (southTile / chunkSize | 0) + 1
		// console.log({mostWestChunk, mostEastChunk, mostNorthChunk, mostSouthChunk})
		// console.log({westTile, eastTile, northTile, southTile})

		for (let x = mostWestChunk; x < mostEastChunk; x++) {
			for (let y = mostNorthChunk; y < mostSouthChunk; y++) {
				const key = ChunkIndexer.chunkCoordsToChunkKey(x, y)
				const chunk = this.chunks.get(key)
				if (chunk != null)
					for (const entity of chunk.getAllEntities()) {
						// console.log(entity.occupiedTilesWest, entity.occupiedTilesWest + entity.occupiedTilesSize, entity.occupiedTilesNorth, entity.occupiedTilesNorth + entity.occupiedTilesSize)
						if (entity.occupiedTilesWest >= westTile
							&& entity.occupiedTilesWest + entity.occupiedTilesSize <= eastTile
							&& entity.occupiedTilesNorth >= northTile
							&& entity.occupiedTilesNorth + entity.occupiedTilesSize <= southTile) {
							results.add(entity)
						}
					}
			}
		}
		return results
	}

	private coordsToChunkKey(x: number, y: number): number {
		return (x / this.chunkSize | 0) * 1_000_000 + (y / this.chunkSize | 0)
	}
}

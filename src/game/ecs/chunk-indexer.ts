import GameSettings from '../misc/game-settings'
import { ComponentNameType, PredefinedDrawableComponent } from './components'
import { Entity, Index, ModificationListener } from './world'

export const CHUNK_TILE_SIZE = 4
export const CHUNK_REAL_PX_SIZE = CHUNK_TILE_SIZE * 32

export interface Chunk {
	readonly chunkKey: number
	readonly chunkX: number
	readonly chunkY: number

	getAllEntities(): IterableIterator<ChunkIndexableEntity>

	getEntitiesCount(): number
}

export type ChunkIndexableEntity = Entity & PredefinedDrawableComponent

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
	readonly components: ComponentNameType[] = ['PredefinedDrawableComponent']
	readonly listensForChangesInComponent: ComponentNameType = 'PredefinedDrawableComponent'

	private chunks = new Map<number, ChunkImpl>()

	constructor(settings: GameSettings) {
		let s = Math.ceil(settings.mapSize / CHUNK_TILE_SIZE)
		for (let x = 0; x < s; x++) {
			for (let y = 0; y < s; y++) {
				const key = ChunkIndexer.coordsToChunkKey(x * CHUNK_REAL_PX_SIZE, y * CHUNK_REAL_PX_SIZE)
				this.chunks.set(key, new ChunkImpl(key, x, y))
			}
		}
	}

	private static chunkCoordsToChunkKey(x: number, y: number): number {
		return x * 1_000_000 + y
	}

	private static coordsToChunkKey(x: number, y: number): number {
		return (x / CHUNK_REAL_PX_SIZE | 0) * 1_000_000 + (y / CHUNK_REAL_PX_SIZE | 0)
	}

	public getChunkByChunkCoords(chunkX: number, chunkY: number): Chunk | undefined {
		return this.chunks.get(ChunkIndexer.chunkCoordsToChunkKey(chunkX, chunkY))
	}

	entityAdded(entity: ChunkIndexableEntity): void {
		// const ids = new Set<number>()
		// for (let left = entity.occupiedTilesWest,
		// 	     size = entity.occupiedTilesSize,
		// 	     right = left + size;
		//      left < right; left++) {
		// 	for (let top = entity.occupiedTilesNorth,
		// 		     bottom = top + size;
		// 	     top < bottom; top++) {
		// 		ids.add(this.coordsToChunkKey(left, top))
		// 	}
		// }
		//
		// for (const id of ids) {
		// 	const chunk = this.chunks.get(id)
		// 	if (chunk == null)
		// 		throw new Error(`Invalid chunk id when indexing entity id=${entity.id} chunkId=${id}`)
		// 	entity.iAmInsideChunks.add(chunk)
		// 	chunk.register(entity)
		// }
		const key = ChunkIndexer.coordsToChunkKey(entity.destinationDrawX, entity.destinationDrawY)
		const chunk = this.chunks.get(key)
		if (chunk == null)
			throw new Error(`Invalid chunk id when indexing entity id=${entity.id} chunkId=${key}`)
		chunk.register(entity)
		entity.assignedToChunkId = key
	}

	entityRemoved(entity: ChunkIndexableEntity): void {
		// for (const chunk of entity.iAmInsideChunks) {
		// 	(chunk as ChunkImpl).unregister(entity)
		// }
		// entity.iAmInsideChunks.clear()

		const key = entity.assignedToChunkId
		const chunk = this.chunks.get(key)
		if (chunk == null)
			throw new Error(`Invalid chunk id when deleting from index entity id=${entity.id} chunkId=${key}`)
		chunk.unregister(entity)
	}

	entityModified(entity: ChunkIndexableEntity): void {
		// if (entity.occupiedTilesSize !== 1)
		// 	throw new Error(`Entity occupied tiles modified but occupiedTilesSize !== 1 occupiedTilesSize=${entity.occupiedTilesSize}`)
		//
		// const first: Chunk = entity.iAmInsideChunks.values().next().value
		//
		// const updatedChunkKey = this.coordsToChunkKey(entity.occupiedTilesWest, entity.occupiedTilesNorth)
		// if (first.chunkKey === updatedChunkKey) {
		// 	// chunk not changed
		// 	return
		// }
		// (first as ChunkImpl).unregister(entity)
		// entity.iAmInsideChunks.clear()
		// const newChunk = this.chunks.get(updatedChunkKey)!
		// newChunk.register(entity)
		// entity.iAmInsideChunks.add(newChunk)

		const previous = entity.assignedToChunkId
		const now = ChunkIndexer.coordsToChunkKey(entity.destinationDrawX, entity.destinationDrawY)
		if (previous === now) {
			return
		}
		entity.assignedToChunkId = now
		this.chunks.get(previous)?.unregister(entity)
		this.chunks.get(now)!.register(entity)
	}

	* getEntitiesWithinCoarse(left: number, top: number, width: number, height: number): Generator<ChunkIndexableEntity> {
		const mostLeftChunk = (left / CHUNK_REAL_PX_SIZE | 0) - 1
		const mostTopChunk = (top / CHUNK_REAL_PX_SIZE | 0) - 1
		const mostRightChunk = ((left + width) / CHUNK_REAL_PX_SIZE | 0)
		const mostBottomChunk = ((top + height) / CHUNK_REAL_PX_SIZE | 0)

		for (let x = mostLeftChunk; x <= mostRightChunk; x++) {
			for (let y = mostTopChunk; y <= mostBottomChunk; y++) {
				const chunk = this.getChunkByChunkCoords(x, y)
				if (chunk === undefined) continue
				for (const entity of chunk.getAllEntities()) {
					yield entity
				}
			}
		}


		// throw new Error('Not implemented')
		// const results = new Set<Entity>()
		//
		// const westTile = posX - size
		// const northTile = posY - size
		// const eastTile = posX + size + 1
		// const southTile = posY + size + 1
		//
		// const chunkSize = this.chunkSize
		// const mostWestChunk = westTile / chunkSize | 0
		// const mostEastChunk = (eastTile / chunkSize | 0) + 1
		// const mostNorthChunk = northTile / chunkSize | 0
		// const mostSouthChunk = (southTile / chunkSize | 0) + 1
		// console.log({mostWestChunk, mostEastChunk, mostNorthChunk, mostSouthChunk})
		// console.log({westTile, eastTile, northTile, southTile})
		//
		// for (let x = mostWestChunk; x < mostEastChunk; x++) {
		// 	for (let y = mostNorthChunk; y < mostSouthChunk; y++) {
		// 		const key = ChunkIndexer.chunkCoordsToChunkKey(x, y)
		// 		const chunk = this.chunks.get(key)
		// 		if (chunk != null)
		// 			for (const entity of chunk.getAllEntities()) {
		// 				// console.log(entity)
		// 				// // console.log(entity.occupiedTilesWest, entity.occupiedTilesWest + entity.occupiedTilesSize, entity.occupiedTilesNorth, entity.occupiedTilesNorth + entity.occupiedTilesSize)
		// 				// // if (entity.occupiedTilesWest >= westTile
		// 				// // 	&& entity.occupiedTilesWest + entity.occupiedTilesSize <= eastTile
		// 				// // 	&& entity.occupiedTilesNorth >= northTile
		// 				// // 	&& entity.occupiedTilesNorth + entity.occupiedTilesSize <= southTile) {
		// 				// // 	results.add(entity)
		// 				// // }
		// 				// const entityMostWest = entity.occupiedTilesWest
		// 				// const entityMostEast = entity.occupiedTilesWest + entity.occupiedTilesSize
		// 				// const entityMostNorth = entity.occupiedTilesNorth
		// 				// const entityMostSouth = entity.occupiedTilesNorth + entity.occupiedTilesSize
		// 				// if (entityMostEast >= westTile ){
		// 				// 	results.add(entity)
		// 				// }
		// 			}
		// 	}
		// }
		// return results
	}
}

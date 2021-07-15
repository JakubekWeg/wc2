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
		const key = ChunkIndexer.coordsToChunkKey(entity.destinationDrawX, entity.destinationDrawY)
		const chunk = this.chunks.get(key)
		if (chunk == null)
			throw new Error(`Invalid chunk id when indexing entity id=${entity.id} chunkId=${key}`)
		chunk.register(entity)
		entity.assignedToChunkId = key
	}

	entityRemoved(entity: ChunkIndexableEntity): void {
		const key = entity.assignedToChunkId
		const chunk = this.chunks.get(key)
		if (chunk == null)
			throw new Error(`Invalid chunk id when deleting from index entity id=${entity.id} chunkId=${key}`)
		chunk.unregister(entity)
	}

	entityModified(entity: ChunkIndexableEntity): void {
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
	}
}

import { CHUNK_REAL_PX_SIZE, CHUNK_TILE_SIZE } from './chunk-indexer'

export enum LayerLevel {
	TERRAIN = 0,
	BUILDINGS = 1,
	UNITS = 2,
}

export type DrawChunkCallback = (ctx: CanvasRenderingContext2D, chunkX: number, chunkY: number) => void

export class Layer {
	private canvas: HTMLCanvasElement = document.createElement('canvas')
	private context: CanvasRenderingContext2D = this.canvas.getContext('2d', {alpha: false})!

	private dirtyChunks: Set<number> = new Set()

	constructor(public readonly level: LayerLevel,
	            private readonly mapSize: number,
	            private readonly alpha: boolean,
	            private readonly drawChunk: DrawChunkCallback) {
		const dimension = mapSize * 32
		this.canvas.width = dimension
		this.canvas.height = dimension

		for (let x = 0, w = Math.ceil(mapSize / CHUNK_TILE_SIZE); x < w; x++) {
			for (let y = 0, h = Math.ceil(mapSize / CHUNK_TILE_SIZE); y < h; y++) {
				const key = Layer.chunkCoordsToChunkKey(x, y)
				this.dirtyChunks.add(key)
			}
		}

		this.context.fillRect(0, 0, dimension, dimension)
	}

	private static coordsToChunkKey(x: number, y: number): number {
		return (x / CHUNK_TILE_SIZE | 0) * 1_000_000 + (y / CHUNK_TILE_SIZE | 0)
	}

	private static chunkCoordsToChunkKey(x: number, y: number): number {
		return x * 1_000_000 + y
	}

	markChunkDirty(tileX: number, tileY: number) {
		const key = Layer.coordsToChunkKey(tileX, tileY)
		this.dirtyChunks.add(key)
	}

	render(ctx: CanvasRenderingContext2D,
	       l: number,
	       t: number,
	       w: number,
	       h: number) {
		const mostLeftChunk = (l / CHUNK_REAL_PX_SIZE | 0)
		const mostTopChunk = (t / CHUNK_REAL_PX_SIZE | 0)
		const mostRightChunk = ((l + w) / CHUNK_REAL_PX_SIZE | 0)
		const mostBottomChunk = ((t + h) / CHUNK_REAL_PX_SIZE | 0)

		const bufferContext = this.context
		for (let x = mostLeftChunk; x <= mostRightChunk; x++) {
			for (let y = mostTopChunk; y <= mostBottomChunk; y++) {
				const key = Layer.chunkCoordsToChunkKey(x, y)
				if (this.dirtyChunks.delete(key)) {
					// delete returns if key was in set, so it must refresh the chunk
					this.drawChunk(bufferContext, x, y)
				}
			}
		}

		ctx.drawImage(this.canvas, 0, 0)
	}
}

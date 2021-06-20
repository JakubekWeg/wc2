// import createLogger from './log'

// const log = createLogger('Renderer')

import { Camera } from './camera'
import { TilesIncumbentComponent } from './ecs/components'
import { doNothingCallback } from './ecs/entities/common'
import { TileImpl } from './ecs/systems/tiles-system'
import { Entity } from './ecs/world'
import { GameInstanceImpl } from './game-instance'
import { FacingDirection, facingDirectionToVector } from './misc/facing-direction'
import GameSettings from './misc/game-settings'
import { registry } from './misc/resources-manager'

export interface DebugOptions {
	showTilesOccupation?: boolean
	showPaths?: boolean
	showChunkBoundaries?: boolean
	showTileListenersCount?: boolean
}

export interface DebugPath {
	current: number
	entityFor: Entity & TilesIncumbentComponent,
	path: FacingDirection[]
}

export class Renderer {
	public static DEBUG_PATHS: Set<DebugPath> = new Set()

	private debugOptions: DebugOptions = {}
	private enabled: boolean = false
	private game?: GameInstanceImpl
	private canvas?: HTMLCanvasElement
	private context?: CanvasRenderingContext2D
	private width: number = 0
	private height: number = 0
	private lastFrameTime: number = Date.now()
	private nextFrameBind = this.nextFrame.bind(this)
	private animationHandle: number = -1
	private hasFocus: boolean = true

	constructor(private readonly settings: GameSettings,
	            private readonly camera: Camera) {
	}

	public setCanvas(canvas?: HTMLCanvasElement) {
		this.canvas = canvas
		this.reinitialize()
	}

	public setGameInstance(game?: GameInstanceImpl) {
		this.game = game
		Renderer.DEBUG_PATHS.clear()
	}

	public updateDebugOptions(options: DebugOptions) {
		this.debugOptions = {...this.debugOptions, ...options}
	}

	public setSize(width: number,
	               height: number) {
		this.width = width
		this.height = height
		this.reinitialize()
	}

	setPageFocused(focus: boolean) {
		this.hasFocus = focus
	}

	private nextFrame(time: number) {
		if (!this.enabled) return
		requestAnimationFrame(this.nextFrameBind)
		const delta = time - this.lastFrameTime
		// if (delta < 100) return
		this.lastFrameTime = time

		if (!this.hasFocus) {
			const context = this.context
			if (context != null) {
				context.fillStyle = '#222'
				context.fillRect(0, 0, this.width, this.height)
			}
			return
		}
		const context = this.context
		if (context != null) {
			const game = this.game
			if (game == null) {
				context.fillStyle = '#880000'
				context.fillRect(0, 0, this.width, this.height)
			} else {
				// context.fillStyle = '#333'
				context.fillStyle = '#6a3a00'
				context.fillRect(0, 0, this.width, this.height)

				const camera = this.camera
				camera.update(delta)
				const scale = camera.scale
				const viewPortWidth = this.width / scale
				const viewPortHeight = this.height / scale
				context.scale(scale, scale)
				context.translate(-camera.centerX + viewPortWidth * 0.25, -camera.centerY + viewPortHeight * 0.25)

				const tileSet = registry[1]
				for (let i = 0; i < this.settings.mapWidth; i++) {
					for (let j = 0; j < this.settings.mapHeight; j++) {
						context.drawImage(tileSet, 384, 704, 32, 32, i * 32, j * 32, 32, 32)
					}
				}

				const now = Date.now()
				for (let e of game.delayedHideEntities()) {
					if (e.hideMeAtMillis <= now)
						e.render = doNothingCallback
				}

				for (const e of game.movingEntities()) {
					e.destinationDrawX += e.spriteVelocityX * delta
					e.destinationDrawY += e.spriteVelocityY * delta
				}

				for (const e of game.drawableEntities()) {
					e.render(context)
				}


				if (this.debugOptions.showTilesOccupation) {
					const tileSizeInPixels = 32
					for (let i = 0; i < this.settings.mapWidth; i++) {
						for (let j = 0; j < this.settings.mapHeight; j++) {
							const walkable = game.tiles.isTileWalkableNoThrow(i, j)
							context.fillStyle = walkable ? '#00FF0077' : '#FF000077'
							context.fillRect(
								(i + 0.3) * tileSizeInPixels,
								(j + 0.3) * tileSizeInPixels,
								tileSizeInPixels * 0.4,
								tileSizeInPixels * 0.4)
						}
					}
				}

				if (this.debugOptions.showPaths) {
					context.strokeStyle = '#000000'
					for (const path of Renderer.DEBUG_PATHS) {

						context.beginPath()
						context.lineWidth = 2
						let lastX = path.entityFor.mostWestTile * 32 + 16
						let lastY = path.entityFor.mostNorthTile * 32 + 16
						context.moveTo(lastX, lastY)
						for (let i = path.current, s = path.path.length; i < s; i++) {
							const dir = path.path[i]
							const [ox, oy] = facingDirectionToVector(dir)
							lastX += ox * 32
							lastY += oy * 32
							context.lineTo(lastX, lastY)
						}
						context.stroke()
						context.closePath()
					}
					// for (const entity of game.walkingEntities()) {
					// 	if (entity.pathDirections.length > 0) {
					// 		context.beginPath()
					// 		context.lineWidth = 2
					// 		let lastX = entity.occupiedTilesWest * 32 + 16
					// 		let lastY = entity.occupiedTilesNorth * 32 + 16
					// 		context.moveTo(lastX, lastY)
					// 		for (const dir of entity.pathDirections) {
					// 			const [ox, oy] = facingDirectionToVector(dir)
					// 			lastX += ox * 32
					// 			lastY += oy * 32
					// 			context.lineTo(lastX, lastY)
					// 		}
					// 		context.stroke()
					// 		context.closePath()
					// 	}
					// }
				}
				//
				// if (this.debugOptions.showChunkBoundaries) {
				// 	context.lineWidth = 2
				// 	const {mapWidth, mapHeight, chunkSize} = game.settings
				// 	const chunksX = Math.ceil(mapWidth / chunkSize)
				// 	const chunksY = Math.ceil(mapHeight / chunkSize)
				// 	const margin = 4
				// 	context.font = '12px Roboto'
				// 	context.fillStyle = 'black'
				// 	for (let i = 0; i < chunksX; i++) {
				// 		for (let j = 0; j < chunksY; j++) {
				// 			const count = game
				// 				.chunkEntityIndex
				// 				.getChunkByChunkCoords(i, j)
				// 				.getEntitiesCount()
				//
				// 			context.fillText(`${count}`,
				// 				i * 32 * chunkSize + 2 * margin,
				// 				j * 32 * chunkSize + 4 * margin)
				//
				// 			context.strokeRect(
				// 				i * 32 * chunkSize + margin,
				// 				j * 32 * chunkSize + margin,
				// 				chunkSize * 32 - margin * 2,
				// 				chunkSize * 32 - margin * 2)
				// 		}
				// 	}
				// }
				//
				if (this.debugOptions.showTileListenersCount) {
					const {mapWidth, mapHeight} = game.settings
					for (let i = 0; i < mapWidth; i++) {
						for (let j = 0; j < mapHeight; j++) {
							const tile = game.tiles.get(i, j) as TileImpl
							const count = tile.getListenersCount()
							if (count > 0) {
								context.fillStyle = '#0000FF44'
								context?.fillRect(i * 32, j * 32, 32, 32)
							}
							context.fillStyle = 'black'
							context.fillText(`${count}`,
								i * 32 + 12,
								j * 32 + 20)
							// let any = false
							// for (const listener of tile.getListeners()) {
							// 	any = true
							// 	const sprite = (listener as unknown as SpriteDrawableComponent);
							// 	if (sprite.spriteSize !== undefined) {
							// 		context.beginPath()
							// 		context.lineWidth = 2
							// 		context.moveTo(i * 32, j * 32)
							// 		context.lineTo(sprite.destinationDrawX + 36, sprite.destinationDrawY + 36)
							// 		context.closePath()
							// 		context.stroke()
							//
							// 	}
							// }
						}
					}
				}
				context.resetTransform()
			}
		}
	}

	private reinitialize() {
		const wasEnabled = this.enabled
		this.enabled = !!this.canvas && this.width > 0 && this.height > 0
		this.context = this.canvas?.getContext('2d', {
			alpha: false,
		}) ?? undefined
		if (this.context) {
			if (this.canvas != null) {
				this.canvas.width = this.width / 2
				this.canvas.height = this.height / 2
			}
			this.context.imageSmoothingEnabled = false
			this.context.fillStyle = 'black'
			this.context.fillRect(0, 0, this.width, this.height)
		}

		if (this.enabled && !wasEnabled) {
			cancelAnimationFrame(this.animationHandle)
			this.animationHandle = requestAnimationFrame(this.nextFrameBind)
		}
	}
}

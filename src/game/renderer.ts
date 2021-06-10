// import createLogger from './log'

// const log = createLogger('Renderer')

import { facingDirectionToVector } from '../ecs/components'
import { GameInstance } from './game-instance'
import GameSettings from './game-settings'
import { registry } from './resources-manager'

export interface DebugOptions {
	showTilesOccupation?: boolean
	showPaths?: boolean
}

export class Renderer {
	private debugOptions: DebugOptions = {}
	private enabled: boolean = false
	private game?: GameInstance
	private canvas?: HTMLCanvasElement
	private context?: CanvasRenderingContext2D
	private width: number = 0
	private height: number = 0
	private nextFrameBind = this.nextFrame.bind(this)
	private animationHandle: number = -1
	private hasFocus: boolean = true

	constructor(private readonly settings: GameSettings) {
	}

	public setCanvas(canvas?: HTMLCanvasElement) {
		this.canvas = canvas
		this.reinitialize()
	}

	public setGameInstance(game?: GameInstance) {
		this.game = game
	}

	public updateDebugOptions(options: DebugOptions) {
		this.debugOptions = {...this.debugOptions, ...options}
	}

	// public setCanvas(canvas?: HTMLCanvasElement) {
	// 	this.canvas = canvas
	// 	this.reinitialize()
	// }

	public setSize(width: number,
	               height: number) {
		this.width = width
		this.height = height
		this.reinitialize()
	}

	setPageFocused(focus: boolean) {
		this.hasFocus = focus
	}

	private nextFrame() {
		if (!this.enabled) return
		requestAnimationFrame(this.nextFrameBind)
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
				context.fillStyle = 'red'
				context.fillRect(0, 0, this.width, this.height)
			} else {
				// context.fillStyle = '#333'
				context.fillStyle = '#6a3a00'
				context.fillRect(0, 0, this.width, this.height)
				const tileSet = registry[1]
				for (let i = 0; i < 20; i++) {
					for (let j = 0; j < 20; j++) {
						context.drawImage(tileSet, 384, 704, 32, 32, i * 32, j * 32, 32, 32)
					}
				}

				// context.drawImage(registry[0], 32 * 6, 32 * 6)

				for (const entity of game.spriteEntities()) {
					const size = entity.spriteSize
					context.drawImage(registry[entity.imageIndex],
						entity.sourceDrawX,
						entity.sourceDrawY,
						size, size,
						entity.destinationDrawX,
						entity.destinationDrawY,
						size, size)
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
					for (const entity of game.walkingEntities()) {
						if (entity.pathDirections.length > 0) {
							context.beginPath()
							context.lineWidth = 2
							let lastX = entity.occupiedTiles[0].x * 32 + 16
							let lastY = entity.occupiedTiles[0].y * 32 + 16
							context.moveTo(lastX, lastY)
							for (const dir of entity.pathDirections) {
								const [ox, oy] = facingDirectionToVector(dir)
								lastX += ox * 32
								lastY += oy * 32
								context.lineTo(lastX, lastY)
							}
							context.stroke()
							context.closePath()
						}
					}
				}
			}
		}
	}

	private reinitialize() {
		const wasEnabled = this.enabled
		this.enabled = !!this.canvas && this.width > 0 && this.height > 0
		this.context = this.canvas?.getContext('2d', {
			alpha: false,
			desynchronized: true,
		}) ?? undefined

		if (this.enabled && !wasEnabled) {
			cancelAnimationFrame(this.animationHandle)
			this.animationHandle = requestAnimationFrame(this.nextFrameBind)
		}
	}
}

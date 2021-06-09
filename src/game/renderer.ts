// import createLogger from './log'

// const log = createLogger('Renderer')

import { GameInstance } from './game-instance'
import GameSettings from './game-settings'
import { registry } from './resources-manager'

export class Renderer {
	private enabled: boolean = false
	private game?: GameInstance
	private canvas?: HTMLCanvasElement
	private context?: CanvasRenderingContext2D
	private width: number = 0
	private height: number = 0
	private lastFrameMillis = 0
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

				// context.drawImage(registry[2], 32 * 2, 32 * 2)

				for (const entity of game.graphicEntitiesGetter()) {
					context.fillStyle = entity.color
					context.beginPath()
					context.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
					context.closePath()
					context.fill()
				}

				const now = Date.now()
				const delta = now - this.lastFrameMillis
				this.lastFrameMillis = now
				for (const entity of game.spriteEntities()) {
					entity.updateBeforeRender(now)
					const size = entity.spriteSize
					context.drawImage(registry[entity.imageIndex],
						entity.sourceDrawX,
						entity.sourceDrawY,
						size, size,
						entity.destinationDrawX,
						entity.destinationDrawY,
						size, size)
				}
				context.resetTransform()

				const tileSizeInPixels = this.settings.tileSizeInPixels
				for (let i = 0; i < this.settings.mapWidth; i++) {
					for (let j = 0; j < this.settings.mapHeight; j++) {
						const walkable = game.tiles.isTileWalkable(i, j)
						context.fillStyle = walkable ? '#00FF0077' : '#FF000077'
						context.fillRect(
							(i + 0.3) * tileSizeInPixels,
							(j + 0.3) * tileSizeInPixels,
							tileSizeInPixels * 0.4,
							tileSizeInPixels * 0.4)
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

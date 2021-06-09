// import createLogger from './log'

// const log = createLogger('Renderer')

import { GameInstance } from './game-instance'

export class Renderer {
	private enabled: boolean = false
	private game?: GameInstance
	private canvas?: HTMLCanvasElement
	private context?: CanvasRenderingContext2D
	private width: number = 0
	private height: number = 0
	private nextFrameBind = this.nextFrame.bind(this)
	private animationHandle: number = -1
	private hasFocus: boolean = true

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
				context.fillStyle = 'green'
				context.fillRect(0, 0, this.width, this.height)

				for (const entity of game.graphicEntitiesGetter()) {
					context.fillStyle = entity.color
					context.beginPath()
					context.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
					context.closePath()
					context.fill()
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

	setPageFocused(focus: boolean) {
		this.hasFocus = focus
	}
}

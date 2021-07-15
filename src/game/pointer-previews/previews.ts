import { EditorFrontedController } from '../../ui/game/frontend-controller'
import { CanvasMouseEvent } from '../../ui/game/GameCanvas'
import { doNothingCallback } from '../ecs/entities/common'

export interface PointerPreview {
	render: (ctx: CanvasRenderingContext2D) => void
	handleMouse: (e: CanvasMouseEvent) => void
}

export class NullPreview implements PointerPreview {
	render = doNothingCallback
	handleMouse = doNothingCallback
}


export class SelectEntitiesPreview implements PointerPreview {
	constructor(private readonly controller: EditorFrontedController) {
	}

	private isSelectingMode: boolean = false
	private startX: number = 0 | 0
	private startY: number = 0 | 0
	private endX: number = 0 | 0
	private endY: number = 0 | 0

	render(ctx: CanvasRenderingContext2D) {
		if (!this.isSelectingMode) return
		let x, y, w, h

		if (this.startX < this.endX) {
			x = this.startX
			w = this.endX - this.startX
		} else {
			x = this.endX
			w = this.startX - this.endX
		}

		if (this.startY < this.endY) {
			y = this.startY
			h = this.endY - this.startY
		} else {
			y = this.endY
			h = this.startY - this.endY
		}

		ctx.strokeStyle = '#FFF'
		ctx.strokeRect(x, y, w, h)
	}

	handleMouse(e: CanvasMouseEvent) {
		if (e.type === 'leave') {
			this.isSelectingMode = false
			return
		}
		if (e.button === undefined)
			return

		if (e.type === 'up') {
			this.isSelectingMode = false
			return
		}

		if (e.type === 'down') {
			this.startX = this.endX = e.x
			this.startY = this.endY = e.y
		}

		this.isSelectingMode = true
		this.endX = e.x
		this.endY = e.y
	}
}


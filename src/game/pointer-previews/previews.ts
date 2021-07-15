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


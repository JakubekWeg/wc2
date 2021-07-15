import { EditorFrontedController } from '../../ui/game/frontend-controller'
import { CanvasMouseEvent } from '../../ui/game/GameCanvas'
import { GameInstance } from '../game-instance'
import { PointerPreview } from './previews'

export class SetVariantPreview implements PointerPreview {
	private rectDestinationX: number = 0
	private rectDestinationY: number = 0
	private RECT_OUTLINE_SIZE: number = 1 | 0
	private RECT_SIZE: number = 32 + this.RECT_OUTLINE_SIZE * 2

	constructor(private readonly game: GameInstance,
	            private readonly controller: EditorFrontedController) {
	}


	render(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = '#FFFFFF'
		ctx.lineWidth = this.RECT_OUTLINE_SIZE * 2
		ctx.strokeRect(this.rectDestinationX, this.rectDestinationY, this.RECT_SIZE, this.RECT_SIZE)
	}

	handleMouse(e: CanvasMouseEvent) {
		this.rectDestinationX = e.tileX * 32 - this.RECT_OUTLINE_SIZE
		this.rectDestinationY = e.tileY * 32 - this.RECT_OUTLINE_SIZE

		if (e.button !== undefined) {
			const variant = this.controller.variantsToPlace[e.button]
			this.game.terrain.setVariantForTile(e.tileX, e.tileY, variant)
		}
	}

}

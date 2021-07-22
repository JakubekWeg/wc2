import { EditorFrontedController } from '../../ui/game/frontend-controller'
import { CanvasMouseEvent, MouseActionType, MouseButtonType } from '../../ui/game/GameCanvas'
import { Variant } from '../ecs/variant'
import { GameInstance } from '../game-instance'
import { PointerPreview } from './previews'

export class SetVariantPreview implements PointerPreview {
	private rectDestinationX: number = 0
	private rectDestinationY: number = 0
	private drawRectSize: number = 0
	private RECT_OUTLINE_SIZE: number = 1 | 0
	private RECT_SIZE: number = 32 + this.RECT_OUTLINE_SIZE * 2

	constructor(private readonly game: GameInstance,
	            private readonly controller: EditorFrontedController) {
	}


	render(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = '#FFFFFF'
		ctx.lineWidth = this.RECT_OUTLINE_SIZE * 2
		ctx.strokeRect(this.rectDestinationX, this.rectDestinationY, this.drawRectSize, this.drawRectSize)
	}

	handleMouse(e: CanvasMouseEvent) {
		if (e.type === MouseActionType.Leave) return
		const size = this.controller.setTerrainSize

		const mostLeftTile = e.tileX - (size - 1)
		const mostTopTile = e.tileY - (size - 1)

		this.rectDestinationX = mostLeftTile * 32 - this.RECT_OUTLINE_SIZE
		this.rectDestinationY = mostTopTile * 32 - this.RECT_OUTLINE_SIZE
		this.drawRectSize = this.RECT_SIZE * ((size - 1) * 2 + 1)

		if (e.button !== MouseButtonType.None) {
			const variant = this.controller.getVariantByMouseButton(e.button)
			this.commitSetVariant(variant, mostLeftTile, mostTopTile, size)
		}
	}

	private commitSetVariant(variant: Variant, mostLeftTile: number, mostTopTile: number, size: number) {
		const tilesSize = size * 2 - 1
		for (let i = 0; i < tilesSize; i++) {
			for (let j = 0; j < tilesSize; j++) {
				this.game.terrain.setVariantForTile(mostLeftTile + i, mostTopTile + j, variant)
			}
		}
	}
}

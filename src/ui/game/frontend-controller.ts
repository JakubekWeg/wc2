import React from 'react'
import { Variant } from '../../game/ecs/terrain'
import { GameInstanceImpl } from '../../game/game-instance'
import { CanvasMouseEvent } from './GameCanvas'

export interface FrontendController {
	readonly game: GameInstanceImpl

	mouseEvent(e: CanvasMouseEvent): void
}

export const FrontedControllerContext = React.createContext<FrontendController>({} as unknown as FrontendController)

export class EditorFrontedController implements FrontendController {
	public readonly variants: Variant[]
	private lastTileX: number = -1
	private lastTileY: number = -1

	constructor(public readonly game: GameInstanceImpl) {
		this.variants = [Variant.Grass, Variant.Dirt, Variant.Water]
		// setInterval(() => console.log(this, this.variants), 1000)
	}

	mouseEvent(e: CanvasMouseEvent) {
		if (e.button === undefined)
			return
		if (e.tileX === this.lastTileX && e.tileY === this.lastTileY && e.type === 'move')
			return

		this.lastTileX = e.tileX
		this.lastTileY = e.tileY
		const variant = this.variants[e.button]
		if (variant === undefined)
			return

		this.game.terrain.setVariantForTile(e.tileX, e.tileY, variant)
	}
}

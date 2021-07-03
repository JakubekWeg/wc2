import React from 'react'
import { Variant } from '../../game/ecs/variant'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { CanvasMouseEvent } from './GameCanvas'

export interface FrontendController {
	readonly game: GameInstanceImpl

	mouseEvent(e: CanvasMouseEvent): void
}

export const FrontedControllerContext = React.createContext<FrontendController>({} as unknown as FrontendController)

export interface MouseAction {
	type: 'none' | 'spawn-entity' | 'set-tile'
	iconIndex: number
	entityName?: string
}

export class EditorFrontedController implements FrontendController {
	public readonly variantsToPlace: [Variant,Variant,Variant]
	public openedSelector: number = -1
	private lastTileX: number = -1
	private lastTileY: number = -1

	constructor(public readonly game: GameInstanceImpl,
	            public readonly renderer: Renderer) {
		this.variantsToPlace = [
			Variant.DarkGrass,
			Variant.Dirt,
			Variant.Water,
		]
	}

	mouseEvent(e: CanvasMouseEvent) {
		const justMoved = e.type === 'move'
		const movedOnTheSameTile = justMoved && e.tileX === this.lastTileX && e.tileY === this.lastTileY
		if (movedOnTheSameTile)
			return
		this.lastTileX = e.tileX
		this.lastTileY = e.tileY
		this.renderer.currentlyShowingHoverPreview.handleMouse(e)
	}
}

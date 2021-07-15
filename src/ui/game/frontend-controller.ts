import React from 'react'
import { Variant } from '../../game/ecs/variant'
import { EntityType } from '../../game/ecs/world'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { CanvasMouseEvent } from './GameCanvas'

export interface FrontendController {
	readonly game: GameInstanceImpl

	mouseEvent(e: CanvasMouseEvent): void
}

export const FrontedControllerContext = React.createContext<FrontendController>({} as unknown as FrontendController)

export class EditorFrontedController implements FrontendController {
	public readonly variantsToPlace: [Variant,Variant,Variant]
	public readonly entitiesToPickFrom: EntityType[]
	public entityToSpawn: EntityType
	public openedSelector: number = -1

	constructor(public readonly game: GameInstanceImpl,
	            public readonly renderer: Renderer) {
		this.variantsToPlace = [
			Variant.DarkGrass,
			Variant.Dirt,
			Variant.Water,
		]
		this.entitiesToPickFrom = game
			.dataPack.entityTypes
			.filter(e => e.componentNames.has('IconComponent'))
		this.entityToSpawn = this.entitiesToPickFrom[0]
	}

	mouseEvent(e: CanvasMouseEvent) {
		this.renderer.currentlyShowingHoverPreview.handleMouse(e)
	}
}

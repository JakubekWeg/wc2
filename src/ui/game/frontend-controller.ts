import React from 'react'
import { MovingUnitComponent, PredefinedDrawableComponent, TilesIncumbentComponent } from '../../game/ecs/components'
import { Variant } from '../../game/ecs/variant'
import { Entity } from '../../game/ecs/world'
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
	public readonly mouseActions: MouseAction[]
	private lastTileX: number = -1
	private lastTileY: number = -1

	constructor(public readonly game: GameInstanceImpl,
	            public readonly renderer: Renderer) {
		this.mouseActions = [
			{type: 'set-tile', iconIndex: 1},
			{type: 'set-tile', iconIndex: 2},
			{type: 'set-tile', iconIndex: 4},
		]
	}

	mouseEvent(e: CanvasMouseEvent) {
		if (e.button === undefined) {
			this.handleMouseNotPressedHover(e)
			return
		}

		const movedOnTheSameTile = e.tileX === this.lastTileX && e.tileY === this.lastTileY && e.type === 'move'
		if (movedOnTheSameTile)
			return

		this.handlePressedMouse(e)
	}

	private handlePressedMouse(e: CanvasMouseEvent) {
		this.lastTileX = e.tileX
		this.lastTileY = e.tileY

		const action = this.mouseActions[e.button as number]
		if (action === undefined)
			return

		switch (action.type) {
			default:
				console.error('Unsupported mouse action type ' + action.type)
				break
			case 'set-tile':
				const variant = action.iconIndex as Variant
				this.game.terrain.setVariantForTile(e.tileX, e.tileY, variant)
				break
			case 'spawn-entity':
				const name = action.entityName
				if (name === undefined) {
					console.error('Missing entity name to spawn')
					break
				}
				this.game.dispatchNextTick(world => {
					const template = world.getEntityTemplate(name) as Entity & TilesIncumbentComponent & MovingUnitComponent
					const entityIsBuilding = template.unitMovingSpeed === undefined
					if (entityIsBuilding) {
						if (!this.game.tiles.areTilesBuildableNoThrow(e.tileX, e.tileY,
							template.tileOccupySize))
							return
					} else {
						if (!this.game.tiles.isTileWalkableNoThrow(e.tileX, e.tileY))
							return
					}
					const entity = world.spawnEntity(name) as Entity & TilesIncumbentComponent & PredefinedDrawableComponent
					entity.mostWestTile = e.tileX
					entity.mostNorthTile = e.tileY
					if (entityIsBuilding) {
						entity.destinationDrawX = e.tileX * 32
						entity.destinationDrawY = e.tileY * 32
					} else {
						entity.destinationDrawX = e.tileX * 32 - (entity.spriteSize - 32) / 2
						entity.destinationDrawY = e.tileY * 32 - (entity.spriteSize - 32) / 2
					}
					world.commitAddedEntities()
				})
				break
		}
	}

	private handleMouseNotPressedHover(e: CanvasMouseEvent) {
		this.renderer.currentlyShowingHoverPreview.onHover(e)
	}
}

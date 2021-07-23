import React from 'react'
import {
	ActionsComponent,
	AnimatableDrawableComponent,
	DelayedHideComponent,
	PredefinedDrawableComponent,
	SelectableComponent,
	SelectionStatus,
} from '../../game/ecs/components'
import { doNothingCallback } from '../../game/ecs/entities/common'
import { Variant } from '../../game/ecs/variant'
import { Entity, EntityType } from '../../game/ecs/world'
import { ANIMATIONS_PER_TICK, GameInstanceImpl, MILLIS_BETWEEN_TICKS } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { CanvasMouseEvent, MouseButtonType } from './GameCanvas'

export interface FrontendController {
	readonly game: GameInstanceImpl

	mouseEvent(e: CanvasMouseEvent): void
}

export const FrontedControllerContext = React.createContext<FrontendController>({} as unknown as FrontendController)

export class EditorFrontedController implements FrontendController {
	public readonly variantsToPlace: [Variant, Variant, Variant]
	public setTerrainSize: number = 2
	public readonly entitiesToPickFrom: EntityType[]
	public entityToSpawn: EntityType
	public openedSelector: number = -1
	private selectedEntities: Set<Entity & SelectableComponent> = new Set()
	private selectedEntitiesCallback: (entities: Set<Entity & SelectableComponent>) => void = doNothingCallback

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

	public getVariantByMouseButton(button: MouseButtonType): Variant {
		switch (button) {
			case MouseButtonType.None:
				throw new Error('Provided none button')
			case MouseButtonType.Middle:
				return this.variantsToPlace[1]
			case MouseButtonType.Right:
				return this.variantsToPlace[2]
			case MouseButtonType.Left:
			default:
				return this.variantsToPlace[0]
		}
	}

	mouseEvent(e: CanvasMouseEvent) {
		this.renderer.currentlyShowingHoverPreview.handleMouse(e)
	}

	resetSelectedEntities() {
		for (const e of this.selectedEntities)
			e.selectionStatus = SelectionStatus.UnSelected
		this.selectedEntities.clear()
		this.selectedEntitiesCallback(this.selectedEntities)
	}

	setSelectedEntities(list: Iterable<Entity & SelectableComponent>) {
		this.resetSelectedEntities()
		for (const e of list) {
			e.selectionStatus = SelectionStatus.SelectedEditor
			this.selectedEntities.add(e)
		}
		this.selectedEntitiesCallback(this.selectedEntities)
	}

	handleMouseAction(tileX: number, tileY: number) {
		// const command = {
		// 	targetX: tileX,
		// 	targetY: tileY,
		// 	type: 'go',
		// } as PlayerCommand

		for (const entity of this.selectedEntities) {
			this.game.dispatchNextTick(() => {
				const taker = (entity as unknown as Entity & ActionsComponent)
				taker.availableActions[0].execute({
					game: this.game,
					entity: taker,
					targetTile: {x: tileX, y: tileY},
				})
				// const taker = (entity as unknown as PlayerCommandTakerComponent)
				// if (taker.canAcceptCommands) {
				// 	taker.myCurrentState?.get()?.handleCommand(command, this.game)
				// }
			})
		}
		this.game.dispatchNextTick(world => {
			const entity = world.spawnEffectEntity('cross') as unknown as PredefinedDrawableComponent & DelayedHideComponent & AnimatableDrawableComponent
			entity.destinationDrawX = tileX * 32
			entity.destinationDrawY = tileY * 32
			entity.hideMeAtMillis = Date.now() + entity.currentAnimation.length * MILLIS_BETWEEN_TICKS / ANIMATIONS_PER_TICK
		})
	}

	public listenSelectedEntities(callback?: (entities: Set<Entity & SelectableComponent>) => void): void {
		(this.selectedEntitiesCallback = callback ?? doNothingCallback)(this.selectedEntities)
	}
}

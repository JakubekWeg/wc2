import React from 'react'
import {
	AnimatableDrawableComponent,
	DelayedHideComponent,
	PlayerCommand,
	PlayerCommandTakerComponent,
	PredefinedDrawableComponent,
	SelectableComponent,
	SelectionStatus,
} from '../../game/ecs/components'
import { Variant } from '../../game/ecs/variant'
import { Entity, EntityType } from '../../game/ecs/world'
import { ANIMATIONS_PER_TICK, GameInstanceImpl, MILLIS_BETWEEN_TICKS } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { CanvasMouseEvent } from './GameCanvas'

export interface FrontendController {
	readonly game: GameInstanceImpl

	mouseEvent(e: CanvasMouseEvent): void
}

export const FrontedControllerContext = React.createContext<FrontendController>({} as unknown as FrontendController)

export class EditorFrontedController implements FrontendController {
	public readonly variantsToPlace: [Variant, Variant, Variant]
	public readonly entitiesToPickFrom: EntityType[]
	public entityToSpawn: EntityType
	public openedSelector: number = -1

	private selectedEntities: Set<Entity & SelectableComponent> = new Set()

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

	resetSelectedEntities() {
		for (const e of this.selectedEntities)
			e.selectionStatus = SelectionStatus.UnSelected
		this.selectedEntities.clear()
	}

	setSelectedEntities(list: Iterable<Entity & SelectableComponent>) {
		this.resetSelectedEntities()
		for (const e of list) {
			e.selectionStatus = SelectionStatus.SelectedEditor
			this.selectedEntities.add(e)
		}
	}

	handleMouseAction(tileX: number, tileY: number) {
		const command = {
			targetX: tileX,
			targetY: tileY,
			type: 'go',
		} as PlayerCommand

		for (const entity of this.selectedEntities) {
			this.game.dispatchNextTick(() => {
				const taker = (entity as unknown as PlayerCommandTakerComponent)
				if (taker.canAcceptCommands) {
					taker.myCurrentState?.get()?.handleCommand(command, this.game)
				}
			})
		}
		this.game.dispatchNextTick(world => {
			const entity = world.spawnEntity('cross') as unknown as PredefinedDrawableComponent & DelayedHideComponent & AnimatableDrawableComponent
			entity.destinationDrawX = tileX * 32
			entity.destinationDrawY = tileY * 32
			entity.hideMeAtMillis = Date.now() + entity.currentAnimation.length * MILLIS_BETWEEN_TICKS / ANIMATIONS_PER_TICK
			console.log(entity)
		})
	}
}

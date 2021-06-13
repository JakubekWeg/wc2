import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { facingDirectionFromAngle } from '../../misc/facing-direction'
import { registry } from '../../misc/resources-manager'
import {
	ComponentNameType,
	DamageableComponent, PossibleAttackTarget,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	SelfLifecycleObserverComponent,
	StateMachineHolderComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
	UpdateContext,
} from '../components'
import { Tile } from '../systems/tiles-system'
import { Entity } from '../world'
import { ArrowImpl } from './arrow'


export class GuardTowerImpl extends Entity
	implements PredefinedDrawableComponent, TilesIncumbentComponent, TileListenerComponent, SelfLifecycleObserverComponent, StateMachineHolderComponent, DamageableComponent {
	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'TilesIncumbentComponent', 'TileListenerComponent', 'SelfLifecycleObserverComponent', 'StateMachineHolderComponent', 'DamageableComponent'])

	myTeamId: number = 0
	destinationDrawX: number = 0
	destinationDrawY: number = 0
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteSize: number = 32 * 2
	tileOccupySize: number = 2
	mostWestTile: number = 0
	mostNorthTile: number = 0
	texture: CanvasImageSource = registry[4]
	render = PredefinedDrawableComponent_render
	subscribedToTiles: Set<Tile> = new Set()
	hitBoxCenterX: number = 0
	hitBoxCenterY: number = 0

	public entitiesWithinRange: Set<PossibleAttackTarget> = new Set()
	public reloading: number = 0

	onListenedTileOccupationChanged(listener: Entity & TileListenerComponent,
	                                tile: Tile,
	                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
	                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined): void {
		if (occupiedByPrevious != null)
			this.entitiesWithinRange.delete(occupiedByPrevious as unknown as PossibleAttackTarget)

		if (occupiedByNow != null) {
			const teamId = (occupiedByNow as unknown as PossibleAttackTarget).myTeamId
			if (teamId !== undefined && teamId !== this.myTeamId) {
				this.entitiesWithinRange.add(occupiedByNow as PossibleAttackTarget)
			}
		}
	}

	entityCreated(game: GameInstance): void {
		const size = 8
		const selfSize = this.tileOccupySize
		game.tiles.addListenersForRect(
			this.mostWestTile - size,
			this.mostNorthTile - size,
			size, size * 2+ selfSize, this)
		game.tiles.addListenersForRect(
			this.mostWestTile + selfSize,
			this.mostNorthTile - size,
			size, size * selfSize + selfSize, this)
		game.tiles.addListenersForRect(
			this.mostWestTile,
			this.mostNorthTile - size,
			size, size, this)
		game.tiles.addListenersForRect(
			this.mostWestTile,
			this.mostNorthTile + selfSize,
			size, size, this)
	}

	entityRemoved(game: GameInstance): void {
	}

	updateState(ctx: UpdateContext) {
		if (--this.reloading <= 0) {
			this.reloading = 10
			const entity: PossibleAttackTarget = this.entitiesWithinRange.values().next().value
			if (entity == null) return
			// shoot it!
			ArrowImpl.spawn(ctx.world, this, entity)
		}
	}
}

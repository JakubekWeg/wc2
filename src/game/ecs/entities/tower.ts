// import { GameInstance } from '../../game-instance'
// import { registry } from '../../misc/resources-manager'
// import {
// 	ComponentNameType,
// 	DamageableComponent,
// 	PossibleAttackTarget,
// 	PredefinedDrawableComponent,
// 	PredefinedDrawableComponent_render,
// 	SelfLifecycleObserverComponent,
// 	StateMachineHolderComponent,
// 	TileListenerComponent,
// 	TilesIncumbentComponent,
// 	GameInstance,
// } from '../components'
// import { Force, neutralForce } from '../force'
// import { Tile } from '../systems/tiles-system'
// import { Entity } from '../world'
// import { ArrowImpl } from './arrow'
//
//
// export class GuardTowerImpl extends Entity
// 	implements PredefinedDrawableComponent, TilesIncumbentComponent, TileListenerComponent, SelfLifecycleObserverComponent, StateMachineHolderComponent, DamageableComponent {
// 	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'TilesIncumbentComponent', 'TileListenerComponent', 'SelfLifecycleObserverComponent', 'StateMachineHolderComponent', 'DamageableComponent'])
//
// 	myForce: Force = neutralForce
// 	destinationDrawX: number = 0
// 	destinationDrawY: number = 0
// 	sourceDrawX: number = 0
// 	sourceDrawY: number = 0
// 	spriteSize: number = 32 * 2
// 	tileOccupySize: number = 2
// 	mostWestTile: number = 0
// 	mostNorthTile: number = 0
// 	texture: CanvasImageSource = registry[4]
// 	render = PredefinedDrawableComponent_render
// 	subscribedToTiles: Set<Tile> = new Set()
// 	hitBoxCenterX: number = 0
// 	hitBoxCenterY: number = 0
//
// 	public entitiesWithinRange: Set<PossibleAttackTarget> = new Set()
// 	public reloading: number = 0
//
// 	onListenedTileOccupationChanged(listener: Entity & TileListenerComponent,
// 	                                tile: Tile,
// 	                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
// 	                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined): void {
// 		if (occupiedByPrevious != null)
// 			this.entitiesWithinRange.delete(occupiedByPrevious as unknown as PossibleAttackTarget)
//
// 		if (occupiedByNow != null) {
// 			const teamId = (occupiedByNow as unknown as PossibleAttackTarget).myForce
// 			if (teamId !== undefined && teamId !== this.myForce) {
// 				this.entitiesWithinRange.add(occupiedByNow as PossibleAttackTarget)
// 			}
// 		}
// 	}
//
// 	entityCreated(game: GameInstance): void {
// 		const size = 4
// 		const selfSize = this.tileOccupySize
// 		// game.tiles.addListenersForRect(
// 		// 	this.mostWestTile - size,
// 		// 	this.mostNorthTile - size,
// 		// 	size, size * 2 + selfSize, this)
// 		// game.tiles.addListenersForRect(
// 		// 	this.mostWestTile + selfSize,
// 		// 	this.mostNorthTile - size,
// 		// 	size, size * selfSize + selfSize, this)
// 		// game.tiles.addListenersForRect(
// 		// 	this.mostWestTile,
// 		// 	this.mostNorthTile - size,
// 		// 	size, size, this)
// 		// game.tiles.addListenersForRect(
// 		// 	this.mostWestTile,
// 		// 	this.mostNorthTile + selfSize,
// 		// 	size, size, this)
// 		const entity = this
// 		entity.entitiesWithinRange = game.tiles.addListenersForRectAndGet(
// 			entity.mostWestTile - size,
// 			entity.mostNorthTile - size,
// 			size + size + selfSize,
// 			size + size + selfSize,
// 			entity, (obj => {
// 			const teamId = (obj as unknown as PossibleAttackTarget).myForce
// 			return teamId !== undefined && teamId !== entity.myForce
// 		}))
// 	}
//
// 	entityRemoved(game: GameInstance): void {
// 	}
//
// 	updateState(ctx: GameInstance) {
// 		if (--this.reloading <= 0) {
// 			this.reloading = 10
// 			const entity: PossibleAttackTarget = this.entitiesWithinRange.values().next().value
// 			if (entity == null) return
// 			// shoot it!
// 			ArrowImpl.spawn(ctx.world, this, entity)
// 		}
// 	}
// }
export {}

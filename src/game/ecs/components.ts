import Config from '../../config/config'
import { Force } from '../forces-manager'
import { GameInstanceImpl } from '../game-instance'
import { AnimationFrames } from './entities/common'
import { State, StateController } from './states/state'
import { Tile } from './systems/tiles-system'
import World, { Entity } from './world'

export type ComponentNameType =
	'DrawableBaseComponent'
	| 'StateMachineHolderComponent'
	| 'MovingDrawableComponent'
	| 'AnimatableDrawableComponent'
	| 'TilesIncumbentComponent'
	| 'TileListenerComponent'
	| 'SelfLifecycleObserverComponent'
	| 'DelayedHideComponent'
	| 'DamageableComponent'
	| 'PlayerCommandTakerComponent'
	| 'SightComponent'
	| 'AttackComponent'
	| 'UnitAnimationsComponent'
	| 'MovingUnitComponent'
	| 'SerializableComponent'

export type RenderFunction = (ctx: CanvasRenderingContext2D) => void

/**
 * Component for rendering anything on the screen
 */
export interface DrawableBaseComponent {
	render: RenderFunction
}

/**
 * Component for rendering drawable on the screen that may change it's properties, but they are defined
 */
export interface PredefinedDrawableComponent extends DrawableBaseComponent {
	texture: CanvasImageSource
	destinationDrawX: number
	destinationDrawY: number
	sourceDrawX: number
	sourceDrawY: number
	spriteSize: number
}

/**
 * Component for rendering drawable that moves with at user render framerate
 */
export interface MovingDrawableComponent extends PredefinedDrawableComponent {
	spriteVelocityX: number
	spriteVelocityY: number
}

/**
 * Component for automatic hiding a drawable component when a some about of time passes (in millis)
 */
export interface DelayedHideComponent extends DrawableBaseComponent {
	hideMeAtMillis: number
}

export const PredefinedDrawableComponent_render: RenderFunction = function (this: PredefinedDrawableComponent, ctx: CanvasRenderingContext2D) {
	const size = this.spriteSize
	ctx.drawImage(this.texture,
		this.sourceDrawX, this.sourceDrawY,
		size, size,
		this.destinationDrawX, this.destinationDrawY,
		size, size)
}

export interface AnimatableDrawableComponent extends PredefinedDrawableComponent {
	currentAnimationFrame: number
	currentAnimation: AnimationFrames
}

export interface MovingUnitComponent extends TilesIncumbentComponent {
	unitMovingSpeed: number
}

export interface UnitAnimationsComponent extends AnimatableDrawableComponent, MovingUnitComponent {
	standingAnimation: AnimationFrames
	walkingAnimation: AnimationFrames
	attackingAnimation: AnimationFrames
}

/**
 * Component for entities that needs to be updated every frame
 */
export interface StateMachineHolderComponent<T extends State = State> {
	myCurrentState: StateController<T>
}


/**
 * Component for entities that may occupy tiles
 */
export interface TilesIncumbentComponent {
	mostWestTile: number
	mostNorthTile: number
	tileOccupySize: number
}

export type PossibleAttackTarget = Entity & TilesIncumbentComponent & DamageableComponent

/**
 * Component for entities that can accept damage and do belong to a force (team)
 */
export interface DamageableComponent {
	myForce: Force
	readonly hitBoxCenterX: number
	readonly hitBoxCenterY: number
}

/**
 * Component for entities that can see a world and other entities
 */
export interface SightComponent extends TilesIncumbentComponent {
	sightAmount: number
}

/**
 * Component for entities that can deal damage
 */
export interface AttackComponent extends TilesIncumbentComponent, DamageableComponent {
	attackRangeAmount: number
	reloadDuration: number
	loadDuration: number
}

export type TileOccupationChangedCallback = (listener: Entity & TileListenerComponent,
                                             tile: Tile,
                                             occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
                                             occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) => void

/**
 * Component for entities that receive tile updates
 */
export interface TileListenerComponent {
	subscribedToTiles: Set<Tile>
	onListenedTileOccupationChanged: TileOccupationChangedCallback
}

/**
 * Component for entities that want to execute custom code after they are initialized and before they are removed
 */
export interface SelfLifecycleObserverComponent {
	entityCreated(game: GameInstanceImpl): void

	entityRemoved(game: GameInstanceImpl): void
}

export type PlayerCommandType = 'go'

export interface PlayerCommand {
	type: PlayerCommandType
	targetX: number
	targetY: number
}

/**
 * Component for entities that may be ordered by player to do certain action like go, stop, attack etc
 */
export interface PlayerCommandTakerComponent extends StateMachineHolderComponent {
	canAcceptCommands: true
}

export interface DeserializationUnitContext {
	game: GameInstanceImpl,
	world: World,
}

/**
 * Component for entities that may be serialized and deserialized
 */
export interface SerializableComponent {
	serializeToJson(): unknown

	deserializeFromObject(data: Config): void

	postSetup(ctx: DeserializationUnitContext, data: Config): void
}

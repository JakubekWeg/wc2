import Config from '../../../config/config'
import { Force, neutralForce } from '../../forces-manager'
import { ResourcesManager } from '../../misc/resources-manager'
import {
	AnimatableDrawableComponent,
	AttackComponent,
	ComponentNameType,
	DamageableComponent,
	DeserializationUnitContext,
	MovingDrawableComponent,
	MovingUnitComponent,
	PlayerCommandTakerComponent,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	SerializableComponent,
	SightComponent,
	StateMachineHolderComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
	UnitAnimationsComponent,
} from '../components'
import '../states/basic-unit-ai'
import { createAiState } from '../states/critter-ai'
import '../states/critter-ai'
import { createState, deserializeUnitState, nullState } from '../states/state'
import { Tile } from '../systems/tiles-system'
import { Entity, EntityType } from '../world'
import { AnimationFrames } from './common'


export type UnitPrototype = Entity & (
	PredefinedDrawableComponent & StateMachineHolderComponent &
	MovingDrawableComponent & AnimatableDrawableComponent &
	TilesIncumbentComponent & DamageableComponent &
	PlayerCommandTakerComponent & TileListenerComponent &
	AttackComponent & SightComponent
	& UnitAnimationsComponent & MovingUnitComponent
	& SerializableComponent)


const createTypeForUnit = (prototypeId: string, description: Config, mgr: ResourcesManager): () => Entity => {

	const data = description.child('prototypeData')
	const unitMovingSpeed = data.requirePositiveInt('unitMovingSpeed')
	const attackRangeAmount = data.requirePositiveInt('attackRangeAmount')
	const sightAmount = data.requirePositiveInt('sightAmount')
	const reloadTicks = data.requirePositiveInt('reloadDuration')
	const firstLoadTicks = data.requirePositiveInt('firstAttackLoadDuration')
	const {image, spriteSize} = mgr.getEntry(data.requireString('texture'))
	const walkingAnimation = data.child('animations/walk').getAsNotEmptyListOfNonNegativeIntegers()
	const standingAnimation = data.child('animations/stand').getAsNotEmptyListOfNonNegativeIntegers()
	const attackingAnimation = data.child('animations/attack').getAsNotEmptyListOfNonNegativeIntegers()

	const UnitClass = class extends Entity implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent,
		TilesIncumbentComponent, DamageableComponent,
		PlayerCommandTakerComponent, TileListenerComponent,
		AttackComponent, SightComponent
		, UnitAnimationsComponent, MovingUnitComponent, SerializableComponent {


		destinationDrawX: number = 0
		destinationDrawY: number = 0
		assignedToChunkId: number = -1
		sourceDrawX: number = 0
		sourceDrawY: number = 0
		spriteVelocityX: number = 0
		spriteVelocityY: number = 0
		currentAnimationFrame: number = 0
		myForce: Force = neutralForce
		currentAnimation: AnimationFrames = standingAnimation
		mostWestTile: number = 0
		mostNorthTile: number = 0
		canAcceptCommands: true = true
		tileOccupySize: number = 1
		subscribedToTiles: Set<Tile> = new Set()

		reloadDuration: number = reloadTicks
		loadDuration: number = firstLoadTicks
		spriteSize: number = spriteSize
		unitMovingSpeed: number = unitMovingSpeed
		sightAmount: number = sightAmount
		attackRangeAmount: number = attackRangeAmount
		texture: CanvasImageSource = image

		walkingAnimation: AnimationFrames = walkingAnimation
		standingAnimation: AnimationFrames = standingAnimation
		attackingAnimation: AnimationFrames = attackingAnimation

		render = PredefinedDrawableComponent_render
		myCurrentState = nullState()

		get hitBoxCenterX(): number {
			return this.mostWestTile + 0.5
		}

		get hitBoxCenterY(): number {
			return this.mostNorthTile + 0.5
		}

		onListenedTileOccupationChanged(_: Entity & TileListenerComponent,
		                                tile: Tile,
		                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
		                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) {
			if (occupiedByPrevious != null)
				this.myCurrentState.get().entityLeftSightRange?.(occupiedByPrevious)

			if (occupiedByNow != null)
				this.myCurrentState.get().entityEnteredSightRange?.(occupiedByNow)
		}

		serializeToJson(): unknown {
			return {
				prototype: prototypeId,
				x: this.mostWestTile,
				y: this.mostNorthTile,
				force: this.myForce.id,
				state: this.myCurrentState.serializeToJson(),
			}
		}

		deserializeFromObject(data: Config): void {
			this.mostWestTile = data.requireInt('x')
			this.mostNorthTile = data.requireInt('y')
			this.destinationDrawX = this.mostWestTile * 32 - (32 - this.spriteSize) / 2
			this.destinationDrawY = this.mostNorthTile * 32 - (32 - this.spriteSize) / 2
			this.myCurrentState = nullState()
		}

		postSetup(ctx: DeserializationUnitContext, data: Config): void {
			this.myForce = ctx.game.forces.getForce(data.requireInt('force'))
			this.myCurrentState = deserializeUnitState(this, ctx.game, ctx.world, data.child('state'))
		}
	}

	return () => {
		const entity = new UnitClass()
		entity.myCurrentState = createState(c => createAiState(entity, c))
		return entity
	}
}


export const createEntityType = (id: string, description: Config, mgr: ResourcesManager): EntityType => {
	let spawner: any

	const proto = description.requireString('prototype')
	switch (proto) {
		case 'unit':
			spawner = createTypeForUnit(id, description, mgr)
			break
		default:
			throw new Error('Invalid entity prototype ' + proto)
	}


	return {
		id,
		spawn: spawner,
		componentNames: new Set<ComponentNameType>(['PredefinedDrawableComponent', 'SerializableComponent', 'AttackComponent', 'SightComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent']),
	}
}



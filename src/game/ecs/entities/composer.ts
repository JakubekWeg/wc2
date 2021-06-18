import { registry } from '../../misc/resources-manager'
import {
	AnimatableDrawableComponent,
	AttackRangeComponent,
	ComponentNameType,
	DamageableComponent, DeserializationUnitContext,
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
import { Force, neutralForce } from '../force'
import { createAiState } from '../states/basic-unit-ai'
import { createState, deserializeUnitState, nullState, StateDeserializeContext } from '../states/state'
import { Tile } from '../systems/tiles-system'
import { Entity, EntityType } from '../world'
import {
	AnimationFrames,
	standardArcherAttackingAnimationFrames,
	standardStandingAnimationFrames,
	standardWalkingAnimationFrames,
} from './common'


export type UnitPrototype = Entity & (
	PredefinedDrawableComponent & StateMachineHolderComponent &
	MovingDrawableComponent & AnimatableDrawableComponent &
	TilesIncumbentComponent & DamageableComponent &
	PlayerCommandTakerComponent & TileListenerComponent &
	AttackRangeComponent & SightComponent
	& UnitAnimationsComponent & MovingUnitComponent
	& SerializableComponent)

const requirePositiveInt = (description: any, key: string): number => {
	const value = description[key]
	if (typeof value !== 'number' || value !== (value | 0) || value <= 0)
		throw new Error(`Excepted positive integer in config file key=${key}, got value=${value}`)
	return value
}

const createTypeForUnit = (prototypeId: string, description: any): () => Entity => {

	const data = description.prototypeData
	const spriteSize = requirePositiveInt(data, 'spriteSize')
	const unitMovingSpeed = requirePositiveInt(data, 'unitMovingSpeed')
	const attackRangeAmount = requirePositiveInt(data, 'attackRangeAmount')
	const sightAmount = requirePositiveInt(data, 'sightAmount')

	const UnitClass = class extends Entity implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent,
		TilesIncumbentComponent, DamageableComponent,
		PlayerCommandTakerComponent, TileListenerComponent,
		AttackRangeComponent, SightComponent
		, UnitAnimationsComponent, MovingUnitComponent, SerializableComponent {

		destinationDrawX: number = -18
		destinationDrawY: number = -18
		sourceDrawX: number = 0
		sourceDrawY: number = 0
		spriteVelocityX: number = 0
		spriteVelocityY: number = 0
		currentAnimationFrame: number = 0
		myForce: Force = neutralForce
		currentAnimation: AnimationFrames = standardStandingAnimationFrames
		mostWestTile: number = 0
		mostNorthTile: number = 0
		canAcceptCommands: true = true
		tileOccupySize: number = 1
		subscribedToTiles: Set<Tile> = new Set()

		spriteSize: number = spriteSize
		unitMovingSpeed: number = unitMovingSpeed
		sightAmount: number = sightAmount
		attackRangeAmount: number = attackRangeAmount
		texture: CanvasImageSource = registry[0]

		walkingAnimation: AnimationFrames = standardWalkingAnimationFrames
		standingAnimation: AnimationFrames = standardStandingAnimationFrames
		attackingAnimation: AnimationFrames = standardArcherAttackingAnimationFrames

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

		deserializeFromJson(data: any): void {
			this.mostWestTile = data.x
			this.mostNorthTile = data.y
			this.myCurrentState = nullState()
		}

		postSetup(ctx: DeserializationUnitContext, data: any): void {
			this.destinationDrawX = this.mostWestTile * 32 - 18
			this.destinationDrawY = this.mostNorthTile * 32 - 18
			this.myCurrentState = deserializeUnitState(this, ctx.game, ctx.world, data.state)
		}
	}

	return () => {
		const entity = new UnitClass()
		entity.myCurrentState = createState(c => createAiState(entity, c))
		return entity
	}
}


export const createEntityType = (id: string, description: any): EntityType => {
	if (typeof description !== 'object')
		throw new Error('Description must be an object')

	let spawner: any

	switch (description.prototype) {
		case 'unit':
			spawner = createTypeForUnit(id, description)
			break
		default:
			throw new Error('Invalid entity prototype ' + description.prototype)
	}


	return {
		id,
		spawn: spawner,
		componentNames: new Set<ComponentNameType>(['SerializableComponent', 'AttackRangeComponent', 'SightComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent']),
	}
}



import Config from '../../../config/config'
import { ComposedFunction, composeFunction } from '../../misc/functions-composer'
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
	SerializableComponent,
	SightComponent,
	StateMachineHolderComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
	UnitAnimationsComponent,
} from '../components'
import { Entity, EntityType } from '../world'
import { createTypeForBuilding, createTypeForUnit, doNothingCallback } from './common'


export type UnitPrototype = Entity & (
	PredefinedDrawableComponent & StateMachineHolderComponent &
	MovingDrawableComponent & AnimatableDrawableComponent &
	TilesIncumbentComponent & DamageableComponent &
	PlayerCommandTakerComponent & TileListenerComponent &
	AttackComponent & SightComponent
	& UnitAnimationsComponent & MovingUnitComponent
	& SerializableComponent)

// const createTypeForUnit = (prototypeId: string, description: Config, mgr: ResourcesManager): [() => Entity, any] => {
//
// 	const data = description.child('prototypeData')
// 	const unitMovingSpeed = data.requirePositiveInt('unitMovingSpeed')
// 	const attackRangeAmount = data.requirePositiveInt('attackRangeAmount')
// 	const sightAmount = data.requirePositiveInt('sightAmount')
// 	const reloadTicks = data.requirePositiveInt('reloadDuration')
// 	const firstLoadTicks = data.requirePositiveInt('firstAttackLoadDuration')
// 	const {image, spriteSize} = mgr.getEntry(data.requireString('texture'))
// 	const walkingAnimation = data.child('animations/walk').getAsNotEmptyListOfNonNegativeIntegers()
// 	const standingAnimation = data.child('animations/stand').getAsNotEmptyListOfNonNegativeIntegers()
// 	const attackingAnimation = data.child('animations/attack').getAsNotEmptyListOfNonNegativeIntegers()
//
// 	const UnitClass = class extends Entity implements PredefinedDrawableComponent, StateMachineHolderComponent,
// 		MovingDrawableComponent, AnimatableDrawableComponent,
// 		TilesIncumbentComponent, DamageableComponent,
// 		PlayerCommandTakerComponent, TileListenerComponent,
// 		AttackComponent, SightComponent
// 		, UnitAnimationsComponent, MovingUnitComponent, SerializableComponent {
//
//
// 		destinationDrawX: number = 0
// 		destinationDrawY: number = 0
// 		assignedToChunkId: number = -1
// 		sourceDrawX: number = 0
// 		sourceDrawY: number = 0
// 		spriteVelocityX: number = 0
// 		spriteVelocityY: number = 0
// 		currentAnimationFrame: number = 0
// 		myForce: Force = neutralForce
// 		currentAnimation: AnimationFrames = standingAnimation
// 		mostWestTile: number = 0
// 		mostNorthTile: number = 0
// 		canAcceptCommands: true = true
// 		tileOccupySize: number = 1
// 		subscribedToTiles: Set<Tile> = new Set()
//
// 		reloadDuration: number = reloadTicks
// 		loadDuration: number = firstLoadTicks
// 		spriteSize: number = spriteSize
// 		unitMovingSpeed: number = unitMovingSpeed
// 		sightAmount: number = sightAmount
// 		attackRangeAmount: number = attackRangeAmount
// 		texture: CanvasImageSource = image
//
// 		walkingAnimation: AnimationFrames = walkingAnimation
// 		standingAnimation: AnimationFrames = standingAnimation
// 		attackingAnimation: AnimationFrames = attackingAnimation
//
// 		render = PredefinedDrawableComponent_render
// 		myCurrentState = nullState()
//
// 		get hitBoxCenterX(): number {
// 			return this.mostWestTile + 0.5
// 		}
//
// 		get hitBoxCenterY(): number {
// 			return this.mostNorthTile + 0.5
// 		}
//
// 		onListenedTileOccupationChanged(_: Entity & TileListenerComponent,
// 		                                tile: Tile,
// 		                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
// 		                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) {
// 			if (occupiedByPrevious != null)
// 				this.myCurrentState.get().entityLeftSightRange?.(occupiedByPrevious)
//
// 			if (occupiedByNow != null)
// 				this.myCurrentState.get().entityEnteredSightRange?.(occupiedByNow)
// 		}
//
// 		serializeToJson(): unknown {
// 			return {
// 				prototype: prototypeId,
// 				x: this.mostWestTile,
// 				y: this.mostNorthTile,
// 				force: this.myForce.id,
// 				state: this.myCurrentState.serializeToJson(),
// 			}
// 		}
//
// 		deserializeFromObject(data: Config): void {
// 			this.mostWestTile = data.requireInt('x')
// 			this.mostNorthTile = data.requireInt('y')
// 			this.destinationDrawX = this.mostWestTile * 32 - (32 - this.spriteSize) / 2
// 			this.destinationDrawY = this.mostNorthTile * 32 - (32 - this.spriteSize) / 2
// 			this.myCurrentState = nullState()
// 		}
//
// 		postSetup(ctx: DeserializationUnitContext, data: Config): void {
// 			this.myForce = ctx.game.forces.getForce(data.requireInt('force'))
// 			this.myCurrentState = deserializeUnitState(this, ctx.game, ctx.world, data.child('state'))
// 		}
// 	}
//
// 	return [() => {
// 		const entity = new UnitClass()
// 		entity.myCurrentState = createState(c => createAiState(entity, c))
// 		return entity
// 	},
// 		new Set<ComponentNameType>(['PredefinedDrawableComponent', 'SerializableComponent', 'AttackComponent', 'SightComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent'])]
// }


export interface EntityRegistrationRequest {
	id: string,
	data: Config,
	entity: Entity
	resources: ResourcesManager
	fork: ComposedFunction<Entity>
	serialize: ComposedFunction<Entity, any>,
	deserialize: ComposedFunction<Entity, Config>,
	postSetup: ComposedFunction<Entity, DeserializationUnitContext, Config>,
	components: Set<ComponentNameType>
}

export interface EntityRegistrationResult {
	components: Set<ComponentNameType>
	spawn: () => Entity
}


export const createEntityType = (id: string, description: Config, mgr: ResourcesManager): EntityType => {
	let result: EntityRegistrationResult | undefined

	const proto = description.requireString('prototype')
	const request = {
		id,
		entity: new Entity(),
		data: description.child('prototypeData'),
		resources: mgr,
		fork: composeFunction(doNothingCallback),
		components: new Set(),

		serialize: composeFunction(doNothingCallback),
		deserialize: composeFunction(doNothingCallback),
		postSetup: composeFunction(doNothingCallback),
	} as EntityRegistrationRequest

	switch (proto) {
		case 'unit':
			result = createTypeForUnit(request)
			break
		case 'building':
			result = createTypeForBuilding(request)
			break
	}

	if (result == null)
		throw new Error('Invalid entity prototype ' + proto)


	return {
		id,
		spawn: result.spawn,
		componentNames: result.components,
	}
}



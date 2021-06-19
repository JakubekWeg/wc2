import Config from '../../../config/config'
import { registry, ResourcesManager } from '../../misc/resources-manager'
import {
	AnimatableDrawableComponent,
	AttackRangeComponent,
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
import { Force, neutralForce } from '../force'
import { createAiState } from '../states/basic-unit-ai'
import { createState, deserializeUnitState, nullState } from '../states/state'
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


const createTypeForUnit = (prototypeId: string, description: Config, mgr: ResourcesManager): () => Entity => {

	const data = description.child('prototypeData')
	const unitMovingSpeed = data.requirePositiveInt('unitMovingSpeed')
	const attackRangeAmount = data.requirePositiveInt('attackRangeAmount')
	const sightAmount = data.requirePositiveInt('sightAmount')
	const {image, spriteSize} = mgr.getEntry(data.requireString('texture'))

	const UnitClass = class extends Entity implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent,
		TilesIncumbentComponent, DamageableComponent,
		PlayerCommandTakerComponent, TileListenerComponent,
		AttackRangeComponent, SightComponent
		, UnitAnimationsComponent, MovingUnitComponent, SerializableComponent {

		destinationDrawX: number = -spriteSize / 4
		destinationDrawY: number = -spriteSize / 4
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
		texture: CanvasImageSource = image

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

		deserializeFromObject(data: Config): void {
			this.mostWestTile = data.requireInt('x')
			this.mostNorthTile = data.requireInt('y')
			this.myCurrentState = nullState()
		}

		postSetup(ctx: DeserializationUnitContext, data: Config): void {
			this.destinationDrawX = this.mostWestTile * 32 - 18
			this.destinationDrawY = this.mostNorthTile * 32 - 18
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
		componentNames: new Set<ComponentNameType>(['SerializableComponent', 'AttackRangeComponent', 'SightComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent']),
	}
}



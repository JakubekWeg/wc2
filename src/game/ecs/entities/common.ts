import { neutralForce } from '../../forces-manager'
import { EntityColor } from '../../misc/colors-palette'
import { composeFunction } from '../../misc/functions-composer'
import {
	AnimatableDrawableComponent,
	AttackComponent,
	DamageableComponent, DelayedHideComponent,
	IconComponent,
	MovingDrawableComponent,
	MovingUnitComponent, PlayerCommandTakerComponent,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	SelectableComponent,
	SelectionStatus,
	SerializableComponent,
	SightComponent,
	StateMachineHolderComponent, TicksToLiveComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
	UnitAnimationsComponent,
} from '../components'
import '../states/basic-unit-ai'
import '../states/critter-ai'
import { createState, deserializeUnitState, getRootStateByAiName, nullState } from '../states/state'
import { Tile } from '../systems/tiles-system'
import { Entity } from '../world'
import { EntityRegistrationRequest, EntityRegistrationResult } from './composer'

export type AnimationFrames = number[]

export const doNothingCallback = () => {
}

export const isInRectRange2 = (px: number, py: number, l: number, t: number, r: number, b: number): boolean => {
	return px >= l && px < r && py >= t && py < b
}

const forceAddSerializableComponent = (req: EntityRegistrationRequest) => {
	req.components.add('SerializableComponent')
	const obj = req.entity as unknown as SerializableComponent

	const prototype = req.id
	req.serialize = composeFunction((_, obj) => obj.prototype = prototype)

	// this can be optimized
	obj.serializeToJson = function (this: Entity) {
		const tmp = {}
		req.serialize(this, tmp)
		return tmp
	}
	obj.deserializeFromObject = function (obj) {
		req.deserialize(this, obj)
	}
	obj.postSetup = function (ctx, obj) {
		req.postSetup(this, ctx, obj)
	}
}

const forceAddIconComponent = (req: EntityRegistrationRequest) => {
	req.components.add('IconComponent')
	const obj = req.entity as unknown as IconComponent

	obj.iconIndex = req.data.requireInt('iconIndex')
}

const forceAddPredefinedDrawableComponent = (req: EntityRegistrationRequest) => {
	req.components.add('DrawableBaseComponent')
	req.components.add('PredefinedDrawableComponent')
	const isDamageable = req.components.has('DamageableComponent')
	const obj = req.entity as unknown as PredefinedDrawableComponent

	const entry = req.resources.getEntry(req.data.requireString('texture'))

	obj.sourceDrawX = obj.sourceDrawY = obj.destinationDrawY = obj.destinationDrawX = 0
	obj.assignedToChunkId = -1
	obj.spriteSize = entry.spriteSize
	obj.paintedTexturesSet = entry.paintedImages
	if (isDamageable)
		obj.texture = entry.paintedImages[0]
	else
		obj.texture = entry.defaultImage
	obj.render = PredefinedDrawableComponent_render

	if (isDamageable)
		req.postSetup.then((_e) => {
			const me = (_e as unknown as DamageableComponent)
			me.texture = entry.paintedImages[me.myColor]
		})
}
const forceAddDelayedHideComponent = (req: EntityRegistrationRequest) => {
	req.components.add('DelayedHideComponent')
	const obj = req.entity as unknown as DelayedHideComponent
	obj.hideMeAtMillis = 0
}

const forceAddSelectableComponent = (req: EntityRegistrationRequest) => {
	req.components.add('SelectableComponent')
	const obj = req.entity as unknown as SelectableComponent
	obj.selectionStatus = SelectionStatus.UnSelected
}

const forceAddTilesIncumbentComponent = (req: EntityRegistrationRequest, constantOccupySize?: number) => {
	req.components.add('TilesIncumbentComponent')
	const obj = req.entity as unknown as TilesIncumbentComponent & SerializableComponent

	obj.mostWestTile = obj.mostNorthTile = 0
	obj.tileOccupySize = constantOccupySize ?? req.data.requirePositiveInt('occupySize')

	req.serialize.then((e_, o) => {
		const e = e_ as unknown as TilesIncumbentComponent
		o.x = e.mostWestTile
		o.y = e.mostNorthTile
	})
	req.deserialize.then((e_, o) => {
		const e = e_ as unknown as TilesIncumbentComponent & PredefinedDrawableComponent
		e.mostWestTile = o.requireInt('x')
		e.mostNorthTile = o.requireInt('y')
		if (e.tileOccupySize === 1) {
			e.destinationDrawX = e.mostWestTile * 32 - (e.spriteSize - 32) / 2
			e.destinationDrawY = e.mostNorthTile * 32 - (e.spriteSize - 32) / 2
		} else {
			e.destinationDrawX = e.mostWestTile * 32
			e.destinationDrawY = e.mostNorthTile * 32
		}
	})

}
const addSightComponent = (req: EntityRegistrationRequest) => {
	const sight = req.data.getPositiveInt('sightAmount')
	if (sight === undefined) return

	req.components.add('SightComponent')
	const obj = req.entity as unknown as SightComponent

	obj.sightAmount = sight
}

export const addStateMachineComponent = (req: EntityRegistrationRequest) => {
	if (!req.components.has('SerializableComponent'))
		throw new Error('addStateMachineComponent requires SerializableComponent')

	const aiName = req.data.getString('ai')
	if (aiName === undefined) return
	req.components.add('StateMachineHolderComponent')
	const obj = req.entity as unknown as StateMachineHolderComponent & SerializableComponent
	obj.myCurrentState = nullState()
	const creator = getRootStateByAiName(aiName, req.components)

	req.fork.then((e) => {
		const entity = e as Entity & StateMachineHolderComponent
		entity.myCurrentState = createState(c => creator(entity, c))
	})
	req.serialize.then((e_, o) => {
		o.state = (e_ as unknown as StateMachineHolderComponent).myCurrentState.serializeToJson()
	})
	req.postSetup.then((e_, ctx, data) => {
		(e_ as unknown as StateMachineHolderComponent).myCurrentState = deserializeUnitState(e_, ctx.game, ctx.world, data.child('state'))
	})
}
export const addMovingComponent = (req: EntityRegistrationRequest) => {
	const speed = req.data.getPositiveInt('unitMovingSpeed')
	if (speed === undefined) return
	req.components.add('MovingUnitComponent')
	req.components.add('MovingDrawableComponent')
	const obj = req.entity as unknown as MovingDrawableComponent & MovingUnitComponent
	obj.spriteVelocityY = obj.spriteVelocityX = 0
	obj.unitMovingSpeed = speed
}

export const forceAddDamageableComponent = (req: EntityRegistrationRequest, staticHitBox: boolean) => {
	req.components.add('DamageableComponent')
	const obj = req.entity as unknown as DamageableComponent
	obj.myForce = neutralForce
	obj.myColor = EntityColor.Red

	if (staticHitBox) {
		obj.calculateHitBoxCenter = function (this: Entity & DamageableComponent & PredefinedDrawableComponent & TilesIncumbentComponent) {
			const hitBox: [number, number] = [this.mostWestTile + this.tileOccupySize / 2, this.mostNorthTile + this.tileOccupySize / 2]
			this.calculateHitBoxCenter = () => hitBox
			return hitBox
		}
	} else {
		obj.calculateHitBoxCenter = function (this: Entity & DamageableComponent & PredefinedDrawableComponent & TilesIncumbentComponent) {
			const hitBox: [number, number] = [this.mostWestTile + this.tileOccupySize / 2, this.mostNorthTile + this.tileOccupySize / 2]
			return hitBox
		}
	}

	req.serialize.then((e, o) => {
		const me = (e as unknown as DamageableComponent)
		o.force = me.myForce.id
		o.color = me.myColor
	})
	req.postSetup.then((e, ctx, o) => {
		const me = e as unknown as DamageableComponent
		me.myForce = ctx.game.forces.getForce(o.requireInt('force'))
		me.myColor = o.requireInt('color')
	})
}

export const addUnitAnimationComponent = (req: EntityRegistrationRequest) => {
	const {data} = req
	if (data.child('animations').getRawObject() == null)
		return
	req.components.add('AnimatableDrawableComponent')
	req.components.add('UnitAnimationsComponent')

	const entity = req.entity as unknown as AnimatableDrawableComponent & UnitAnimationsComponent

	entity.currentAnimation = entity.standingAnimation = entity.standingAnimation = data.child('animations/stand').getAsNotEmptyListOfNonNegativeIntegers()
	entity.walkingAnimation = data.child('animations/walk').getAsNotEmptyListOfNonNegativeIntegers()
	entity.attackingAnimation = data.child('animations/attack').getAsNotEmptyListOfNonNegativeIntegers()
	entity.currentAnimationFrame = 0
}
export const addAttackComponent = (req: EntityRegistrationRequest) => {
	const data = req.data.child('attack')
	if (data.getRawObject() == null)
		return
	req.components.add('AttackComponent')
	req.components.add('TileListenerComponent')

	const entity = req.entity as unknown as AttackComponent & TileListenerComponent

	entity.loadDuration = data.requirePositiveInt('firstDelay')
	entity.reloadDuration = data.requirePositiveInt('reloadDuration')
	entity.attackRangeAmount = data.requirePositiveInt('range')

	entity.onListenedTileOccupationChanged = function (this: AttackComponent & TileListenerComponent & StateMachineHolderComponent,
	                                                   _: Entity & TileListenerComponent,
	                                                   tile: Tile,
	                                                   occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
	                                                   occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) {
		const state = this.myCurrentState?.get()
		if (state == null) return
		if (occupiedByPrevious != null)
			state.entityLeftSightRange?.(occupiedByPrevious)

		if (occupiedByNow != null)
			state.entityEnteredSightRange?.(occupiedByNow)
	}
	entity.subscribedToTiles = new Set()

	req.fork.then((e) => (e as unknown as TileListenerComponent).subscribedToTiles = new Set())
}

export const forceAddPlayerCommandTakerComponent = (req: EntityRegistrationRequest) => {
	req.components.add('PlayerCommandTakerComponent')
	const entity = req.entity as unknown as PlayerCommandTakerComponent
	entity.canAcceptCommands = true
}

export const forceAddAnimatableDrawableComponent = (req: EntityRegistrationRequest) => {
	req.components.add('AnimatableDrawableComponent')
	const entity = req.entity as unknown as AnimatableDrawableComponent
	entity.currentAnimation = req.data.child('animation').getAsNotEmptyListOfNonNegativeIntegers()
	entity.currentAnimationFrame = 0
}

export const addTicksToLiveComponent = (req: EntityRegistrationRequest) => {
	const ticks = req.data.child('ticksToLive').getRawObject()
	if (ticks === undefined) return
	if (typeof ticks !== 'number') throw new Error(`Invalid ticksToLive value ${ticks}`)

	req.components.add('TicksToLiveComponent')
	const entity = req.entity as unknown as TicksToLiveComponent
	entity.removeMeAtTick = 0
	entity.ticksToLive = ticks
}

export const createTypeForBuilding = (req: EntityRegistrationRequest): EntityRegistrationResult => {
	forceAddSerializableComponent(req)
	forceAddDamageableComponent(req, true)
	forceAddPredefinedDrawableComponent(req)
	forceAddTilesIncumbentComponent(req)
	forceAddSelectableComponent(req)
	forceAddIconComponent(req)
	addSightComponent(req)
	addAttackComponent(req)
	addStateMachineComponent(req)
	forceAddPlayerCommandTakerComponent(req)
	addTicksToLiveComponent(req)

	const entity = req.entity
	const fork = req.fork
	return {
		components: req.components,
		spawn: () => {
			const tmp = {...entity}
			fork(tmp)
			return tmp
		},
		getTemplate: () => entity,
	} as EntityRegistrationResult
}


export const createTypeForUnit = (req: EntityRegistrationRequest): EntityRegistrationResult => {
	forceAddSerializableComponent(req)
	forceAddDamageableComponent(req, false)
	forceAddPredefinedDrawableComponent(req)
	forceAddSelectableComponent(req)
	forceAddTilesIncumbentComponent(req, 1)
	forceAddIconComponent(req)
	addSightComponent(req)
	addMovingComponent(req)
	addUnitAnimationComponent(req)
	addAttackComponent(req)
	forceAddPlayerCommandTakerComponent(req)
	addStateMachineComponent(req)
	addTicksToLiveComponent(req)

	const entity = req.entity
	const fork = req.fork
	return {
		components: req.components,
		spawn: () => {
			const tmp = {...entity}
			fork(tmp)
			return tmp
		},
		getTemplate: () => entity,
	} as EntityRegistrationResult
}


export const createTypeForEffect = (req: EntityRegistrationRequest): EntityRegistrationResult => {
	forceAddPredefinedDrawableComponent(req)
	forceAddDelayedHideComponent(req)
	forceAddAnimatableDrawableComponent(req)
	addTicksToLiveComponent(req)

	const entity = req.entity
	const fork = req.fork
	return {
		components: req.components,
		spawn: () => {
			const tmp = {...entity}
			fork(tmp)
			return tmp
		},
		getTemplate: () => entity,
	} as EntityRegistrationResult

}

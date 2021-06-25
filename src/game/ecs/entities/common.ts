import { neutralForce } from '../../forces-manager'
import { composeFunction } from '../../misc/functions-composer'
import {
	AnimatableDrawableComponent,
	AttackComponent,
	DamageableComponent,
	IconComponent,
	MovingDrawableComponent,
	MovingUnitComponent,
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
import '../states/critter-ai'
import { createState, deserializeUnitState, getRootStateByAiName, nullState } from '../states/state'
import { Tile } from '../systems/tiles-system'
import { Entity } from '../world'
import { EntityRegistrationRequest, EntityRegistrationResult } from './composer'

export type AnimationFrames = number[]

export const doNothingCallback = () => {
}

export const isInRectRange = (px: number, py: number, l: number, t: number, w: number, h: number): boolean => {
	return isInRectRange2(px, py, l, t, l + w, t + h)
}
export const isInRectRange2 = (px: number, py: number, l: number, t: number, r: number, b: number): boolean => {
	return px >= l && px < r && py >= t && py < b
}

// export const rectIntersectsOtherRect = (l1: number, t1: number, w1: number, h1: number,
//                                         l2: number, t2: number, w2: number, h2: number): boolean => {
//
// }

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
	const obj = req.entity as unknown as PredefinedDrawableComponent

	const {image, spriteSize} = req.resources.getEntry(req.data.requireString('texture'))

	obj.sourceDrawX = obj.sourceDrawY = obj.destinationDrawY = obj.destinationDrawX = 0
	obj.assignedToChunkId = -1
	obj.spriteSize = spriteSize
	obj.texture = image
	obj.render = PredefinedDrawableComponent_render
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
		// e.destinationDrawX = e.mostWestTile * 32 - (32 - e.spriteSize) / 2
		e.destinationDrawX = e.mostWestTile * 32
		// e.destinationDrawY = e.mostNorthTile * 32 - (32 - e.spriteSize) / 2
		e.destinationDrawY = e.mostNorthTile * 32
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
	if (!req.components.has('PredefinedDrawableComponent') || !req.components.has('TilesIncumbentComponent'))
		throw new Error('DamageableComponent requires PredefinedDrawableComponent and TilesIncumbentComponent')

	req.components.add('DamageableComponent')
	const obj = req.entity as unknown as DamageableComponent
	obj.myForce = neutralForce

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

	req.serialize.then((e, o) => o.myForce = (e as unknown as DamageableComponent).myForce.id)
	req.postSetup.then((e, ctx, o) => {
		(e as unknown as DamageableComponent).myForce = ctx.game.forces.getForce(o.requireInt('myForce'))
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

export const createTypeForBuilding = (req: EntityRegistrationRequest): EntityRegistrationResult => {
	forceAddSerializableComponent(req)
	forceAddPredefinedDrawableComponent(req)
	forceAddTilesIncumbentComponent(req)
	forceAddIconComponent(req)
	addSightComponent(req)
	forceAddDamageableComponent(req, true)
	addAttackComponent(req)
	addStateMachineComponent(req)

	const entity = req.entity
	const fork = req.fork
	return <EntityRegistrationResult>{
		components: req.components,
		spawn: () => {
			const tmp = {...entity}
			fork(tmp)
			return tmp
		},
		getTemplate: () => entity
	}
}


export const createTypeForUnit = (req: EntityRegistrationRequest): EntityRegistrationResult => {
	forceAddSerializableComponent(req)
	forceAddPredefinedDrawableComponent(req)
	forceAddTilesIncumbentComponent(req, 1)
	forceAddDamageableComponent(req, false)
	forceAddIconComponent(req)
	addSightComponent(req)
	addMovingComponent(req)
	addUnitAnimationComponent(req)
	addAttackComponent(req)
	addStateMachineComponent(req)

	const entity = req.entity
	const fork = req.fork
	return <EntityRegistrationResult>{
		components: req.components,
		spawn: () => {
			const tmp = {...entity}
			fork(tmp)
			return tmp
		},
		getTemplate: () => entity
	}

}

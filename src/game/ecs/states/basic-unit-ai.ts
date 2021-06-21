import Config from '../../../config/config'
import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionFromAngle, facingDirectionToVector } from '../../misc/facing-direction'
import { findPathDirectionsCoarse, findPathDirectionsCoarseRectDestination } from '../../misc/path-finder'
import { DebugPath, Renderer } from '../../renderer'
import {
	ComponentNameType,
	DamageableComponent,
	PlayerCommand,
	PossibleAttackTarget,
	TilesIncumbentComponent,
} from '../components'
import { isInRectRange } from '../entities/common'
import { UnitPrototype } from '../entities/composer'
import { Entity } from '../world'
import { State, StateController, StateDeserializeContext, UnitState } from './state'

const namespaceId = 'basic-unit/'

interface UnitState extends State {
}

/**
 * State that handles commands, it switches immediately to something other
 */
@UnitState
class RootState implements State {
	public static ID = namespaceId + 'root'

	constructor(private readonly entity: UnitPrototype,
	            private readonly controller: StateController<UnitState>) {
	}

	public static create(entity: UnitPrototype,
	                     controller: StateController<UnitState>) {
		return new RootState(entity, controller)
	}

	public static isCompatibleWithComponents(components: Set<ComponentNameType>): boolean {
		return components.has('SerializableComponent')
			&& components.has('PredefinedDrawableComponent')
			&& components.has('StateMachineHolderComponent')
			&& components.has('MovingDrawableComponent')
			&& components.has('AnimatableDrawableComponent')
			&& components.has('TilesIncumbentComponent')
			&& components.has('DamageableComponent')
			&& components.has('TileListenerComponent')
			&& components.has('AttackComponent')
			&& components.has('SightComponent')
			&& components.has('UnitAnimationsComponent')
			&& components.has('MovingUnitComponent')
			&& components.has('SerializableComponent')
	}

	public static deserialize(ctx: StateDeserializeContext) {
		return new RootState(ctx.entity, ctx.controller)
	}

	onPop() {
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
		switch (command.type) {
			case 'go':
				this.controller.push(GoingAndFindingPathState.create(this.entity, this.controller, game, command.targetX, command.targetY)).update(game)
				break
			default:
				console.warn('Entity', this.entity, 'cannot handle command with type', command.type)
				break
		}
	}

	serializeToJson(): unknown {
		return {
			id: RootState.ID,
		}
	}

	update(game: GameInstance) {
		this.controller.push(IdlePatrollingState.create(this.entity, game, this.controller))
	}
}

/**
 * State for an entity that doesn't do anything (it looks for enemies nearby)
 */
@UnitState
class IdlePatrollingState implements State {
	public static ID = namespaceId + 'idle-patrolling'

	private constructor(private readonly entity: UnitPrototype,
	                    private readonly game: GameInstance,
	                    private readonly controller: StateController<UnitState>,
	                    private readonly isMyEnemy: (e: Entity) => boolean) {
	}

	public static create(entity: UnitPrototype,
	                     game: GameInstance,
	                     controller: StateController<UnitState>): State {
		const isMyEnemy = (e: Entity) => entity.myForce.isAggressiveTowards((e as unknown as DamageableComponent).myForce)

		const enemiesInRange = game.tiles.addListenersForRectAndGet(
			entity.mostWestTile - entity.sightAmount,
			entity.mostNorthTile - entity.sightAmount,
			entity.sightAmount * 2 + 1,
			entity.sightAmount * 2 + 1,
			entity, isMyEnemy)

		if (enemiesInRange.size > 0) {
			game.tiles.removeListenerFromAllTiles(entity)
			return AttackingState.create(entity, controller, enemiesInRange.values().next().value as PossibleAttackTarget)
		}
		return new IdlePatrollingState(entity, game, controller, isMyEnemy)
	}

	public static deserialize(ctx: StateDeserializeContext) {
		return IdlePatrollingState.create(ctx.entity, ctx.game, ctx.controller)
	}

	entityEnteredSightRange(which: Entity & TilesIncumbentComponent) {
		const target: PossibleAttackTarget = which as PossibleAttackTarget
		if (!this.isMyEnemy(target)) return
		this.controller.pop()
		this.controller.push(AttackingState.create(this.entity, this.controller, target))
	}

	onPop() {
		this.game.tiles.removeListenerFromAllTiles(this.entity)
	}

	serializeToJson(): unknown {
		return {
			id: IdlePatrollingState.ID,
		}
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
		this.controller.pop()
		this.controller.get().handleCommand(command, game)
	}

	update(_: GameInstance) {
	}

}

/**
 * Delays command for x + 1 amount of ticks
 */
@UnitState
class CommandDelayerState implements State {
	public static ID = namespaceId + 'command-delayer'

	private constructor(private readonly game: GameInstance,
	                    private readonly controller: StateController<UnitState>,
	                    private delay: number,
	                    private delayedCommand?: PlayerCommand) {
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		return new CommandDelayerState(ctx.game, ctx.controller,
			data.requireInt('delay'),
			data.child('command').getRawObject() as PlayerCommand)
	}

	public static create(game: GameInstance,
	                     controller: StateController<UnitState>,
	                     delay: number) {
		return new CommandDelayerState(game, controller, delay)
	}

	onPop() {
		if (this.delayedCommand != null)
			this.controller.get().handleCommand(this.delayedCommand, this.game)
	}

	serializeToJson(): unknown {
		return {
			id: CommandDelayerState.ID,
			delay: this.delay,
			command: this.delayedCommand,
		}
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
		this.delayedCommand = command
	}

	update(_: GameInstance) {
		if (this.delay > 0)
			this.delay--
		else
			this.controller.pop()
	}
}

/**
 * Finds a path and makes entity go to the destination
 */
@UnitState
class GoingAndFindingPathState implements State {
	public static ID = namespaceId + 'walking-and-finding-path-exact'

	private constructor(private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    private readonly destinationX: number,
	                    private readonly destinationY: number,
	                    private attempts: number) {
	}

	public static create(entity: UnitPrototype,
	                     controller: StateController<UnitState>,
	                     game: GameInstance,
	                     destinationX: number,
	                     destinationY: number) {
		return new GoingAndFindingPathState(entity, controller, destinationX, destinationY, 0)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		return new GoingAndFindingPathState(ctx.entity, ctx.controller, data.requireInt('x'), data.requireInt('y'), data.requireInt('attempts'))
	}

	update(game: GameInstance) {
		const sx = this.entity.mostWestTile
		const sy = this.entity.mostNorthTile
		if (this.attempts++ > 10 || (sx === this.destinationX && sy === this.destinationY)) {
			this.controller.pop()
			return
		}

		const path = findPathDirectionsCoarse(sx, sy, this.destinationX, this.destinationY, game.walkableTester)
		if (path.length > 0)
			this.controller.push(GoingPathState.create(path, this.entity, this.controller)).update(game)
		else
			this.controller.pop()
	}

	onPop() {
		this.entity.currentAnimation = this.entity.standingAnimation
		this.entity.currentAnimationFrame = this.entity.sourceDrawY = this.entity.spriteVelocityX = this.entity.spriteVelocityY = 0
	}

	serializeToJson(): unknown {
		return {
			id: GoingAndFindingPathState.ID,
			x: this.destinationX,
			y: this.destinationY,
			attempts: this.attempts,
		}
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
		this.controller.pop()
		this.controller.get().handleCommand(command, game)
	}
}

/**
 * Makes entity go to the destination by provided destination area
 */
@UnitState
class GoingAndFindingPathAreaState implements State {
	public static ID = namespaceId + 'walking-and-finding-path-area'

	private constructor(private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    private readonly destinationX: number,
	                    private readonly destinationY: number,
	                    private readonly range: number,
	                    private attempts: number) {
		// console.log({destinationX, destinationY, range})
	}


	public static create(entity: UnitPrototype,
	                     controller: StateController<UnitState>,
	                     destinationX: number,
	                     destinationY: number,
	                     range: number) {
		return new GoingAndFindingPathAreaState(entity, controller, destinationX, destinationY, range, 0)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		return new GoingAndFindingPathAreaState(ctx.entity, ctx.controller,
			data.requireInt('x'), data.requireInt('y'), data.requireInt('range'), data.requireInt('attempts'))
	}

	update(game: GameInstance) {
		const sx = this.entity.mostWestTile
		const sy = this.entity.mostNorthTile
		if (this.attempts++ > 10 || (sx === this.destinationX && sy === this.destinationY)) {
			this.controller.pop()
			return
		}

		const dx = this.destinationX
		const dy = this.destinationY
		const r = this.range
		const path = findPathDirectionsCoarseRectDestination(sx, sy,
			dx, dy,
			dx - r, dy - r,
			dx + r, dy + r,
			game.walkableTester)
		if (path.length > 0)
			this.controller.push(GoingPathState.create(path, this.entity, this.controller)).update(game)
		else
			this.controller.pop()
	}

	onPop() {
		this.entity.currentAnimation = this.entity.standingAnimation
		this.entity.currentAnimationFrame = this.entity.sourceDrawY = this.entity.spriteVelocityX = this.entity.spriteVelocityY = 0
	}

	serializeToJson(): unknown {
		return {
			id: GoingAndFindingPathState.ID,
			x: this.destinationX,
			y: this.destinationY,
			attempts: this.attempts,
		}
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
		this.controller.pop()
		this.controller.get().handleCommand(command, game)
	}
}

/**
 * Makes entity go to the destination by provided path
 */
@UnitState
class GoingPathState implements State {
	public static ID = namespaceId + 'walking-path'
	private readonly debugObject: DebugPath

	private constructor(private readonly path: FacingDirection[],
	                    private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    current: number,
	                    private delayedCommand?: PlayerCommand) {
		this.debugObject = {
			current: current,
			entityFor: entity,
			path: path,
		}
		Renderer.DEBUG_PATHS.add(this.debugObject)
	}

	public static create(path: FacingDirection[],
	                     entity: UnitPrototype,
	                     controller: StateController<UnitState>) {
		return new GoingPathState(path, entity, controller, 0, undefined)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		return new GoingPathState(data.child('path').getAsListOfNonNegativeIntegers(),
			ctx.entity, ctx.controller,
			data.requireInt('current'),
			data.child('command').getRawObject() as PlayerCommand)
	}

	handleCommand(command: PlayerCommand, game: GameInstance): void {
		this.delayedCommand = command
	}

	update(game: GameInstance): void {
		const debugObject = this.debugObject
		if (debugObject.current < this.path.length && !this.delayedCommand) {
			this.entity.currentAnimation = this.entity.walkingAnimation
			this.controller.push(GoingTileState.tryToWalkThisWay(this.path[debugObject.current], this.entity, this.controller, game)).update(game)
			debugObject.current++
		} else {
			this.controller.pop()
			if (this.delayedCommand != null)
				this.controller.get().handleCommand(this.delayedCommand, game)
			else
				this.controller.get().update(game)
		}
	}

	onPop(): void {
		Renderer.DEBUG_PATHS.delete(this.debugObject)
	}

	serializeToJson(): unknown {
		return {
			id: GoingPathState.ID,
			path: this.path,
			current: this.debugObject.current,
			command: this.delayedCommand,
		}
	}
}

/**
 * Makes entity go through a single tile
 */
@UnitState
class GoingTileState implements State {
	public static ID = namespaceId + 'walking-tile'

	private constructor(private readonly direction: FacingDirection,
	                    private readonly entity: UnitPrototype,
	                    private readonly game: GameInstance,
	                    private readonly controller: StateController<UnitState>,
	                    private progress: number,
	                    private readonly ticksToMoveThisField: number,
	                    private delayedCommand?: PlayerCommand) {

	}

	public static tryToWalkThisWay(direction: FacingDirection,
	                               entity: UnitPrototype,
	                               controller: StateController<UnitState>,
	                               game: GameInstance): State {
		const [ox, oy] = facingDirectionToVector(direction)

		if (!game.tiles.moveOccupationAtOnce(entity.mostWestTile,
			entity.mostNorthTile,
			entity.mostWestTile + ox,
			entity.mostNorthTile + oy)) {
			return new GoingTileFailed(entity, controller)
		}

		entity.sourceDrawX = direction * entity.spriteSize
		const ticksToMoveThisField = (ox !== 0 && oy !== 0) ? ((11 - entity.unitMovingSpeed) * 1.5 | 0) : (11 - entity.unitMovingSpeed)
		entity.destinationDrawX = entity.mostWestTile * 32 - (entity.spriteSize - 32) / 2 | 0
		entity.destinationDrawY = entity.mostNorthTile * 32 - (entity.spriteSize - 32) / 2 | 0
		entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
		entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
		entity.mostWestTile += ox
		entity.mostNorthTile += oy
		return new GoingTileState(direction, entity, game, controller, 0, ticksToMoveThisField, undefined)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		const direction: number = data.requireInt('direction')
		const entity = ctx.entity as UnitPrototype
		const ticksToMoveThisField: number = data.requireInt('ticksToMoveThisField')
		entity.sourceDrawX = direction * entity.spriteSize
		entity.destinationDrawX = (entity.mostWestTile * 32 - entity.spriteSize / 4) | 0
		entity.destinationDrawY = (entity.mostNorthTile * 32 - entity.spriteSize / 4) | 0
		return new GoingTileState(direction, entity, ctx.game,ctx.controller,
			data.requireInt('progress'),
			ticksToMoveThisField,
			data.child('command').getRawObject() as PlayerCommand)
	}

	onPop(): void {
		const entity = this.entity
		this.game.world.notifyEntityModified(entity, 'PredefinedDrawableComponent')
	}

	handleCommand(command: PlayerCommand, game: GameInstance): void {
		if (this.delayedCommand == null) {
			this.controller.pop()
			this.controller.push(CommandDelayerState.create(game, this.controller, 0))
			this.controller.push(this)
		}
		this.delayedCommand = command
	}

	update(game: GameInstance): void {
		if (++this.progress >= this.ticksToMoveThisField) {
			this.controller.pop()
			const state = this.controller.get()
			if (this.delayedCommand) {
				state.handleCommand(this.delayedCommand, game)
				if (this.controller.get() === state || true) {
					state.update(game)
				}
			}
		}
	}

	serializeToJson(): unknown {
		return {
			id: GoingTileState.ID,
			progress: this.progress,
			ticksToMoveThisField: this.ticksToMoveThisField,
			direction: this.direction,
			command: this.delayedCommand,
		}
	}
}

/**
 * Temporary state when made attempt to walk into occupied entity
 * */
@UnitState
class GoingTileFailed implements State {
	public static ID = namespaceId + 'walking-failed'

	constructor(private readonly entity: UnitPrototype,
	            readonly controller: StateController<UnitState>) {
		entity.spriteVelocityX = entity.spriteVelocityY = 0
	}

	public static deserialize(ctx: StateDeserializeContext) {
		return new GoingTileFailed(ctx.entity, ctx.controller)
	}

	handleCommand(command: PlayerCommand, game: GameInstance): void {
	}

	onPop(): void {
	}

	serializeToJson(): unknown {
		return {
			id: GoingTileFailed.ID,
		}
	}

	update(game: GameInstance): void {
		this.controller.pop()
		this.controller.pop()
	}
}

/**
 * Makes entity attack other entities
 */
@UnitState
class AttackingState implements State {
	public static ID = namespaceId + 'attacking'

	private constructor(private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    private readonly target: PossibleAttackTarget,
	                    private reloading: number) {
		entity.sourceDrawY = 0
		entity.currentAnimationFrame = 0
		this.setUpAttackingEntityRotation()
	}

	public static create(entity: UnitPrototype,
	                     controller: StateController<UnitState>,
	                     target: PossibleAttackTarget) {
		return new AttackingState(entity, controller, target, entity.loadDuration)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		const entity = ctx.world.getSpawnedEntity(data.requirePositiveInt('targetId')) as PossibleAttackTarget
		return new AttackingState(ctx.entity, ctx.controller, entity, data.requireInt('reloading'))
	}

	handleCommand(command: PlayerCommand, game: GameInstance): void {
		this.controller.pop()
		this.controller.get().handleCommand(command, game)
	}

	onPop(): void {
		const entity = this.entity
		entity.currentAnimation = entity.standingAnimation
		entity.currentAnimationFrame = 0
		entity.sourceDrawY = 0
	}

	update(game: GameInstance): void {
		const entity = this.entity
		const target = this.target
		const unitRange = entity.attackRangeAmount
		const targetSizeBonus = target.tileOccupySize - 1
		const [hitBoxX, hitBoxY] = target.calculateHitBoxCenter()

		if (!isInRectRange(hitBoxX, hitBoxY,
			entity.mostWestTile - unitRange,
			entity.mostNorthTile - unitRange,
			unitRange * 2 + targetSizeBonus + 1,
			unitRange * 2 + targetSizeBonus + 1)) {

			this.controller.pop()
			this.controller.push(GoingAndFindingPathAreaState.create(entity,
				this.controller,
				hitBoxX | 0,
				hitBoxY | 0,
				unitRange + targetSizeBonus)).update(game)
			return
		}
		entity.currentAnimation = entity.attackingAnimation
		this.setUpAttackingEntityRotation()

		// if (lastTargetX !== target.mostWestTile || lastTargetY !== target.mostNorthTile) {
		// 	setUpAttackingEntityRotation()
		// 	lastTargetX = target.mostWestTile
		// 	lastTargetY = target.mostNorthTile
		// }
		if (--this.reloading > 0) return
		this.reloading = entity.reloadDuration
		console.warn('SHOOT')
		// shoot it!
		// ArrowImpl.spawn(game.world, entity, target)
	}

	serializeToJson(): unknown {
		return {
			id: AttackingState.ID,
			reloading: this.reloading,
			targetId: this.target.id,
		}
	}

	private setUpAttackingEntityRotation() {
		const entity = this.entity
		const target = this.target

		const [myBoxX, myBoxY] = entity.calculateHitBoxCenter()
		const [targetBoxX, targetBoxY] = target.calculateHitBoxCenter()

		const startPosX = myBoxX * 32
		const startPosY = myBoxY * 32
		const endPosX = targetBoxX * 32
		const endPosY = targetBoxY * 32

		const x = endPosX - startPosX
		const y = endPosY - startPosY
		const alfa = Math.atan2(x, y)
		const facingDirection = facingDirectionFromAngle(alfa)
		entity.sourceDrawX = facingDirection * entity.spriteSize
	}

}

import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionFromAngle, facingDirectionToVector } from '../../misc/facing-direction'
import { findPathDirections } from '../../misc/path-finder'
import { registry } from '../../misc/resources-manager'
import { DebugPath, Renderer } from '../../renderer'
import {
	AnimatableDrawableComponent,
	ComponentNameType,
	DamageableComponent,
	MovingDrawableComponent,
	PlayerCommand,
	PlayerCommandTakerComponent,
	PossibleAttackTarget,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	StateMachineHolderComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
	UpdateContext,
} from '../components'
import { createState2, State2, State2Controller } from '../state'
import { Tile } from '../systems/tiles-system'
import { Entity } from '../world'
import { ArrowImpl } from './arrow'
import {
	AnimationFrames,
	standardAttackingAnimationFrames,
	standardStandingAnimationFrames,
	standardWalkingAnimationFrames,
} from './common'


interface ArcherState extends State2 {
	handleCommand(command: PlayerCommand, game: GameInstance): void
}

const idleState = (entity: ArcherImpl, controller: State2Controller<ArcherState>) => ({
	handleCommand(command: PlayerCommand, game: GameInstance) {
		switch (command.type) {
			case 'go':
				const sx = entity.mostWestTile
				const sy = entity.mostNorthTile
				const dx = command.targetX
				const dy = command.targetY
				const path = findPathDirections(sx, sy, dx, dy, game.walkableTester)
				if (path != null)
					controller.push(havingPathState(path, entity, controller))
				break
			default:
				console.warn('Entity', entity, 'cannot handle command with type', command.type)
				break
		}
	},
	update(ctx: UpdateContext) {
		const target: PossibleAttackTarget = entity.entitiesWithinRange.values().next().value
		if (target == null) return
		controller.push(attackingState(entity, controller, target))
		// // shoot it!
		// const arrow = ctx.world.spawnEntity(ArrowImpl)
		// const startPosX = entity.hitBoxCenterX * 32
		// const startPosY = entity.hitBoxCenterY * 32
		// const endPosX = target.hitBoxCenterX * 32
		// const endPosY = target.hitBoxCenterY * 32
		//
		// arrow.destinationDrawX = startPosX - arrow.spriteSize / 2
		// arrow.destinationDrawY = startPosY - arrow.spriteSize / 2
		//
		// const x = endPosX - startPosX
		// const y = endPosY - startPosY
		// const alfa = Math.atan2(x, y)
		// const facingDirection = facingDirectionFromAngle(alfa)
		// arrow.sourceDrawX = facingDirection * arrow.spriteSize
		//
		// const distance = Math.sqrt(x * x + y * y)
		// const ARROW_SPEED_PER_TICK = 200
		// const ticksToTravel = (distance / ARROW_SPEED_PER_TICK)
		// const travelDurationMillis = ticksToTravel * MILLIS_BETWEEN_TICKS
		// arrow.spriteVelocityX = x / (travelDurationMillis | 0)
		// arrow.spriteVelocityY = y / (travelDurationMillis | 0)
		// arrow.hideMeAtMillis = travelDurationMillis + Date.now()
	},
} as ArcherState)

const havingPathState = (path: FacingDirection[],
                         entity: ArcherImpl,
                         controller: State2Controller<ArcherState>): ArcherState => {
	const debugObject = {
		current: 0,
		entityFor: entity,
		path: path,
	} as DebugPath

	Renderer.DEBUG_PATHS.add(debugObject)
	return {
		handleCommand(command: PlayerCommand, game: GameInstance) {
			controller.pop()
			Renderer.DEBUG_PATHS.delete(debugObject)
			controller.get().handleCommand(command, game)
			entity.entitiesWithinRange = game.tiles.addListenersForRectAndGet(entity.mostWestTile - 4, entity.mostNorthTile - 4, 9, 9, entity, (obj => {
				const teamId = (obj as unknown as PossibleAttackTarget).myTeamId
				return teamId !== undefined && teamId !== entity.myTeamId
			}))
		},
		update(ctx: UpdateContext) {
			if (debugObject.current < path.length) {
				ctx.game.tiles.removeListenerFromAllTiles(entity)
				entity.currentAnimation = entity.walkingAnimation
				entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
				entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
				controller.push(walkingState(entity, path[debugObject.current], controller, ctx))
				debugObject.current++
			} else {
				entity.entitiesWithinRange = ctx.game.tiles.addListenersForRectAndGet(entity.mostWestTile - 4, entity.mostNorthTile - 4, 9, 9, entity, (obj => {
					const teamId = (obj as unknown as PossibleAttackTarget).myTeamId
					return teamId !== undefined && teamId !== entity.myTeamId
				}))
				Renderer.DEBUG_PATHS.delete(debugObject)
				controller.pop()
				entity.currentAnimation = entity.standingAnimation
				entity.currentAnimationFrame = 0
				entity.sourceDrawY = 0
				entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
				entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
				entity.spriteVelocityX = entity.spriteVelocityY = 0
			}
		},
	}
}

const walkingState = (entity: ArcherImpl,
                      dir: FacingDirection,
                      controller: State2Controller<ArcherState>,
                      ctx: UpdateContext): ArcherState => {
	let walkingProgress = 1
	entity.sourceDrawX = dir * 72
	const [ox, oy] = facingDirectionToVector(dir)

	const ticksToMoveThisField = ((ox !== 0 && oy !== 0) ? ((11 - entity.unitMovingSpeed) * 1.6 | 0) : (11 - entity.unitMovingSpeed))
	entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
	entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)

	ctx.game.entityLeftTileEvent.publish({
		mostWestTile: entity.mostWestTile,
		mostNorthTile: entity.mostNorthTile,
		entity,
	})

	entity.mostWestTile += ox
	entity.mostNorthTile += oy

	ctx.game.entityEnteredTileEvent.publish({
		mostWestTile: entity.mostWestTile,
		mostNorthTile: entity.mostNorthTile,
		entity,
	})

	let delayedCommand: PlayerCommand
	return {
		handleCommand(command: PlayerCommand) {
			// delay this command
			delayedCommand = command
		},
		update(ctx: UpdateContext) {
			if (++walkingProgress >= ticksToMoveThisField) {
				controller.pop()
				if (delayedCommand != null)
					controller.get().handleCommand(delayedCommand, ctx.game)
			}
		},
	}
}

const attackingState = (entity: ArcherImpl,
                        controller: State2Controller<ArcherState>,
                        target: PossibleAttackTarget): ArcherState => {
	let reloading = 5
	return {
		handleCommand(command: PlayerCommand, game: GameInstance) {
			controller.pop()
			controller.get().handleCommand(command, game)
		},
		update(ctx: UpdateContext) {
			entity.currentAnimation = entity.attackingAnimation
			if (--reloading > 0) return
			reloading = 5
			// shoot it!
			const arrow = ctx.world.spawnEntity(ArrowImpl)
			const startPosX = entity.hitBoxCenterX * 32
			const startPosY = entity.hitBoxCenterY * 32
			const endPosX = target.hitBoxCenterX * 32
			const endPosY = target.hitBoxCenterY * 32

			arrow.destinationDrawX = startPosX - arrow.spriteSize / 2
			arrow.destinationDrawY = startPosY - arrow.spriteSize / 2

			const x = endPosX - startPosX
			const y = endPosY - startPosY
			const alfa = Math.atan2(x, y)
			const facingDirection = facingDirectionFromAngle(alfa)
			arrow.sourceDrawX = facingDirection * arrow.spriteSize

			const distance = Math.sqrt(x * x + y * y)
			const ARROW_SPEED_PER_TICK = 200
			const ticksToTravel = (distance / ARROW_SPEED_PER_TICK)
			const travelDurationMillis = ticksToTravel * MILLIS_BETWEEN_TICKS
			arrow.spriteVelocityX = x / (travelDurationMillis | 0)
			arrow.spriteVelocityY = y / (travelDurationMillis | 0)
			arrow.hideMeAtMillis = travelDurationMillis + Date.now()
		},
	}
}


export class ArcherImpl extends Entity
	implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent,
		TilesIncumbentComponent, DamageableComponent,
		PlayerCommandTakerComponent, TileListenerComponent {
	static components = new Set<ComponentNameType>(['TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'AnimatableDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent'])

	destinationDrawX: number = -18
	destinationDrawY: number = -18
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteVelocityX: number = 0
	spriteVelocityY: number = 0
	spriteSize: number = 72
	tileOccupySize: number = 1
	texture: CanvasImageSource = registry[0]
	currentAnimationFrame: number = 0
	myTeamId: number = 0
	currentAnimation: AnimationFrames = standardStandingAnimationFrames
	mostWestTile: number = 0
	mostNorthTile: number = 0
	canAcceptCommands: true = true
	public unitMovingSpeed: number = 9
	subscribedToTiles: Set<Tile> = new Set()
	public walkingAnimation: AnimationFrames = standardWalkingAnimationFrames
	public standingAnimation: AnimationFrames = standardStandingAnimationFrames
	public attackingAnimation: AnimationFrames = standardAttackingAnimationFrames
	render = PredefinedDrawableComponent_render
	public entitiesWithinRange: Set<PossibleAttackTarget> = new Set()
	public reloading: number = 0
	private state = createState2<ArcherState>(c => idleState(this, c))
	updateState = this.state.execute

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
			this.entitiesWithinRange.delete(occupiedByPrevious as unknown as PossibleAttackTarget)

		if (occupiedByNow != null) {
			const teamId = (occupiedByNow as unknown as PossibleAttackTarget).myTeamId
			if (teamId !== undefined && teamId !== this.myTeamId) {
				this.entitiesWithinRange.add(occupiedByNow as PossibleAttackTarget)
			}
		}
	}

	accept(command: PlayerCommand, game: GameInstance): void {
		this.state.get().handleCommand(command, game)
	}
}


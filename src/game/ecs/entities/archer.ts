import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionFromAngle, facingDirectionToVector } from '../../misc/facing-direction'
import { findPathDirectionsCoarse, findPathDirectionsExact } from '../../misc/path-finder'
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
	SelfLifecycleObserverComponent,
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
	standardArcherAttackingAnimationFrames,
	standardStandingAnimationFrames,
	standardWalkingAnimationFrames,
} from './common'


interface ArcherState extends State2 {
	handleCommand(command: PlayerCommand, game: GameInstance): void

	entityLeftRange?(which: Entity): void

	entityEnteredRange?(which: Entity): void
}

const idleState = (entity: ArcherImpl, controller: State2Controller<ArcherState>): ArcherState => {
	return {
		onPop() {
		},
		update(_: UpdateContext) {
			const target: PossibleAttackTarget = entity.entitiesWithinRange.values().next().value
			if (target != null)
				controller.push(attackingState(entity, controller, target))
		},
		handleCommand(command: PlayerCommand, game: GameInstance) {
			switch (command.type) {
				case 'go':
					const sx = entity.mostWestTile
					const sy = entity.mostNorthTile
					const dx = command.targetX
					const dy = command.targetY
					const path = findPathDirectionsCoarse(sx, sy, dx, dy, game.walkableTester)
					if (path != null) {
						controller.push(goingPath(path, entity, controller, game)).update(game)
					}
					break
				default:
					console.warn('Entity', entity, 'cannot handle command with type', command.type)
					break
			}
		},
	}
}

const commandDelayer = (game: GameInstance, controller: State2Controller<ArcherState>, delay: number): ArcherState => {
	let delayedCommand: PlayerCommand
	return {
		onPop() {
			if (delayedCommand != null)
				controller.get().handleCommand(delayedCommand, game)
		},
		handleCommand(command: PlayerCommand, _: GameInstance) {
			delayedCommand = command
		},
		update(_: UpdateContext) {
			if (delay > 0)
				delay--
			else
				controller.pop()
		},
	}
}

const goingPath = (path: FacingDirection[], entity: ArcherImpl, controller: State2Controller<ArcherState>, game: GameInstance): ArcherState => {
	const debugObject = {
		current: 0,
		entityFor: entity,
		path: path,
	} as DebugPath

	game.tiles.removeListenerFromAllTiles(entity)
	entity.currentAnimation = entity.walkingAnimation
	Renderer.DEBUG_PATHS.add(debugObject)
	let delayedCommand: PlayerCommand
	return {
		onPop() {
			entity.resumeTileListeners(game)
			Renderer.DEBUG_PATHS.delete(debugObject)
			entity.currentAnimation = entity.standingAnimation
			entity.currentAnimationFrame = 0
			entity.sourceDrawY = 0
			entity.spriteVelocityX = entity.spriteVelocityY = 0
		},
		update(game: UpdateContext) {
			if (debugObject.current < path.length && !delayedCommand) {
				entity.currentAnimation = entity.walkingAnimation
				controller.push(goingTile(path[debugObject.current], entity, controller, game)).update(game)
				debugObject.current++
			} else {
				controller.pop()
				if (delayedCommand != null)
					controller.get().handleCommand(delayedCommand, game)
			}
		},
		handleCommand(command: PlayerCommand, _: GameInstance) {
			delayedCommand = command
		},
	}
}

const goingTile = (dir: FacingDirection, entity: ArcherImpl, controller: State2Controller<ArcherState>, game: GameInstance): ArcherState => {
	let progress = 0
	entity.sourceDrawX = dir * 72
	const [ox, oy] = facingDirectionToVector(dir)
	if (!game.tiles.moveOccupationAtOnce(
		entity.mostWestTile, entity.mostNorthTile,
		entity.mostWestTile + ox, entity.mostNorthTile + oy)) {
		return {
			update(_) {
				controller.pop()
				controller.pop()
			},
			onPop() {
			},
			handleCommand(_,__) {
				// controller.get().handleCommand(command, game)
			},
		}
	}

	const ticksToMoveThisField = (ox !== 0 && oy !== 0) ? ((11 - entity.unitMovingSpeed) * 1.5 | 0) : (11 - entity.unitMovingSpeed)
	entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
	entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
	entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
	entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)


	// game.entityLeftTileEvent.publish({
	// 	mostWestTile: entity.mostWestTile,
	// 	mostNorthTile: entity.mostNorthTile,
	// 	entity,
	// })

	entity.mostWestTile += ox
	entity.mostNorthTile += oy

	// game.entityEnteredTileEvent.publish({
	// 	mostWestTile: entity.mostWestTile,
	// 	mostNorthTile: entity.mostNorthTile,
	// 	entity,
	// })
	let delayedCommand: PlayerCommand
	return {
		onPop() {
		},
		update(game: UpdateContext) {
			if (++progress >= ticksToMoveThisField) {
				controller.pop()
				const state = controller.get()
				if (delayedCommand) {
					state.handleCommand(delayedCommand, game)
					if (controller.get() === state || true) {
						state.update(game)
					}
				}
			}
		},
		handleCommand(command: PlayerCommand, _: GameInstance) {
			if (delayedCommand == null) {
				controller.pop()
				controller.push(commandDelayer(game, controller, 0))
				controller.push(this)
			}
			delayedCommand = command
		},
	}
}

const attackingState = (entity: ArcherImpl,
                        controller: State2Controller<ArcherState>,
                        target: PossibleAttackTarget): ArcherState => {
	let reloading = 5

	const setUpAttackingEntityRotation = () => {
		const startPosX = entity.hitBoxCenterX * 32
		const startPosY = entity.hitBoxCenterY * 32
		const endPosX = target.hitBoxCenterX * 32
		const endPosY = target.hitBoxCenterY * 32

		const x = endPosX - startPosX
		const y = endPosY - startPosY
		const alfa = Math.atan2(x, y)
		const facingDirection = facingDirectionFromAngle(alfa)
		entity.currentAnimation = entity.attackingAnimation
		entity.currentAnimationFrame = 0
		entity.sourceDrawY = 0
		entity.sourceDrawX = facingDirection * entity.spriteSize
	}
	let lastTargetX = target.mostWestTile
	let lastTargetY = target.mostNorthTile
	setUpAttackingEntityRotation()

	let isOutOfRange: boolean = false
	return {
		entityEnteredRange(which: Entity) {
			if (target === which)
				isOutOfRange = false
		},
		entityLeftRange(which: Entity) {
			if (which === target)
				isOutOfRange = true
		},
		onPop() {
			entity.currentAnimation = entity.standingAnimation
			entity.currentAnimationFrame = 0
			entity.sourceDrawY = 0
		},
		handleCommand(command: PlayerCommand, game: GameInstance) {
			controller.pop()
			controller.get().handleCommand(command, game)
		},
		update(ctx: UpdateContext) {
			if (isOutOfRange) {
				controller.pop()
				return
			}
			if (--reloading > 0) return
			if (lastTargetX !== target.mostWestTile || lastTargetY !== target.mostNorthTile) {
				setUpAttackingEntityRotation()
				lastTargetX = target.mostWestTile
				lastTargetY = target.mostNorthTile
			}
			reloading = 7
			// shoot it!
			ArrowImpl.spawn(ctx.world, entity, target)
		},
	}
}


export class ArcherImpl extends Entity
	implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent,
		TilesIncumbentComponent, DamageableComponent,
		PlayerCommandTakerComponent, TileListenerComponent,
		SelfLifecycleObserverComponent {
	static components = new Set<ComponentNameType>(['SelfLifecycleObserverComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent'])

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
	public attackingAnimation: AnimationFrames = standardArcherAttackingAnimationFrames

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

	resumeTileListeners(game: GameInstance) {
		const entity = this
		entity.entitiesWithinRange = game.tiles.addListenersForRectAndGet(entity.mostWestTile - 4, entity.mostNorthTile - 4, 9, 9, entity, (obj => {
			const teamId = (obj as unknown as PossibleAttackTarget).myTeamId
			return teamId !== undefined && teamId !== entity.myTeamId
		}))
	}

	entityCreated(game: GameInstance): void {
		this.resumeTileListeners(game)
	}

	entityRemoved(game: GameInstance): void {
		game.tiles.removeListenerFromAllTiles(this)
	}

	onListenedTileOccupationChanged(_: Entity & TileListenerComponent,
	                                tile: Tile,
	                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
	                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) {
		if (occupiedByPrevious != null) {
			this.entitiesWithinRange.delete(occupiedByPrevious as unknown as PossibleAttackTarget)
			this.state.get().entityLeftRange?.(occupiedByPrevious)
		}

		if (occupiedByNow != null) {
			const teamId = (occupiedByNow as unknown as PossibleAttackTarget).myTeamId
			if (teamId !== undefined && teamId !== this.myTeamId) {
				this.entitiesWithinRange.add(occupiedByNow as PossibleAttackTarget)
				this.state.get().entityEnteredRange?.(occupiedByNow)
			}
		}
	}

	accept(command: PlayerCommand, game: GameInstance): void {
		this.state.get().handleCommand(command, game)
	}
}


import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionFromAngle, facingDirectionToVector } from '../../misc/facing-direction'
import { findPathDirectionsCoarse, findPathDirectionsCoarseRectDestination } from '../../misc/path-finder'
import { registry } from '../../misc/resources-manager'
import { DebugPath, Renderer } from '../../renderer'
import {
	AnimatableDrawableComponent,
	AttackRangeComponent,
	ComponentNameType,
	DamageableComponent,
	MovingDrawableComponent,
	PlayerCommand,
	PlayerCommandTakerComponent,
	PossibleAttackTarget,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	SelfLifecycleObserverComponent,
	SightComponent,
	StateMachineHolderComponent,
	TileListenerComponent,
	TilesIncumbentComponent,
} from '../components'
import { Force, neutralForce } from '../force'
import { createState, State, StateController } from '../states/state'
import { Tile } from '../systems/tiles-system'
import { Entity } from '../world'
import { ArrowImpl } from './arrow'
import {
	AnimationFrames,
	isInRectRange,
	standardArcherAttackingAnimationFrames,
	standardStandingAnimationFrames,
	standardWalkingAnimationFrames,
} from './common'

//
// interface ArcherState extends State {
// 	handleCommand(command: PlayerCommand, game: GameInstance): void
//
// 	entityLeftSightRange?(which: Entity & TilesIncumbentComponent): void
//
// 	entityEnteredSightRange?(which: Entity & TilesIncumbentComponent): void
// }
//
// const idleState = (entity: ArcherImpl, controller: StateController<ArcherState>): ArcherState => {
// 	return {
// 		onPop() {
// 		},
// 		update(_: GameInstance) {
// 		},
// 		entityEnteredSightRange(which: Entity & TilesIncumbentComponent) {
// 			const target: PossibleAttackTarget = which as PossibleAttackTarget
// 			controller.push(attackingState(entity, controller, target))
// 		},
// 		handleCommand(command: PlayerCommand, game: GameInstance) {
// 			switch (command.type) {
// 				case 'go':
// 					controller.push(goingAndFindingPath(entity, controller, game, command.targetX, command.targetY)).update(game)
// 					break
// 				default:
// 					console.warn('Entity', entity, 'cannot handle command with type', command.type)
// 					break
// 			}
// 		},
// 	}
// }
//
// const commandDelayer = (game: GameInstance, controller: StateController<ArcherState>, delay: number): ArcherState => {
// 	let delayedCommand: PlayerCommand
// 	return {
// 		onPop() {
// 			if (delayedCommand != null)
// 				controller.get().handleCommand(delayedCommand, game)
// 		},
// 		handleCommand(command: PlayerCommand, _: GameInstance) {
// 			delayedCommand = command
// 		},
// 		update(_: GameInstance) {
// 			if (delay > 0)
// 				delay--
// 			else
// 				controller.pop()
// 		},
// 	}
// }
//
// const goingAndFindingPath = (entity: ArcherImpl, controller: StateController<ArcherState>, game: GameInstance,
//                              destinationX: number, destinationY: number): ArcherState => {
// 	let attempts = 0
// 	return {
// 		onPop() {
// 			entity.currentAnimation = entity.standingAnimation
// 			entity.currentAnimationFrame = 0
// 			entity.sourceDrawY = 0
// 			entity.spriteVelocityX = entity.spriteVelocityY = 0
// 			entity.resumeTileListeners(game)
// 		},
// 		update(game: GameInstance) {
// 			const sx = entity.mostWestTile
// 			const sy = entity.mostNorthTile
// 			if (attempts++ > 10 || (sx === destinationX && sy === destinationY)) {
// 				controller.pop()
// 				return
// 			}
// 			const path = findPathDirectionsCoarse(sx, sy, destinationX, destinationY, game.walkableTester)
// 			if (path.length > 0)
// 				controller.push(goingPath(path, entity, controller, game)).update(game)
// 			else
// 				controller.pop()
// 		},
// 		handleCommand(command: PlayerCommand, _: GameInstance) {
// 			controller.pop()
// 			controller.get().handleCommand(command, _)
// 		},
// 	}
// }
//
//
// const goingAndFindingPathRange = (entity: ArcherImpl, controller: StateController<ArcherState>, game: GameInstance,
//                                   destinationX: number, destinationY: number, range: number): ArcherState => {
// 	let attempts = 0
// 	return {
// 		onPop() {
// 			entity.currentAnimation = entity.standingAnimation
// 			entity.currentAnimationFrame = 0
// 			entity.sourceDrawY = 0
// 			entity.spriteVelocityX = entity.spriteVelocityY = 0
// 			entity.resumeTileListeners(game)
// 		},
// 		update(game: GameInstance) {
// 			const sx = entity.mostWestTile
// 			const sy = entity.mostNorthTile
// 			if (attempts++ > 10 || (sx === destinationX && sy === destinationY)) {
// 				controller.pop()
// 				return
// 			}
// 			const path = findPathDirectionsCoarseRectDestination(sx, sy,
// 				destinationX, destinationY,
// 				destinationX - range, destinationY - range,
// 				destinationX + range, destinationY + range,
// 				game.walkableTester)
// 			if (path.length > 0)
// 				controller.push(goingPath(path, entity, controller, game)).update(game)
// 			else
// 				controller.pop()
// 		},
// 		handleCommand(command: PlayerCommand, _: GameInstance) {
// 			controller.pop()
// 			controller.get().handleCommand(command, _)
// 		},
// 	}
// }
//
// const goingPath = (path: FacingDirection[], entity: ArcherImpl, controller: StateController<ArcherState>, game: GameInstance): ArcherState => {
// 	const debugObject = {
// 		current: 0,
// 		entityFor: entity,
// 		path: path,
// 	} as DebugPath
//
// 	entity.entitiesWithinSightRange.clear()
// 	game.tiles.removeListenerFromAllTiles(entity)
// 	entity.currentAnimation = entity.walkingAnimation
// 	Renderer.DEBUG_PATHS.add(debugObject)
// 	let delayedCommand: PlayerCommand
// 	return {
// 		onPop() {
// 			Renderer.DEBUG_PATHS.delete(debugObject)
// 		},
// 		update(game: GameInstance) {
// 			if (debugObject.current < path.length && !delayedCommand) {
// 				entity.currentAnimation = entity.walkingAnimation
// 				controller.push(goingTile(path[debugObject.current], entity, controller, game)).update(game)
// 				debugObject.current++
// 			} else {
// 				controller.pop()
// 				if (delayedCommand != null)
// 					controller.get().handleCommand(delayedCommand, game)
// 				else
// 					controller.get().update(game)
// 			}
// 		},
// 		handleCommand(command: PlayerCommand, _: GameInstance) {
// 			delayedCommand = command
// 		},
// 	}
// }
//
// const goingTile = (dir: FacingDirection, entity: ArcherImpl, controller: StateController<ArcherState>, game: GameInstance): ArcherState => {
// 	let progress = 0
// 	entity.sourceDrawX = dir * 72
// 	const [ox, oy] = facingDirectionToVector(dir)
// 	if (!game.tiles.moveOccupationAtOnce(
// 		entity.mostWestTile, entity.mostNorthTile,
// 		entity.mostWestTile + ox, entity.mostNorthTile + oy)) {
// 		return {
// 			update(_) {
// 				controller.pop()
// 				controller.pop()
// 			},
// 			onPop() {
// 			},
// 			handleCommand(_, __) {
// 				// controller.get().handleCommand(command, game)
// 			},
// 		}
// 	}
//
// 	const ticksToMoveThisField = (ox !== 0 && oy !== 0) ? ((11 - entity.unitMovingSpeed) * 1.5 | 0) : (11 - entity.unitMovingSpeed)
// 	entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
// 	entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
// 	entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
// 	entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
//
//
// 	// game.entityLeftTileEvent.publish({
// 	// 	mostWestTile: entity.mostWestTile,
// 	// 	mostNorthTile: entity.mostNorthTile,
// 	// 	entity,
// 	// })
//
// 	entity.mostWestTile += ox
// 	entity.mostNorthTile += oy
//
// 	// game.entityEnteredTileEvent.publish({
// 	// 	mostWestTile: entity.mostWestTile,
// 	// 	mostNorthTile: entity.mostNorthTile,
// 	// 	entity,
// 	// })
// 	let delayedCommand: PlayerCommand
// 	return {
// 		onPop() {
// 		},
// 		update(game: GameInstance) {
// 			if (++progress >= ticksToMoveThisField) {
// 				controller.pop()
// 				const state = controller.get()
// 				if (delayedCommand) {
// 					state.handleCommand(delayedCommand, game)
// 					if (controller.get() === state || true) {
// 						state.update(game)
// 					}
// 				}
// 			}
// 		},
// 		handleCommand(command: PlayerCommand, _: GameInstance) {
// 			if (delayedCommand == null) {
// 				controller.pop()
// 				controller.push(commandDelayer(game, controller, 0))
// 				controller.push(this)
// 			}
// 			delayedCommand = command
// 		},
// 	}
// }
//
// const attackingState = (entity: ArcherImpl,
//                         controller: StateController<ArcherState>,
//                         target: PossibleAttackTarget): ArcherState => {
//
// 	let reloading = 6
//
// 	const setUpAttackingEntityRotation = () => {
// 		const startPosX = entity.hitBoxCenterX * 32
// 		const startPosY = entity.hitBoxCenterY * 32
// 		const endPosX = target.hitBoxCenterX * 32
// 		const endPosY = target.hitBoxCenterY * 32
//
// 		const x = endPosX - startPosX
// 		const y = endPosY - startPosY
// 		const alfa = Math.atan2(x, y)
// 		const facingDirection = facingDirectionFromAngle(alfa)
// 		entity.currentAnimation = entity.attackingAnimation
// 		entity.currentAnimationFrame = 0
// 		entity.sourceDrawY = 0
// 		entity.sourceDrawX = facingDirection * entity.spriteSize
// 	}
// 	let lastTargetX = target.mostWestTile
// 	let lastTargetY = target.mostNorthTile
// 	setUpAttackingEntityRotation()
//
// 	const unitRange = entity.attackRangeAmount
// 	const targetSizeBonus = target.tileOccupySize - 1
// 	let isOutOfRange: boolean = !isInRectRange(target.hitBoxCenterX, target.hitBoxCenterY,
// 		entity.mostWestTile - unitRange,
// 		entity.mostNorthTile - unitRange,
// 		unitRange * 2 + targetSizeBonus + 1,
// 		unitRange * 2 + targetSizeBonus + 1)
//
// 	return {
// 		entityEnteredSightRange(which: PossibleAttackTarget) {
// 			if (target === which) {
// 				if (isInRectRange(target.hitBoxCenterX, target.hitBoxCenterY,
// 					entity.mostWestTile - unitRange,
// 					entity.mostNorthTile - unitRange,
// 					unitRange * 2 + targetSizeBonus + 1,
// 					unitRange * 2 + targetSizeBonus + 1)) {
// 					isOutOfRange = false
// 				}
// 			}
// 		},
// 		entityLeftSightRange(which: Entity) {
// 			if (which === target)
// 				isOutOfRange = true
// 		},
// 		onPop() {
// 			entity.currentAnimation = entity.standingAnimation
// 			entity.currentAnimationFrame = 0
// 			entity.sourceDrawY = 0
// 		},
// 		handleCommand(command: PlayerCommand, game: GameInstance) {
// 			controller.pop()
// 			controller.get().handleCommand(command, game)
// 		},
// 		update(ctx: GameInstance) {
// 			if (isOutOfRange) {
// 				controller.pop()
// 				controller.push(goingAndFindingPathRange(entity, controller, ctx,
// 					target.hitBoxCenterX | 0, target.hitBoxCenterY | 0,
// 					unitRange + targetSizeBonus))
// 				return
// 			}
// 			if (--reloading > 0) return
// 			if (lastTargetX !== target.mostWestTile || lastTargetY !== target.mostNorthTile) {
// 				setUpAttackingEntityRotation()
// 				lastTargetX = target.mostWestTile
// 				lastTargetY = target.mostNorthTile
// 			}
// 			reloading = 7
// 			// shoot it!
// 			ArrowImpl.spawn(ctx.world, entity, target)
// 		},
// 	}
// }


// export class ArcherImpl extends Entity
// 	implements PredefinedDrawableComponent, StateMachineHolderComponent,
// 		MovingDrawableComponent, AnimatableDrawableComponent,
// 		TilesIncumbentComponent, DamageableComponent,
// 		PlayerCommandTakerComponent, TileListenerComponent,
// 		SelfLifecycleObserverComponent, AttackRangeComponent,
// 		SightComponent {
// 	static components = new Set<ComponentNameType>(['AttackRangeComponent', 'SightComponent', 'SelfLifecycleObserverComponent', 'AnimatableDrawableComponent', 'TileListenerComponent', 'DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent', 'PlayerCommandTakerComponent'])
//
// 	destinationDrawX: number = -18
// 	destinationDrawY: number = -18
// 	sourceDrawX: number = 0
// 	sourceDrawY: number = 0
// 	spriteVelocityX: number = 0
// 	spriteVelocityY: number = 0
// 	spriteSize: number = 72
// 	tileOccupySize: number = 1
// 	texture: CanvasImageSource = registry[0]
// 	currentAnimationFrame: number = 0
// 	myForce: Force = neutralForce
// 	currentAnimation: AnimationFrames = standardStandingAnimationFrames
// 	mostWestTile: number = 0
// 	mostNorthTile: number = 0
// 	canAcceptCommands: true = true
// 	public unitMovingSpeed: number = 9
// 	public sightAmount: number = 4
// 	public attackRangeAmount: number = 3
// 	subscribedToTiles: Set<Tile> = new Set()
//
// 	public walkingAnimation: AnimationFrames = standardWalkingAnimationFrames
// 	public standingAnimation: AnimationFrames = standardStandingAnimationFrames
// 	public attackingAnimation: AnimationFrames = standardArcherAttackingAnimationFrames
//
// 	render = PredefinedDrawableComponent_render
// 	public entitiesWithinSightRange: Set<PossibleAttackTarget> = new Set()
// 	private state = createState<ArcherState>(c => idleState(this, c))
// 	updateState = this.state.execute
//
// 	get hitBoxCenterX(): number {
// 		return this.mostWestTile + 0.5
// 	}
//
// 	get hitBoxCenterY(): number {
// 		return this.mostNorthTile + 0.5
// 	}
//
// 	resumeTileListeners(game: GameInstance) {
// 		const entity = this
// 		const sightBoxSize = entity.sightAmount * 2 + 1
// 		entity.entitiesWithinSightRange = game.tiles.addListenersForRectAndGet(
// 			entity.mostWestTile - entity.sightAmount,
// 			entity.mostNorthTile - entity.sightAmount,
// 			sightBoxSize, sightBoxSize,
// 			entity, (obj => {
// 				const teamId = (obj as unknown as PossibleAttackTarget).myForce
// 				return teamId !== undefined && teamId !== entity.myForce
// 			}))
// 		const value: PossibleAttackTarget = entity.entitiesWithinSightRange.values().next().value
// 		if (value != null) {
// 			this.state.get().entityEnteredSightRange?.(value)
// 		}
// 	}
//
// 	entityCreated(game: GameInstance): void {
// 		this.resumeTileListeners(game)
// 	}
//
// 	entityRemoved(game: GameInstance): void {
// 		game.tiles.removeListenerFromAllTiles(this)
// 	}
//
// 	onListenedTileOccupationChanged(_: Entity & TileListenerComponent,
// 	                                tile: Tile,
// 	                                occupiedByPrevious: (Entity & TilesIncumbentComponent) | undefined,
// 	                                occupiedByNow: (Entity & TilesIncumbentComponent) | undefined) {
// 		if (occupiedByPrevious != null) {
// 			this.entitiesWithinSightRange.delete(occupiedByPrevious as unknown as PossibleAttackTarget)
// 			this.state.get().entityLeftSightRange?.(occupiedByPrevious)
// 		}
//
// 		if (occupiedByNow != null) {
// 			const teamId = (occupiedByNow as unknown as PossibleAttackTarget).myForce
// 			if (this.myForce.isAggressiveTowards(teamId)) {
// 				this.entitiesWithinSightRange.add(occupiedByNow as PossibleAttackTarget)
// 				this.state.get().entityEnteredSightRange?.(occupiedByNow)
// 			}
// 		}
// 	}
//
// 	accept(command: PlayerCommand, game: GameInstance): void {
// 		this.state.get().handleCommand(command, game)
// 	}
// }

export {}

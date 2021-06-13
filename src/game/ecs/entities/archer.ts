import { MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionToVector } from '../../misc/facing-direction'
import { findPathDirections } from '../../misc/path-finder'
import { registry } from '../../misc/resources-manager'
import { DebugPath, Renderer } from '../../renderer'
import {
	AnimatableDrawableComponent,
	ComponentNameType,
	DamageableComponent,
	MovingDrawableComponent,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	StateMachineHolderComponent,
	TilesIncumbentComponent,
	UpdateContext,
} from '../components'
import { createState, State } from '../state'
import { Entity } from '../world'
import { AnimationFrames, standardStandingAnimationFrames, standardWalkingAnimationFrames } from './common'

const idleState = (): State<ArcherImpl> => () => {
}

const lookingForDestinationState = (): State<ArcherImpl> => {
	let counter = 0
	return (entity, controller, ctx) => {
		if (counter++ > 2) {
			controller.replace(idleState())
			const directions = findPathDirections(entity.mostWestTile, entity.mostNorthTile,
				1, 10, ctx.game.walkableTester)
			if (directions != null) {
				controller.push(havingPathState(directions, entity))
			}
			counter = 0
		}
	}
}

const havingPathState = (path: FacingDirection[], entity: ArcherImpl): State<ArcherImpl> => {
	const debugObject = {
		current: 0,
		entityFor: entity,
		path: path,
	} as DebugPath

	Renderer.DEBUG_PATHS.add(debugObject)
	return (entity, controller, ctx) => {
		if (debugObject.current < path.length) {
			entity.currentAnimation = entity.walkingAnimation
			entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
			entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
			controller.push(walkingState(entity, path[debugObject.current], ctx))
			debugObject.current++
		} else {
			Renderer.DEBUG_PATHS.delete(debugObject)
			controller.pop()
			entity.currentAnimation = entity.standingAnimation
			entity.currentAnimationFrame = 0
			entity.sourceDrawY = 0
			entity.destinationDrawX = entity.mostWestTile * 32 - 18 | 0
			entity.destinationDrawY = entity.mostNorthTile * 32 - 18 | 0
			entity.spriteVelocityX = entity.spriteVelocityY = 0
		}
	}
}
const walkingState = (entity: ArcherImpl,
                      dir: FacingDirection,
                      ctx: UpdateContext): State<ArcherImpl> => {
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

	return (entity, controller) => {
		if (++walkingProgress >= ticksToMoveThisField) {
			controller.pop()
		}
	}
}

export class ArcherImpl extends Entity
	implements PredefinedDrawableComponent, StateMachineHolderComponent,
		MovingDrawableComponent, AnimatableDrawableComponent, TilesIncumbentComponent, DamageableComponent {
	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'StateMachineHolderComponent', 'MovingDrawableComponent', 'AnimatableDrawableComponent', 'TilesIncumbentComponent', 'DamageableComponent'])

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
	public unitMovingSpeed: number = 9
	public walkingAnimation: AnimationFrames = standardWalkingAnimationFrames
	public standingAnimation: AnimationFrames = standardStandingAnimationFrames
	render = PredefinedDrawableComponent_render
	updateState = createState(this, lookingForDestinationState())

	get hitBoxCenterX(): number {
		return this.mostWestTile + 0.5
	}
	get hitBoxCenterY(): number {
		return this.mostNorthTile + 0.5
	}
}


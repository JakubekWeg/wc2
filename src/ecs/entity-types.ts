import { Chunk } from '../game/chunk-indexer'
import {
	ActionHolderComponent,
	AnimatedSpriteDrawableComponent,
	CallableIfNearbyEntityDetectedComponent,
	ComponentNameType,
	EntityAction,
	MovableSpriteDrawableComponent,
	SpriteDrawableComponent,
	TilePosition,
	TilesIncumbent,
	WalkableComponent,
} from './components'
import { FacingDirection } from './facing-direction'

export class Entity {
	static components: Set<ComponentNameType> = new Set<ComponentNameType>()
	public readonly id: number = 0
}

export class Farm extends Entity
	implements TilesIncumbent, SpriteDrawableComponent {
	static components = new Set<ComponentNameType>(['SpriteDrawableComponent', 'TilesIncumbent'])
	readonly occupiedTilesSize = 2
	imageIndex = 2
	occupiedTilesWest = 0
	occupiedTilesNorth = 0
	destinationDrawX = 0
	destinationDrawY = 0
	sourceDrawX = 0
	sourceDrawY = 0
	spriteSize = 64
	iAmInsideChunks = new Set<Chunk>()
}

export class TrollAxeThrower extends Entity
	implements TilesIncumbent,
		MovableSpriteDrawableComponent, WalkableComponent, AnimatedSpriteDrawableComponent,
		ActionHolderComponent, CallableIfNearbyEntityDetectedComponent {

	static components = new Set<ComponentNameType>(['TilesIncumbent',
		'MovableSpriteDrawableComponent', 'WalkableComponent', 'AnimatedSpriteDrawableComponent',
		'ActionHolderComponent', 'CallableIfNearbyEntityDetectedComponent'])

	currentAnimationFrame: number = 0
	destinationDrawX: number = -18
	destinationDrawY: number = -18
	imageIndex: number = 3
	readonly occupiedTilesSize: number = 1
	pathDirections: FacingDirection[] = []
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteSize: number = 72
	spriteVelocityX: number = 0
	spriteVelocityY: number = 0
	walkDirection: FacingDirection = 0
	walkProgress: number = 0
	standingAnimationFrames: number[] = [0]
	walkingAnimationFrames: number[] = [
		0,
		72,
		72,
		2 * 72,
		2 * 72,
		0,
		4 * 72,
		4 * 72,
		3 * 72,
		3 * 72,
		4 * 72,
		4 * 72,
	]
	currentFrame: number = 0
	currentFrames: number[] = this.standingAnimationFrames
	ticksToMoveThisField: number = 0
	unitMovingSpeed: number = 18

	currentAction: EntityAction = 'stand'
	detectionRange: number = 4
	occupiedTilesWest: number = 0
	occupiedTilesNorth: number = 0
	iAmInsideChunks = new Set<Chunk>()
}

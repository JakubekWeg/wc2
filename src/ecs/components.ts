import { Chunk } from '../game/chunk-indexer'
import { FacingDirection } from './facing-direction'

export type ComponentNameType =
	'TilesIncumbent'
	| 'SpriteDrawableComponent'
	| 'WalkableComponent'
	| 'MovableSpriteDrawableComponent'
	| 'AnimatedSpriteDrawableComponent'
	| 'ActionHolderComponent'
	| 'CallableIfNearbyEntityDetectedComponent'


export interface TilePosition {
	x: number
	y: number
}


/**
 * Component for entities that occupy tiles and can be bound to chunks
 */
export interface TilesIncumbent {
	occupiedTilesWest: number
	occupiedTilesNorth: number
	readonly occupiedTilesSize: number
	readonly iAmInsideChunks: Set<Chunk>
}

/**
 * Component for entities that may change its position and may change their occupation tile
 * Works only for entities with occupiedTilesSize = 1
 */
export interface WalkableComponent {
	unitMovingSpeed: number
	ticksToMoveThisField: number
	walkProgress: number
	walkDirection: FacingDirection
	pathDirections: FacingDirection[]
	standingAnimationFrames: number[],
	walkingAnimationFrames: number[],
}

/**
 * Component for entities that can be drawn on the screen
 */
export interface SpriteDrawableComponent {
	sourceDrawX: number
	sourceDrawY: number
	destinationDrawX: number
	destinationDrawY: number
	spriteSize: number
	imageIndex: number
}

/**
 * Component for entities that may change their position
 * Sprite's position may be animated
 */
export interface MovableSpriteDrawableComponent {
	imageIndex: number
	spriteSize: number
	sourceDrawX: number
	sourceDrawY: number
	destinationDrawX: number
	destinationDrawY: number
	spriteVelocityX: number
	spriteVelocityY: number
}


/**
 * Component for entities that change their sourceDrawY
 * Sprite's position may be animated
 */
export interface AnimatedSpriteDrawableComponent {
	sourceDrawY: number
	currentFrame: number
	currentFrames: number[]
}

export type EntityAction = 'stand'

/**
 * Component that stores entity current action
 */
export interface ActionHolderComponent {
	currentAction: EntityAction
}

/**
 *
 */
export interface CallableIfNearbyEntityDetectedComponent {
	occupiedTilesWest: number
	occupiedTilesNorth: number
	readonly occupiedTilesSize: number
}

import { Chunk } from '../game/chunk-indexer'
import {
	ActionHolderComponent,
	AnimatedSpriteDrawableComponent,
	AttackingComponent,
	CallableIfNearbyEntityDetectedComponent,
	ComponentNameType,
	EntityAction,
	MovableSpriteDrawableComponent,
	ProjectileSource,
	SpriteDrawableComponent,
	TileListenerComponent,
	TilesIncumbent,
	WalkableComponent,
} from './components'
import { FacingDirection } from './facing-direction'
import { Tile } from './tiles-system'

export class Entity {
	static components: Set<ComponentNameType> = new Set<ComponentNameType>()
	public readonly id: number = 0
	public removed: boolean = false
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

export class GuardTower extends Entity implements TilesIncumbent, SpriteDrawableComponent, TileListenerComponent, AttackingComponent, ProjectileSource {
	static components = new Set<ComponentNameType>(['TilesIncumbent', 'SpriteDrawableComponent', 'TileListenerComponent', 'AttackingComponent', 'ProjectileSource'])

	destinationDrawX: number = 0
	destinationDrawY: number = 0
	readonly iAmInsideChunks: Set<Chunk> = new Set<Chunk>()
	occupiedTilesNorth: number = 0
	occupiedTilesWest: number = 0
	subscribedToTiles: Set<Tile> = new Set()
	sourceDrawX: number = 0
	centerX: number = 0
	centerY: number = 0


	sourceDrawY: number = 0

	readonly occupiedTilesSize: number = 2
	imageIndex: number = 4
	spriteSize: number = 64

	target?: Entity & TilesIncumbent

	onListenedTileOccupationChanged(listener: Entity & TileListenerComponent,
	                                tile: Tile,
	                                entity: (Entity & TilesIncumbent) | undefined): void {
		// @ts-ignore
		if (!entity || listener === entity) return
		const me = listener as GuardTower
		me.target = entity
		console.log('targeting entity', entity)
	}


}

export class ArrowProjectile extends Entity implements MovableSpriteDrawableComponent, SpriteDrawableComponent {
	static components = new Set<ComponentNameType>(['MovableSpriteDrawableComponent', 'SpriteDrawableComponent'])
	destinationDrawX: number = 0
	destinationDrawY: number = 0
	imageIndex: number = 5
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteSize: number = 40
	spriteVelocityX: number = 0
	spriteVelocityY: number = 0

}

export class TrollAxeThrower extends Entity
	implements TilesIncumbent,
		MovableSpriteDrawableComponent, WalkableComponent, AnimatedSpriteDrawableComponent,
		ActionHolderComponent, CallableIfNearbyEntityDetectedComponent, TileListenerComponent {

	static components = new Set<ComponentNameType>(['TilesIncumbent',
		'MovableSpriteDrawableComponent', 'WalkableComponent', 'AnimatedSpriteDrawableComponent',
		'ActionHolderComponent', 'CallableIfNearbyEntityDetectedComponent', 'TileListenerComponent'])

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
	walkProgress: number = 1
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

	subscribedToTiles: Set<Tile> = new Set()
	onListenedTileOccupationChanged = (listener: Entity & TileListenerComponent, tile: Tile, entity?: (Entity & TilesIncumbent)) => {
		console.log('listener', listener.id, 'fired on tile x', tile.x, 'y', tile.y, 'because of', entity)
	}
}

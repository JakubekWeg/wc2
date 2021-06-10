import {
	ComponentNameType,
	FacingDirection,
	SpriteDrawableComponent,
	TickComponent,
	TilePosition,
	TilesIncumbent,
	WalkableComponent,
} from './components'

export class Entity {
	static components: Set<ComponentNameType> = new Set<ComponentNameType>()
	public readonly id: number = 0
}

export class ArcherEntity
	extends Entity
	implements TilesIncumbent, SpriteDrawableComponent,
		TickComponent, WalkableComponent {
	static components = new Set<ComponentNameType>(['SpriteDrawableComponent', 'TilesIncumbent', 'TickComponent', 'WalkableComponent'])

	occupiedTilesSize = 1
	occupiedTiles: TilePosition[] = []
	imageIndex = 0
	destinationDrawX = 0
	destinationDrawY = 0
	spriteSize = 72
	sourceDrawY = 0
	walkProgress = 0
	sourceDrawX = 72 * FacingDirection.North
	walkDirection = FacingDirection.North
	currentWalkDestination = undefined
	pathDirections: FacingDirection[] = []

	walkingAnimationFrames = [
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
	standingAnimationFrames = [0]
	currentAnimationFrame = 0

	update(tick: number) {
	}
}

export class Farm extends Entity
	implements TilesIncumbent, SpriteDrawableComponent {
	static components = new Set<ComponentNameType>(['SpriteDrawableComponent', 'TilesIncumbent'])
	occupiedTilesSize = 2
	occupiedTiles: TilePosition[] = []
	imageIndex = 2
	destinationDrawX = 0
	destinationDrawY = 0
	sourceDrawX = 0
	sourceDrawY = 0
	spriteSize = 64
}

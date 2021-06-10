export type ComponentNameType = 'TilesIncumbent' | 'SpriteDrawableComponent' | 'TickComponent' | 'WalkableComponent'


export interface TilePosition {
	x: number
	y: number
}

export interface TilesIncumbent {
	occupiedTiles: TilePosition[]
	occupiedTilesSize: number
}

export enum FacingDirection {
	SouthWest = 0,
	West = 1,
	NorthWest = 2,
	North = 3,
	NorthEast = 4,
	East = 5,
	SouthEast = 6,
	South = 7,
}

const tmpDirectionVector: [number, number] = [0,0]
export const facingDirectionToVector = (dir: FacingDirection): [number, number] => {
	switch (dir) {
		case FacingDirection.SouthWest:
			tmpDirectionVector[0] = -1
			tmpDirectionVector[1] = 1
			break
		case FacingDirection.West:
			tmpDirectionVector[0] = -1
			tmpDirectionVector[1] = 0
			break
		case FacingDirection.NorthWest:
			tmpDirectionVector[0] = -1
			tmpDirectionVector[1] = -1
			break
		case FacingDirection.North:
			tmpDirectionVector[0] = 0
			tmpDirectionVector[1] = -1
			break
		case FacingDirection.NorthEast:
			tmpDirectionVector[0] = 1
			tmpDirectionVector[1] = -1
			break
		case FacingDirection.East:
			tmpDirectionVector[0] = 1
			tmpDirectionVector[1] = 0
			break
		case FacingDirection.SouthEast:
			tmpDirectionVector[0] = 1
			tmpDirectionVector[1] = 1
			break
		case FacingDirection.South:
			tmpDirectionVector[0] = 0
			tmpDirectionVector[1] = 1
			break
		default:
			throw new Error('Invalid direction ' + dir)
	}
	return tmpDirectionVector
}

export interface WalkableComponent {
	walkProgress: number
	walkDirection: FacingDirection
	currentWalkDestination?: TilePosition
	pathDirections: FacingDirection[]
	walkingAnimationFrames: number[]
	standingAnimationFrames: number[]
	currentAnimationFrame: number
}

export interface SpriteDrawableComponent {
	sourceDrawX: number
	sourceDrawY: number
	destinationDrawX: number
	destinationDrawY: number
	spriteSize: number
	imageIndex: number
}

export interface TickComponent {
	update(tick: number): void;
}

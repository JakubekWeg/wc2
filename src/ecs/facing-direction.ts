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

const tmpDirectionVector: [number, number] = [0, 0]
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

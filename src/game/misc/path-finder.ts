import { isInRectRange2 } from '../ecs/entities/common'
import { FacingDirection } from './facing-direction'
import SortedList from './sorted-list'

const maxTiles = 50
/**
 * Checks if node is walkable
 * Must return true if node exists and is walkable
 * Must return false otherwise
 */
export type WalkableTester = ((x: number, y: number) => boolean)

/**
 * Simple entity that represents point in 2D
 */
export interface Position {
	x: number
	y: number
}

interface Node extends Position {
	/**
	 * Distance from starting node
	 */
	costG: number
	/**
	 * Distance from end node (heuristic)
	 */
	costH: number
	/**
	 * costG + costH
	 */
	costF: number
	parent?: Node
	directionToGetFromParent?: FacingDirection
}

/**
 * Finds the path between two points
 * Always finds a full path
 * Returns list of directions or null if failed to find a path
 * @param sx x coordinate of start
 * @param sy y coordinate of start
 * @param dx x coordinate of destination
 * @param dy y coordinate of destination
 * @param tester callback which will be executed to check if tile is walkable or not
 * @returns list of directions between points start and destination, returns null if failed to determine path
 */
export const findPathDirectionsExact = (sx: number, sy: number,
                                        dx: number, dy: number,
                                        tester: WalkableTester): FacingDirection[] | null => {

	const calculateCost = (x1: number, y1: number,
	                       x2: number, y2: number): number => {
		// return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * 10
		const offsetX = Math.abs(x1 - x2)
		const offsetY = Math.abs(y1 - y2)
		const nonDiagonalMoves = Math.abs(offsetX - offsetY)
		return nonDiagonalMoves * 10 + Math.min(offsetX, offsetY) * 14
	}

	const calculateCostG = (x: number, y: number) => calculateCost(x, y, sx, sy)
	const calculateCostH = (x: number, y: number) => calculateCost(x, y, dx, dy)

	const createNode = (x: number, y: number, dir?: FacingDirection): Node => {
		const costG = calculateCostG(x, y)
		const costH = calculateCostH(x, y)
		return {
			x, y, costH, costG,
			costF: costG + costH,
			directionToGetFromParent: dir,
		}
	}


	const fCostComparator = (o1: Node, o2: Node) => o1.costF < o2.costF

	const openNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)
	const closedNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)


	const executeWithWalkableNeighboursNotInClosed = (x: number, y: number, callback: (n: Node) => void) => {
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.West))
		y--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthWest))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.North))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthEast))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.East))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthEast))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.South))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthWest))
	}

	openNodes.add(createNode(sx, sy))

	while (true) {
		const current = openNodes.getAndRemoveFirst()
		if (!current) {
			// unable to find path :/
			return null
		}
		closedNodes.add(current)

		if (current.x === dx && current.y === dy) {
			// found path!
			const stack: FacingDirection[] = []
			let tmp: Node | undefined = current
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}

		executeWithWalkableNeighboursNotInClosed(current.x, current.y, (neighbour) => {
			if (!openNodes.has(e => e.x === neighbour.x && e.y === neighbour.y)) {
				neighbour.parent = current
				openNodes.add(neighbour)
			}
		})

	}
}

/**
 * Finds the path between two points
 * It may return path that stops near the destination, if destination is occupied
 * Returns list of directions or null if failed to find a path
 * @param sx x coordinate of start
 * @param sy y coordinate of start
 * @param dx x coordinate of destination
 * @param dy y coordinate of destination
 * @param tester callback which will be executed to check if tile is walkable or not
 * @returns list of directions between points start and destination, final direction may not be destination
 */
export const findPathDirectionsCoarse = (sx: number, sy: number,
                                         dx: number, dy: number,
                                         tester: WalkableTester): FacingDirection[] => {

	const calculateCost = (x1: number, y1: number,
	                       x2: number, y2: number): number => {
		// return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * 10
		const offsetX = Math.abs(x1 - x2)
		const offsetY = Math.abs(y1 - y2)
		const nonDiagonalMoves = Math.abs(offsetX - offsetY)
		return nonDiagonalMoves * 10 + Math.min(offsetX, offsetY) * 14
	}

	const calculateCostG = (x: number, y: number) => calculateCost(x, y, sx, sy)
	const calculateCostH = (x: number, y: number) => calculateCost(x, y, dx, dy)

	const createNode = (x: number, y: number, dir?: FacingDirection): Node => {
		const costG = calculateCostG(x, y)
		const costH = calculateCostH(x, y)
		return {
			x, y, costH, costG,
			costF: costG + costH,
			directionToGetFromParent: dir,
		}
	}


	const fCostComparator = (o1: Node, o2: Node) => o1.costF < o2.costF

	const openNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)
	const closedNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)


	const executeWithWalkableNeighboursNotInClosed = (x: number, y: number, callback: (n: Node) => void) => {
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.West))
		y--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthWest))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.North))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthEast))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.East))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthEast))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.South))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthWest))
	}

	openNodes.add(createNode(sx, sy))

	while (true) {
		const current = openNodes.getAndRemoveFirst()
		if (!current || closedNodes.size() > maxTiles) {
			// unable to find path or limit reached :/
			// fallback
			const stack: FacingDirection[] = []
			const list = closedNodes.getRawList()
			list.sort((a, b) => a.costH - b.costH)
			let tmp: Node | undefined = list[0]
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}
		closedNodes.add(current)

		if (current.x === dx && current.y === dy) {
			// found path!
			const stack: FacingDirection[] = []
			let tmp: Node | undefined = current
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}

		executeWithWalkableNeighboursNotInClosed(current.x, current.y, (neighbour) => {
			if (!openNodes.has(e => e.x === neighbour.x && e.y === neighbour.y)) {
				neighbour.parent = current
				openNodes.add(neighbour)
			}
		})

	}
}


/**
 * Finds the path between two points
 * It may return path that stops near the destination, if destination is occupied
 * Returns list of directions or null if failed to find a path
 * @param sx x coordinate of start
 * @param sy y coordinate of start
 * @param dx x coordinate of destination
 * @param dy y coordinate of destination
 * @param dl x coordinate of left side of destination
 * @param dt y coordinate of top side of destination
 * @param dr x coordinate of right side of destination
 * @param db y coordinate of bottom side of destination
 * @param tester callback which will be executed to check if tile is walkable or not
 * @returns list of directions between points start and destination, final direction may not be destination
 */
export const findPathDirectionsCoarseRectDestination = (sx: number, sy: number,
                                                        dx: number, dy: number,
                                                        dl: number, dt: number,
                                                        dr: number, db: number,
                                                        tester: WalkableTester): FacingDirection[] => {

	const calculateCost = (x1: number, y1: number,
	                       x2: number, y2: number): number => {
		// return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * 10
		const offsetX = Math.abs(x1 - x2)
		const offsetY = Math.abs(y1 - y2)
		const nonDiagonalMoves = Math.abs(offsetX - offsetY)
		return nonDiagonalMoves * 10 + Math.min(offsetX, offsetY) * 14
	}

	const calculateCostG = (x: number, y: number) => calculateCost(x, y, sx, sy)
	const calculateCostH = (x: number, y: number) => calculateCost(x, y, dx, dy)

	const createNode = (x: number, y: number, dir?: FacingDirection): Node => {
		const costG = calculateCostG(x, y)
		const costH = calculateCostH(x, y)
		return {
			x, y, costH, costG,
			costF: costG + costH,
			directionToGetFromParent: dir,
		}
	}


	const fCostComparator = (o1: Node, o2: Node) => o1.costF < o2.costF

	const openNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)
	const closedNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)


	const executeWithWalkableNeighboursNotInClosed = (x: number, y: number, callback: (n: Node) => void) => {
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.West))
		y--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthWest))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.North))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthEast))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.East))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthEast))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.South))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthWest))
	}

	openNodes.add(createNode(sx, sy))

	while (true) {
		const current = openNodes.getAndRemoveFirst()
		if (!current || closedNodes.size() > maxTiles) {
			// unable to find path or limit reached :/
			// fallback
			const stack: FacingDirection[] = []
			const list = closedNodes.getRawList()
			list.sort((a, b) => a.costH - b.costH)
			let tmp: Node | undefined = list[0]
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}
		closedNodes.add(current)

		if (isInRectRange2(current.x, current.y, dl, dt, dr, db)) {
			// found path!
			const stack: FacingDirection[] = []
			let tmp: Node | undefined = current
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}

		executeWithWalkableNeighboursNotInClosed(current.x, current.y, (neighbour) => {
			if (!openNodes.has(e => e.x === neighbour.x && e.y === neighbour.y)) {
				neighbour.parent = current
				openNodes.add(neighbour)
			}
		})

	}
}


/**
 * Finds the path between two points
 * It may return path that stops near the destination, if destination is occupied
 * Returns list of directions or null if failed to find a path
 * @returns list of directions between points start and destination, final direction may not be destination
 */
export const findPathDirectionsCoarseRectDestination2 = (sx: number, sy: number,
                                                         dx: number, dy: number,
                                                         dl: number, dt: number,
                                                         range: number, size: number,
                                                         tester: WalkableTester): FacingDirection[] => {

	const calculateCost = (x1: number, y1: number,
	                       x2: number, y2: number): number => {
		// return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * 10
		const offsetX = Math.abs(x1 - x2)
		const offsetY = Math.abs(y1 - y2)
		const nonDiagonalMoves = Math.abs(offsetX - offsetY)
		return nonDiagonalMoves * 10 + Math.min(offsetX, offsetY) * 14
	}

	const calculateCostG = (x: number, y: number) => calculateCost(x, y, sx, sy)
	const calculateCostH = (x: number, y: number) => calculateCost(x, y, dx, dy)

	const createNode = (x: number, y: number, dir?: FacingDirection): Node => {
		const costG = calculateCostG(x, y)
		const costH = calculateCostH(x, y)
		return {
			x, y, costH, costG,
			costF: costG + costH,
			directionToGetFromParent: dir,
		}
	}


	const fCostComparator = (o1: Node, o2: Node) => o1.costF < o2.costF

	const openNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)
	const closedNodes: SortedList<Node> = new SortedList<Node>(fCostComparator)


	const executeWithWalkableNeighboursNotInClosed = (x: number, y: number, callback: (n: Node) => void) => {
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.West))
		y--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthWest))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.North))
		x++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.NorthEast))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.East))
		y++
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthEast))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.South))
		x--
		if (tester(x, y) && !closedNodes.has(n => x === n.x && y === n.y))
			callback(createNode(x, y, FacingDirection.SouthWest))
	}

	openNodes.add(createNode(sx, sy))

	while (true) {
		const current = openNodes.getAndRemoveFirst()
		if (!current || closedNodes.size() > maxTiles) {
			// unable to find path or limit reached :/
			// fallback
			const stack: FacingDirection[] = []
			const list = closedNodes.getRawList()
			list.sort((a, b) => a.costH - b.costH)
			let tmp: Node | undefined = list[0]
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}
		closedNodes.add(current)

		const isInRange =
			dl - range <= current.x
			&& dt - range <= current.y
			&& dl + size + range > current.x
			&& dt + size + range > current.y

		if (isInRange) {
			// found path!
			const stack: FacingDirection[] = []
			let tmp: Node | undefined = current
			while (tmp != null) {
				stack.unshift(tmp.directionToGetFromParent!)
				tmp = tmp.parent
			}
			stack.shift()
			return stack
		}

		executeWithWalkableNeighboursNotInClosed(current.x, current.y, (neighbour) => {
			if (!openNodes.has(e => e.x === neighbour.x && e.y === neighbour.y)) {
				neighbour.parent = current
				openNodes.add(neighbour)
			}
		})

	}
}

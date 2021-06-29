import GameSettings from '../../misc/game-settings'
import { TileListenerComponent, TilesIncumbentComponent } from '../components'
import World, { Entity } from '../world'

export interface Tile {
	readonly x: number,
	readonly y: number,
	readonly occupiedBy?: Entity & TilesIncumbentComponent
	readonly buildable: boolean
	readonly walkable: boolean

	addListener(listener: Entity & TileListenerComponent): void

	removeListener(listener: Entity & TileListenerComponent): void
}

export class TileImpl implements Tile {
	public occupiedBy?: Entity & TilesIncumbentComponent
	public buildable: boolean = false
	public walkable: boolean = false
	private listeners = new Set<Entity & TileListenerComponent>()

	constructor(public readonly x: number,
	            public readonly y: number,
	) {
	}

	getListenersCount() {
		return this.listeners.size
	}

	forceSetOccupiedByAndCallListeners(occupiedBy?: Entity & TilesIncumbentComponent) {
		const last = this.occupiedBy
		this.occupiedBy = occupiedBy
		for (const listener of this.listeners) {
			listener.onListenedTileOccupationChanged(listener, this, last, occupiedBy)
		}
	}

	addListener(listener: Entity & TileListenerComponent) {
		listener.subscribedToTiles.add(this)
		this.listeners.add(listener)
	}

	removeListener(listener: Entity & TileListenerComponent) {
		listener.subscribedToTiles.delete(this)
		this.listeners.delete(listener)
	}
}

export interface TileSystem {
	addListenersForRect(x: number, y: number, w: number, h: number, listener: Entity & TileListenerComponent): void

	addListenersForRectAndGet<T extends Entity & TilesIncumbentComponent>
	(x: number, y: number, w: number, h: number,
	 listener: Entity & TileListenerComponent,
	 filter: (obj: T) => boolean): Set<T>

	removeListenerFromAllTiles(listener: Entity & TileListenerComponent): void

	/**
	 * Returns tile at that position, throws if invalid coords
	 */
	get(x: number, y: number): Tile

	/**
	 * Returns true if tile at this position is walkable
	 * Returns false if tile is occupied or coords are invalid
	 */
	isTileWalkableNoThrow(x: number, y: number): boolean

	/**
	 * Returns true if tile at this position is walkable
	 * Returns false if tile is occupied or coords are invalid
	 */
	isTileBuildableNoThrow(x: number, y: number): boolean

	/**
	 * Returns true if are tile at this position are walkable
	 * Returns false if any of tile is occupied or coords of any are invalid
	 */
	areTilesBuildableNoThrow(x: number, y: number, s: number): boolean

	/**
	 * Updates occupation field inside index
	 * Throws if attempt to occupy a field that is being occupied by a different entity
	 */
	updateRegistryThrow(x: number,
	                    y: number,
	                    occupiedBy?: Entity & TilesIncumbentComponent): void


	/**
	 * Updates occupation field inside index
	 * Returns false if attempt to occupy a field that is being occupied by a different entity
	 * Returns true if field was updated successfully
	 * Throws only if invalid coords given
	 */
	updateRegistryCheck(x: number,
	                    y: number,
	                    occupiedBy?: Entity & TilesIncumbentComponent): boolean


	/**
	 * Moves occupation from one field to another
	 * Returns false if attempt to occupy a field that is being occupied by a different entity
	 * Returns true if field was updated successfully
	 * Throws only if invalid coords given
	 */
	moveOccupationAtOnce(sx: number,
	                     sy: number,
	                     dx: number,
	                     dy: number): boolean

	/**
	 * Moves occupation from one field to another
	 * Returns false if attempt to occupy a field that is being occupied by a different entity or coords are invalid
	 * Returns true if field was updated successfully
	 */
	moveOccupationAtOnceNoThrow(sx: number,
	                            sy: number,
	                            dx: number,
	                            dy: number): boolean
}

export interface TileTerrainSystem {

	updateBuildableStatusNoThrow(x: number,
	                             y: number,
	                             buildable: boolean): void

	updateWalkableStatusNoThrow(x: number,
	                            y: number,
	                            walkable: boolean): void
}

/**
 * Index of tiles data, stores information about entities that occupy certain tiles
 */
class TileSystemImpl implements TileSystem, TileTerrainSystem {
	private readonly size: number
	private readonly tiles: TileImpl[] = []

	constructor(private readonly settings: GameSettings,
	            // private readonly game: GameInstanceImpl,
	            private readonly world: World) {
		this.size = settings.mapSize
		this.tiles.length = this.size * this.size
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				this.tiles[i * this.size + j] = new TileImpl(j, i)
			}
		}
		const self = this

		world.registerIndex({
			components: ['TilesIncumbentComponent'],
			entityAdded(entity: Entity & TilesIncumbentComponent) {
				for (let i = 0; i < entity.tileOccupySize; i++) {
					for (let j = 0; j < entity.tileOccupySize; j++) {
						self.updateRegistryThrow(entity.mostWestTile + i, entity.mostNorthTile + j, entity)
					}
				}
			},
			entityRemoved(entity: Entity & TilesIncumbentComponent) {
				for (let i = 0; i < entity.tileOccupySize; i++) {
					for (let j = 0; j < entity.tileOccupySize; j++) {
						self.updateRegistryThrow(entity.mostWestTile + i, entity.mostNorthTile + j, undefined)
					}
				}
			},
		})
		world.registerIndex({
			components: ['TileListenerComponent'],
			entityAdded(_: Entity & TileListenerComponent) {
			},
			entityRemoved(entity: Entity & TileListenerComponent) {
				self.removeListenerFromAllTiles(entity)
			},
		})
	}

	updateWalkableStatusNoThrow(x: number, y: number, walkable: boolean): void {
		if (!this.checkCoords(x, y))
			return
		this.getUnsafe(x, y).walkable = walkable
	}

	updateBuildableStatusNoThrow(x: number, y: number, buildable: boolean): void {
		if (!this.checkCoords(x, y))
			return
		this.getUnsafe(x, y).buildable = buildable
	}


	public addListenersForRect(x: number, y: number, w: number, h: number,
	                           listener: Entity & TileListenerComponent) {
		if (x < 0) {
			w -= -x
			x = 0
		}
		if (y < 0) {
			h -= -y
			y = 0
		}
		const right = Math.min(x + w, this.size)
		const bottom = Math.min(y + h, this.size)
		for (let i = x; i < right; i++) {
			for (let j = y; j < bottom; j++) {
				this.tiles[j * this.size + i].addListener(listener)
			}
		}
	}

	public addListenersForRectAndGet<T extends Entity & TilesIncumbentComponent>
	(x: number, y: number, w: number, h: number,
	 listener: Entity & TileListenerComponent,
	 filter: (obj: T) => boolean): Set<T> {
		const entities = new Set<T>()
		if (x < 0) {
			w -= -x
			x = 0
		}
		if (y < 0) {
			h -= -y
			y = 0
		}
		const right = Math.min(x + w, this.size)
		const bottom = Math.min(y + h, this.size)
		for (let i = x; i < right; i++) {
			for (let j = y; j < bottom; j++) {
				const tile = this.tiles[j * this.size + i]
				tile.addListener(listener)
				if (tile.occupiedBy != null && filter(tile.occupiedBy as T))
					entities.add(tile.occupiedBy as T)
			}
		}
		return entities
	}

	public removeListenerFromAllTiles(listener: Entity & TileListenerComponent) {
		for (const currentSubscription of listener.subscribedToTiles)
			currentSubscription.removeListener(listener)
		// listener.subscribedToTiles.clear() // no need since removeListener removes too
	}

	public get(x: number, y: number): Tile {
		this.forceValidateCoords(x, y)
		return this.getUnsafe(x, y)
	}

	public isTileWalkableNoThrow(x: number, y: number): boolean {
		if (!this.checkCoords(x, y))
			return false
		const tile = this.getUnsafe(x, y)
		return tile.walkable && !tile.occupiedBy
	}

	public isTileBuildableNoThrow(x: number, y: number): boolean {
		if (!this.checkCoords(x, y))
			return false
		const tile = this.getUnsafe(x, y)
		return tile.buildable && !tile.occupiedBy
	}

	public areTilesBuildableNoThrow(x: number, y: number, s: number): boolean {
		if (x < 0 || x + s >= this.size || y < 0 || y + s >= this.size)
			return false
		for (let i = 0; i < s; i++) {
			for (let j = 0; j < s; j++) {
				const tile = this.getUnsafe(x + i, y + j)
				if (!tile.buildable || tile.occupiedBy != null) {
					return false
				}
			}
		}
		return true
	}

	public updateRegistryThrow(x: number,
	                           y: number,
	                           occupiedBy?: Entity & TilesIncumbentComponent): void {
		if (x < 0 || x >= this.size || y < 0 || y >= this.size)
			throw new Error(`Invalid tile index x=${x} y=${y}`)
		const tile = this.tiles[y * this.size + x]
		if (tile.occupiedBy != null && occupiedBy != null && tile.occupiedBy !== occupiedBy)
			throw new Error(`Attempt to make tile occupied, but there is someone who already occupies it x=${x} y=${y} now=${tile.occupiedBy.id} new=${occupiedBy.id}`)
		tile.forceSetOccupiedByAndCallListeners(occupiedBy)
	}

	public updateRegistryCheck(x: number,
	                           y: number,
	                           occupiedBy?: Entity & TilesIncumbentComponent): boolean {
		this.forceValidateCoords(x, y)
		const tile = this.tiles[y * this.size + x]
		if (tile.occupiedBy != null && occupiedBy != null && tile.occupiedBy !== occupiedBy)
			return false
		tile.forceSetOccupiedByAndCallListeners(occupiedBy)
		return true
	}

	public moveOccupationAtOnce(sx: number,
	                            sy: number,
	                            dx: number,
	                            dy: number): boolean {
		this.forceValidateCoords(sx, sy)
		this.forceValidateCoords(dx, dy)

		return this.moveOccupationAtOnceUnsafe(sx, sy, dx, dy)
	}

	public moveOccupationAtOnceNoThrow(sx: number,
	                                   sy: number,
	                                   dx: number,
	                                   dy: number): boolean {
		if (!this.checkCoords(sx, sy) || !this.checkCoords(dx, dy))
			return false
		return this.moveOccupationAtOnceUnsafe(sx, sy, dx, dy)
	}

	private getUnsafe(x: number, y: number): TileImpl {
		return this.tiles[y * this.size + x]
	}

	private moveOccupationAtOnceUnsafe(sx: number,
	                                   sy: number,
	                                   dx: number,
	                                   dy: number) {
		const destination = this.tiles[dy * this.size + dx]
		if (!destination.walkable || destination.occupiedBy != null)
			return false
		const source = this.tiles[sy * this.size + sx]
		const tmp = source.occupiedBy
		source.forceSetOccupiedByAndCallListeners(undefined)
		destination.forceSetOccupiedByAndCallListeners(tmp)
		return true
	}

	private forceValidateCoords(x: number, y: number) {
		if (!this.checkCoords(x, y))
			throw new Error(`Invalid tile index x=${x} y=${y}`)
	}

	private checkCoords(x: number, y: number) {
		return !(x < 0 || x >= this.size || y < 0 || y >= this.size)

	}
}

export const createTileSystem = (settings: GameSettings,
                                 world: World) => new TileSystemImpl(settings, world)

import { GameInstance } from '../../game-instance'
import GameSettings from '../../misc/game-settings'
import { TileListenerComponent, TilesIncumbentComponent } from '../components'
import World, { Entity } from '../world'

export interface Tile {
	readonly x: number,
	readonly y: number,
	readonly occupiedBy?: Entity & TilesIncumbentComponent

	addListener(listener: Entity & TileListenerComponent): void

	removeListener(listener: Entity & TileListenerComponent): void
}

export class TileImpl implements Tile {
	public occupiedBy?: Entity & TilesIncumbentComponent
	private listeners = new Set<Entity & TileListenerComponent>()

	constructor(public readonly x: number,
	            public readonly y: number,
	) {
	}

	getListeners() {
		return this.listeners.values()
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


/**
 * Index of tiles data, stores information about entities that occupy certain tiles
 */
export default class TileSystem {
	private readonly sizeX: number
	private readonly sizeY: number
	private readonly tiles: TileImpl[] = []

	constructor(private readonly settings: GameSettings,
	            private readonly game: GameInstance,
	            private readonly world: World) {
		this.sizeX = settings.mapWidth
		this.sizeY = settings.mapHeight
		this.tiles.length = this.sizeX * this.sizeY
		for (let i = 0; i < this.sizeX; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				this.tiles[i * this.sizeX + j] = new TileImpl(j, i)
			}
		}
		game.entityEnteredTileEvent.listen((event) => {
			for (let i = 0; i < event.entity.tileOccupySize; i++) {
				for (let j = 0; j < event.entity.tileOccupySize; j++) {
					this.updateRegistryThrow(event.mostWestTile + i, event.mostNorthTile + j, event.entity)
				}
			}
		})
		game.entityLeftTileEvent.listen((event) => {
			for (let i = 0; i < event.entity.tileOccupySize; i++) {
				for (let j = 0; j < event.entity.tileOccupySize; j++) {
					this.updateRegistryThrow(event.mostWestTile + i, event.mostNorthTile + j, undefined)
				}
			}
		})
		world.registerIndex({
			components: ['TilesIncumbentComponent'],
			entityAdded(entity: Entity & TilesIncumbentComponent) {
				game.entityEnteredTileEvent.publish({
					entity, mostNorthTile: entity.mostNorthTile, mostWestTile: entity.mostWestTile,
				})
			},
			entityRemoved(entity: Entity & TilesIncumbentComponent) {
				game.entityEnteredTileEvent.publish({
					entity, mostNorthTile: entity.mostNorthTile, mostWestTile: entity.mostWestTile,
				})
			},
		})
		const self = this
		world.registerIndex({
			components: ['TileListenerComponent'],
			entityAdded(_: Entity & TileListenerComponent) {
			},
			entityRemoved(entity: Entity & TileListenerComponent) {
				self.removeListenerFromAllTiles(entity)
			},
		})
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
		const right = Math.min(x + w, this.sizeX)
		const bottom = Math.min(y + h, this.sizeY)
		for (let i = x; i < right; i++) {
			for (let j = y; j < bottom; j++) {
				this.tiles[j * this.sizeX + i].addListener(listener)
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
		const right = Math.min(x + w, this.sizeX)
		const bottom = Math.min(y + h, this.sizeY)
		for (let i = x; i < right; i++) {
			for (let j = y; j < bottom; j++) {
				const tile = this.tiles[j * this.sizeX + i]
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

	/**
	 * Returns tile at that position, throws if invalid coords
	 */
	public get(x: number, y: number): Tile {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			throw new Error(`Invalid tile index x=${x} y=${y}`)
		return this.tiles[y * this.sizeX + x]
	}

	/**
	 * Returns true if tile at this position is walkable
	 * Returns false if tile is occupied or coords are invalid
	 */
	public isTileWalkableNoThrow(x: number, y: number): boolean {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			return false
		return !this.tiles[y * this.sizeX + x].occupiedBy
	}

	/**
	 * Updates occupation field inside index
	 * Throws if attempt to occupy a field that is being occupied by a different entity
	 */
	public updateRegistryThrow(x: number,
	                           y: number,
	                           occupiedBy?: Entity & TilesIncumbentComponent): void {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			throw new Error(`Invalid tile index x=${x} y=${y}`)
		const tile = this.tiles[y * this.sizeX + x]
		if (tile.occupiedBy != null && occupiedBy != null && tile.occupiedBy !== occupiedBy)
			throw new Error(`Attempt to make tile occupied, but there is someone who already occupies it x=${x} y=${y} now=${tile.occupiedBy.id} new=${occupiedBy.id}`)
		tile.forceSetOccupiedByAndCallListeners(occupiedBy)
	}


	/**
	 * Updates occupation field inside index
	 * Returns false if attempt to occupy a field that is being occupied by a different entity
	 * Returns true if field was updated successfully
	 * Never throws
	 */
	public updateRegistryCheck(x: number,
	                           y: number,
	                           occupiedBy?: Entity & TilesIncumbentComponent): boolean {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			throw new Error(`Invalid tile index x=${x} y=${y}`)
		const tile = this.tiles[y * this.sizeX + x]
		if (tile.occupiedBy != null && occupiedBy != null && tile.occupiedBy !== occupiedBy)
			return false
		tile.forceSetOccupiedByAndCallListeners(occupiedBy)
		return true
	}
}

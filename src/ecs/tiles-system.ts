import GameSettings from '../game/game-settings'
import { TilesIncumbent } from './components'
import { Entity } from './entity-types'


export class Tile {
	public occupiedBy?: Entity & TilesIncumbent

	constructor(public readonly x: number,
	            public readonly y: number,
	            public readonly type: 'land',
	) {
	}
}

export default class TileSystem {
	private readonly sizeX: number
	private readonly sizeY: number
	private readonly tiles: Tile[] = []

	constructor(private readonly settings: GameSettings) {
		this.sizeX = settings.mapWidth
		this.sizeY = settings.mapHeight
		this.tiles.length = this.sizeX * this.sizeY
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				this.tiles[i * this.sizeY + j] = new Tile(j, i, 'land')
			}
		}
	}

	public get(x: number, y: number): Tile {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			throw new Error(`Invalid tile index x=${x} y=${y}`)
		return this.tiles[y * this.sizeY + x]
	}

	public isTileWalkableNoThrow(x: number, y: number): boolean {
		if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
			return false
		return !this.tiles[y * this.sizeY + x].occupiedBy
	}

	public updateRegistrySafe(x: number,
	                          y: number,
	                          occupiedBy?: Entity & TilesIncumbent): void {
		const tile = this.get(x, y)
		if (tile.occupiedBy != null && occupiedBy != null && tile.occupiedBy !== occupiedBy)
			throw new Error(`Attempt to make tile occupied, but there is someone who already occupies it x=${x} y=${y} now=${tile.occupiedBy.id} new=${occupiedBy.id}`)
		tile.occupiedBy = occupiedBy
	}
}

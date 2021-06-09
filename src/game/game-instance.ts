import {
	GraphicCircleComponent,
	SpriteDrawableComponent,
	TickComponent,
	TilesIncumbent,
	WalkableComponent,
} from '../ecs/components'
import { ArcherEntity, Entity, Farm, SimpleCircle } from '../ecs/entity-types'
import TileSystem from '../ecs/tiles-system'
import World, { createSimpleListIndex } from '../ecs/world'
import GameSettings from './game-settings'

export class GameInstance {
	public readonly tiles = new TileSystem(this.settings)
	private executeNextTickList: ((world: World) => void)[] = []
	private readonly ecs = new World()
	public readonly graphicEntitiesGetter = createSimpleListIndex<GraphicCircleComponent>(this.ecs, ['GraphicComponent'])
	public readonly spriteEntities = createSimpleListIndex<SpriteDrawableComponent>(this.ecs, ['SpriteDrawableComponent'])
	public readonly tickUpdateEntities = createSimpleListIndex<TickComponent>(this.ecs, ['TickComponent'])
	public readonly walkingEntities = createSimpleListIndex<WalkableComponent & TilesIncumbent & SpriteDrawableComponent>(this.ecs, ['SpriteDrawableComponent', 'WalkableComponent', 'TilesIncumbent'])
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	constructor(private readonly settings: GameSettings) {
		// @ts-ignore
		window.game = this

		const tiles = this.tiles
		this.ecs.registerIndexAndListener({
			components: ['TilesIncumbent'],
			listensForChangesInComponent: 'TilesIncumbent',
			entityAdded(entity: Entity & TilesIncumbent) {
				for (const {x, y} of entity.occupiedTiles)
					tiles.updateRegistrySafe(x, y, entity)

			},
			entityRemoved(entity: Entity & TilesIncumbent) {
				for (const {x, y} of entity.occupiedTiles)
					tiles.updateRegistrySafe(x, y, undefined)
			},
			entityModified(entity: Entity & TilesIncumbent) {
			},
		})

		this.ecs.registerEntityType(SimpleCircle)
		this.ecs.registerEntityType(ArcherEntity)
		this.ecs.registerEntityType(Farm)
		this.ecs.lockTypes()

		this.dispatchNextTick((world => {
			const createFarm = (left: number, top: number) => {
				const farm = world.spawnEntity(Farm)
				farm.destinationDrawX = 32 * left
				farm.destinationDrawY = 32 * top
				for (let i = 0; i < farm.occupiedTilesSize; i++)
					for (let j = 0; j < farm.occupiedTilesSize; j++)
						farm.occupiedTiles.push({x: left + j, y: top + i})
			}
			createFarm(2, 2)
			createFarm(4, 2)
			createFarm(3, 4)
			createFarm(8, 3)
		}))
	}

	tick(): void {
		try {
			const world = this.ecs
			world.executeTick((tick: number) => {
				for (let i = 0; i < this.executeNextTickList.length; i++) {
					const element = this.executeNextTickList[i]
					element(world)
				}
				this.executeNextTickList.length = 0

				for (const entity of this.walkingEntities()) {
					entity.walkProgress++
					entity.destinationDrawY += 4
					if (entity.walkProgress === 8) {
						for (const tile of entity.occupiedTiles) {
							const {x, y} = tile
							this.tiles.updateRegistrySafe(x, y + 1, entity)
							this.tiles.updateRegistrySafe(x, y, undefined)
							tile.y++
						}

						console.log(0)
						entity.walkProgress = 0
					}
				}

				for (const entity of this.tickUpdateEntities()) {
					entity.update(tick)
				}


			})
		} catch (e) {
			console.error('Critical error, stopping simulation', e)
			this.stopGame()
		}
	}

	dispatchNextTick(action: (world: World) => void) {
		this.executeNextTickList.push(action)
	}

	startGame() {
		if (this.isRunning) throw new Error('Game is already running')
		this.isRunning = true
		this.lastIntervalId = setInterval(() => this.tick(), 100) as any
	}

	stopGame() {
		clearInterval(this.lastIntervalId)
		this.isRunning = false
	}
}

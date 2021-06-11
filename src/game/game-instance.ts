import {
	AnimatedSpriteDrawableComponent, AttackingComponent,
	MovableSpriteDrawableComponent, ProjectileSource,
	SpriteDrawableComponent,
	TileListenerComponent,
	TilesIncumbent,
	WalkableComponent,
} from '../ecs/components'
import { ArrowProjectile, Entity, Farm, GuardTower, TrollAxeThrower } from '../ecs/entity-types'
import TileSystem from '../ecs/tiles-system'
import World, { createSimpleListIndex } from '../ecs/world'
import { ChunkIndexer } from './chunk-indexer'
import GameSettings from './game-settings'
import { initSystemsForInstance } from './systems'

const TICKS_PER_SECOND = 5
export const MILLIS_BETWEEN_TICKS = 1000 / TICKS_PER_SECOND

export interface System {
	onTick(tick: number): void
}

export class GameInstance {
	public readonly tiles = new TileSystem(this.settings)
	public readonly chunkEntityIndex = new ChunkIndexer(this.settings)
	private executeNextTickList: ((world: World) => void)[] = []
	private readonly ecs = new World()
	public readonly attackingEntities = createSimpleListIndex<AttackingComponent & ProjectileSource>(this.ecs, ['AttackingComponent'])
	public readonly spriteEntities = createSimpleListIndex<SpriteDrawableComponent>(this.ecs, ['SpriteDrawableComponent'])
	public readonly walkingEntities = createSimpleListIndex<WalkableComponent & TileListenerComponent & TilesIncumbent & MovableSpriteDrawableComponent & AnimatedSpriteDrawableComponent>(this.ecs,
		['MovableSpriteDrawableComponent', 'WalkableComponent', 'TilesIncumbent', 'AnimatedSpriteDrawableComponent', 'TileListenerComponent'])
	public readonly dynamicSpriteEntities = createSimpleListIndex<MovableSpriteDrawableComponent>(this.ecs, ['MovableSpriteDrawableComponent'])
	public readonly animatedEntities = createSimpleListIndex<AnimatedSpriteDrawableComponent>(this.ecs, ['AnimatedSpriteDrawableComponent'])

	private readonly allSystems: System[] = []

	private isRunning: boolean = false
	private lastIntervalId: number = -1

	constructor(public readonly settings: GameSettings) {
		// @ts-ignore
		window.game = this

		const tiles = this.tiles
		this.ecs.registerIndexAndListener(this.chunkEntityIndex)
		this.ecs.registerIndex({
			components: ['TilesIncumbent'],
			entityAdded(entity: Entity & TilesIncumbent) {
				for (let left = entity.occupiedTilesWest,
					     size = entity.occupiedTilesSize,
					     right = left + size;
				     left < right; left++) {
					for (let top = entity.occupiedTilesNorth,
						     bottom = top + size;
					     top < bottom; top++) {
						tiles.updateRegistryThrow(left, top, entity)
					}
				}
			},
			entityRemoved(entity: Entity & TilesIncumbent) {
				for (let left = entity.occupiedTilesWest,
					     size = entity.occupiedTilesSize,
					     right = left + size;
				     left < right; left++) {
					for (let top = entity.occupiedTilesNorth,
						     bottom = top + size;
					     top < bottom; top++) {
						tiles.updateRegistryThrow(left, top, undefined)
					}
				}
			},
		})

		this.ecs.registerEntityType(GuardTower)
		this.ecs.registerEntityType(Farm)
		this.ecs.registerEntityType(TrollAxeThrower)
		this.ecs.registerEntityType(ArrowProjectile)
		this.ecs.lockTypes()
		initSystemsForInstance(this, this.ecs)

		this.dispatchNextTick((world => {
			const createFarm = (left: number, top: number) => {
				const farm = world.spawnEntity(Farm)
				farm.destinationDrawX = 32 * left
				farm.destinationDrawY = 32 * top
				farm.occupiedTilesWest = left
				farm.occupiedTilesNorth = top

			}

			const createTower = (left: number, top: number) => {
				const tower = world.spawnEntity(GuardTower)
				tower.destinationDrawX = 32 * left
				tower.destinationDrawY = 32 * top
				tower.occupiedTilesWest = left
				tower.occupiedTilesNorth = top
				tower.centerX = tower.destinationDrawX + 32
				tower.centerY = tower.destinationDrawY + 32
				this.tiles.addListenersForRect(left - 3, top - 3, 8, tower)
			}
			// createFarm(4, 2)
			// createFarm(3, 4)
			// createFarm(8, 3)
			const spawnUnit = (left: number, top: number) => {
				const entity = world.spawnEntity(TrollAxeThrower)
				entity.destinationDrawX = left * 32 - 18
				entity.destinationDrawY = top * 32 - 18
				entity.occupiedTilesWest = left
				entity.occupiedTilesNorth = top
				// this.tiles.addListenersForRect(left - 4, top - 4, 8, entity)
			}
			// spawnUnit(0, 0)
			// spawnUnit(5, 5)
			// spawnUnit(6, 7)
			// spawnUnit(5, 5)
			spawnUnit(6, 5)
			// createFarm(2, 2)
			createTower(6, 3)
		}))
	}

	public readonly walkableTester = (x: number, y: number) => this.tiles.isTileWalkableNoThrow(x, y)

	addSystem(s: System): void {
		this.allSystems.push(s)
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

				for (let s of this.allSystems) {
					s.onTick(tick)
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
		this.lastIntervalId = setInterval(() => this.tick(), MILLIS_BETWEEN_TICKS) as any
	}

	stopGame() {
		clearInterval(this.lastIntervalId)
		this.isRunning = false
	}
}

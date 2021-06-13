import {
	AnimatableDrawableComponent, DelayedHideComponent,
	DrawableBaseComponent,
	MovingDrawableComponent,
	TilesIncumbentComponent,
} from './ecs/components'
import { ArcherImpl } from './ecs/entities/archer'
import { ArrowImpl } from './ecs/entities/arrow'
import { FarmImpl } from './ecs/entities/farm'
import { GuardTowerImpl } from './ecs/entities/tower'
import createEventProcessor from './ecs/game-event-processor'
import { LifecycleNotifierSystem } from './ecs/systems/lifecycle-notifier-system'
import TileSystem from './ecs/systems/tiles-system'
import { UpdateStateMachineSystem } from './ecs/systems/update-state-machine-system'
import World, { createSimpleListIndex, Entity } from './ecs/world'
import GameSettings from './misc/game-settings'
import { WalkableTester } from './misc/path-finder'

const TICKS_PER_SECOND = 5
export const MILLIS_BETWEEN_TICKS = 1000 / TICKS_PER_SECOND

export interface System {
	onTick(tick: number): void
}

export interface EntityEnteredTileEvent {
	entity: Entity & TilesIncumbentComponent
	mostWestTile: number
	mostNorthTile: number
}

export interface EntityLeftTileEvent {
	entity: Entity & TilesIncumbentComponent
	mostWestTile: number
	mostNorthTile: number
}

export class GameInstance {
	// public readonly tiles = new TileSystem(this.settings)
	public readonly eventProcessor = createEventProcessor()
	public readonly entityLeftTileEvent = this.eventProcessor.registerNewEvent<EntityLeftTileEvent>()
	public readonly entityEnteredTileEvent = this.eventProcessor.registerNewEvent<EntityEnteredTileEvent>()
	// public readonly chunkEntityIndex = new ChunkIndexer(this.settings)
	private executeNextTickList: ((world: World) => void)[] = []
	private readonly ecs = new World()
	public readonly tiles = new TileSystem(this.settings, this, this.ecs)
	public readonly drawableEntities = createSimpleListIndex<DrawableBaseComponent>(this.ecs, ['DrawableBaseComponent'])
	public readonly movingEntities = createSimpleListIndex<MovingDrawableComponent>(this.ecs, ['MovingDrawableComponent'])
	public readonly animatedDrawableEntities = createSimpleListIndex<AnimatableDrawableComponent>(this.ecs, ['AnimatableDrawableComponent'])
	public readonly delayedHideEntities = createSimpleListIndex<DelayedHideComponent>(this.ecs, ['DelayedHideComponent'])
	private readonly allSystems: System[] = []
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	constructor(public readonly settings: GameSettings) {
		// @ts-ignore
		window.game = this
		this.addSystem(new UpdateStateMachineSystem(this.ecs, this))
		this.ecs.registerIndex(new LifecycleNotifierSystem(this))
		this.ecs.registerEntityType(ArrowImpl)
		this.ecs.registerEntityType(ArcherImpl)
		this.ecs.registerEntityType(GuardTowerImpl)
		this.ecs.registerEntityType(FarmImpl)

		this.ecs.lockTypes()
		this.dispatchNextTick((world) => {
			{
				const archer = world.spawnEntity(ArcherImpl)
				archer.destinationDrawX = -18
				archer.destinationDrawY = -18
				archer.myTeamId = 1
			}

			const createFarm = (left: number, top: number) => {
				const farm = world.spawnEntity(FarmImpl)
				farm.destinationDrawX = 32 * left
				farm.destinationDrawY = 32 * top
				farm.mostWestTile = left
				farm.mostNorthTile = top
			}
			// createFarm(4, 4)
			// createFarm(0, 4)

			const createTower = (left: number, top: number) => {
				const tower = world.spawnEntity(GuardTowerImpl)
				tower.destinationDrawX = 32 * left
				tower.destinationDrawY = 32 * top
				tower.hitBoxCenterX = left + 1
				tower.hitBoxCenterY = top + 1
				tower.mostWestTile = left
				tower.mostNorthTile = top
			}
			createTower(2, 2)
		})

		// initSystemsForInstance(this, this.ecs)

		// this.dispatchNextTick((world => {
		// 	const createFarm = (left: number, top: number) => {
		// 		const farm = world.spawnEntity(Farm)
		// 		farm.destinationDrawX = 32 * left
		// 		farm.destinationDrawY = 32 * top
		// 		farm.occupiedTilesWest = left
		// 		farm.occupiedTilesNorth = top
		//
		// 	}
		//
		// 	const createTower = (left: number, top: number) => {
		// 		const tower = world.spawnEntity(GuardTower)
		// 		tower.destinationDrawX = 32 * left
		// 		tower.destinationDrawY = 32 * top
		// 		tower.occupiedTilesWest = left
		// 		tower.occupiedTilesNorth = top
		// 		tower.centerX = tower.destinationDrawX + 32
		// 		tower.centerY = tower.destinationDrawY + 32
		// 		this.tiles.addListenersForRect(left - 3, top - 3, 8, tower)
		// 	}
		// 	// createFarm(4, 2)
		// 	// createFarm(3, 4)
		// 	// createFarm(8, 3)
		// 	const spawnUnit = (left: number, top: number) => {
		// 		const entity = world.spawnEntity(TrollAxeThrower)
		// 		entity.destinationDrawX = left * 32 - 18
		// 		entity.destinationDrawY = top * 32 - 18
		// 		entity.occupiedTilesWest = left
		// 		entity.occupiedTilesNorth = top
		// 		// this.tiles.addListenersForRect(left - 4, top - 4, 8, entity)
		// 	}
		// 	// spawnUnit(0, 0)
		// 	// spawnUnit(5, 5)
		// 	// spawnUnit(6, 7)
		// 	// spawnUnit(5, 5)
		// 	spawnUnit(6, 5)
		// 	// createFarm(2, 2)
		// 	createTower(6, 3)
		// }))
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
				this.eventProcessor.dispatchAll()
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

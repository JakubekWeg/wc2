import {
	DelayedHideComponent,
	DrawableBaseComponent,
	MovingDrawableComponent,
	TilesIncumbentComponent,
} from './ecs/components'
import { ArcherImpl } from './ecs/entities/archer'
import { ArrowImpl } from './ecs/entities/arrow'
import { FarmImpl } from './ecs/entities/farm'
import { GuardTowerImpl } from './ecs/entities/tower'
import { ForceImpl, neutralForce } from './ecs/force'
import createEventProcessor from './ecs/game-event-processor'
import { AdvanceAnimationsSystem } from './ecs/systems/advance-animations-system'
import { LifecycleNotifierSystem } from './ecs/systems/lifecycle-notifier-system'
import TileSystem from './ecs/systems/tiles-system'
import { UpdateStateMachineSystem } from './ecs/systems/update-state-machine-system'
import World, { createSimpleListIndex, Entity } from './ecs/world'
import GameSettings from './misc/game-settings'

const TICKS_PER_SECOND = 5
export const MILLIS_BETWEEN_TICKS = 1000 / TICKS_PER_SECOND
const ANIMATIONS_PER_TICK = 2

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
	private readonly nextTickExecutionEvent = this.eventProcessor.registerNewEvent<(world: World) => void>()
	// public readonly chunkEntityIndex = new ChunkIndexer(this.settings)
	private readonly ecs = new World()
	public readonly tiles = new TileSystem(this.settings, this, this.ecs)
	public readonly drawableEntities = createSimpleListIndex<DrawableBaseComponent>(this.ecs, ['DrawableBaseComponent'])
	public readonly movingEntities = createSimpleListIndex<MovingDrawableComponent>(this.ecs, ['MovingDrawableComponent'])
	public readonly delayedHideEntities = createSimpleListIndex<DelayedHideComponent>(this.ecs, ['DelayedHideComponent'])
	private readonly allSystems: System[] = []
	private nextTickIsOnlyForAnimations: number = 0
	private readonly advanceAnimationsSystem = new AdvanceAnimationsSystem(this.ecs)
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	constructor(public readonly settings: GameSettings) {
		// @ts-ignore
		window.game = this
		this.addSystem(new UpdateStateMachineSystem(this.ecs, this))
		this.addSystem(this.advanceAnimationsSystem)
		this.ecs.registerIndex(new LifecycleNotifierSystem(this))
		this.ecs.registerEntityType(ArrowImpl)
		this.ecs.registerEntityType(ArcherImpl)
		this.ecs.registerEntityType(GuardTowerImpl)
		this.ecs.registerEntityType(FarmImpl)

		const force1 = new ForceImpl(1, 'One')
		const force2 = new ForceImpl(2, 'Two')

		this.ecs.lockTypes()
		this.dispatchNextTick((world) => {
			const createOrge = (left: number, top: number) => {
				// const archer = world.spawnEntity(FootmanImpl)
				// archer.destinationDrawX = -18 + 32 * left
				// archer.destinationDrawY = -18 + 32 * top
				// archer.mostWestTile = left
				// archer.mostNorthTile = top
				// archer.myForce = 2
				// archer.texture = registry[7]
			}
			const createArcher = (left: number, top: number) => {
				const archer = world.spawnEntity(ArcherImpl)
				archer.destinationDrawX = -18 + 32 * left
				archer.destinationDrawY = -18 + 32 * top
				archer.mostWestTile = left
				archer.mostNorthTile = top
				archer.myForce = force2
			}
			const createFootman = (left: number, top: number) => {
				// const archer = world.spawnEntity(FootmanImpl)
				// archer.destinationDrawX = -18 + 32 * left
				// archer.destinationDrawY = -18 + 32 * top
				// archer.mostWestTile = left
				// archer.mostNorthTile = top
				// archer.myForce = 1
			}

			const createFarm = (left: number, top: number) => {
				const farm = world.spawnEntity(FarmImpl)
				farm.destinationDrawX = 32 * left
				farm.destinationDrawY = 32 * top
				farm.mostWestTile = left
				farm.mostNorthTile = top
				farm.hitBoxCenterX = left + 1
				farm.hitBoxCenterY = top + 1
				farm.myForce = force1
			}

			const createTower = (left: number, top: number) => {
				const tower = world.spawnEntity(GuardTowerImpl)
				tower.destinationDrawX = 32 * left
				tower.destinationDrawY = 32 * top
				tower.hitBoxCenterX = left + 1
				tower.hitBoxCenterY = top + 1
				tower.mostWestTile = left
				tower.mostNorthTile = top
				tower.myForce = neutralForce
			}
			// createFarm(4, 4)
			// createFarm(7, 3)
			// createFarm(9, 3)
			// createFarm(8, 1)
			// createTower(7, 7)
			// createTower(8, 11)
			// createTower(13, 10)
			//
			// createArcher(5,7)
			// createArcher(9,7)
			// createFootman(7,6)
			// createOrge(2,1)
			// createOrge(4,2)
			// createOrge(3,1)
			createArcher(1, 1)
			// createArcher(2, 2)
			// createTower(5, 0)
			createFarm(5, 5)
			// createFarm(7, 5)
			// createFarm(9, 5)
			// createFarm(9, 7)
			// createFarm(9, 9)
			// createFarm(7, 9)
			// createFarm(5, 9)
			// createFarm(5, 7)
		})


		this.nextTickExecutionEvent.listen(foo => foo(this.ecs))
	}

	public get world() {
		return this.ecs
	}

	public readonly walkableTester = (x: number, y: number) => this.tiles.isTileWalkableNoThrow(x, y)

	addSystem(s: System): void {
		this.allSystems.push(s)
	}

	// lastTick: number = 0
	tick(): void {
		const now = Date.now()
		try {
			if (--this.nextTickIsOnlyForAnimations > 0) {
				this.advanceAnimationsSystem.onTick(0)
				return
			}
			// console.log(Date.now() - this.lastTick)
			// this.lastTick = Date.now()
			this.nextTickIsOnlyForAnimations = ANIMATIONS_PER_TICK
			const world = this.ecs
			world.executeTick((tick: number) => {
				for (let s of this.allSystems) {
					s.onTick(tick)
				}

				this.eventProcessor.dispatchAll()
			})
		} catch (e) {
			console.error('Critical error, stopping simulation', e)
			this.stopGame()
		}
		const delta = Date.now() - now

	}

	dispatchNextTick(action: (world: World) => void) {
		// this.executeNextTickList.push(action)
		this.nextTickExecutionEvent.publish(action)
	}

	startGame() {
		if (this.isRunning) throw new Error('Game is already running')
		this.isRunning = true
		this.lastIntervalId = setInterval(() => this.tick(), MILLIS_BETWEEN_TICKS / ANIMATIONS_PER_TICK) as any
	}

	stopGame() {
		clearInterval(this.lastIntervalId)
		this.isRunning = false
	}
}

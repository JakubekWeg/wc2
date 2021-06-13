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
	public get world(){
		return this.ecs;
	}
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

		this.ecs.lockTypes()
		this.dispatchNextTick((world) => {
			{
				const archer = world.spawnEntity(ArcherImpl)
				archer.destinationDrawX = -18
				archer.destinationDrawY = -18
				archer.myTeamId = 1
			}

			{
				const archer = world.spawnEntity(ArcherImpl)
				archer.destinationDrawX = -18 + 32 * 4
				archer.destinationDrawY = -18
				archer.mostWestTile = 4
				archer.myTeamId = 2
			}

			const createFarm = (left: number, top: number) => {
				const farm = world.spawnEntity(FarmImpl)
				farm.destinationDrawX = 32 * left
				farm.destinationDrawY = 32 * top
				farm.mostWestTile = left
				farm.mostNorthTile = top
			}
			createFarm(4, 4)
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
			// createTower(2, 2)
		})

		this.nextTickExecutionEvent.listen(foo => foo(this.ecs))
		this.entityEnteredTileEvent.listen(() => {
			// console.log('enter', Date.now() / 100 % 100000 | 0)
		})
	}

	public readonly walkableTester = (x: number, y: number) => this.tiles.isTileWalkableNoThrow(x, y)

	addSystem(s: System): void {
		this.allSystems.push(s)
	}

	// lastTick: number = 0
	tick(): void {
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

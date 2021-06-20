import Config from '../config/config'
import { DataPack } from './data-pack'
import { ChunkIndexer } from './ecs/chunk-indexer'
import {
	DelayedHideComponent,
	DrawableBaseComponent,
	MovingDrawableComponent,
	SerializableComponent,
} from './ecs/components'
import './ecs/entities/composer'
import { UnitPrototype } from './ecs/entities/composer'
import createEventProcessor from './ecs/game-event-processor'
import { AdvanceAnimationsSystem } from './ecs/systems/advance-animations-system'
import { LifecycleNotifierSystem } from './ecs/systems/lifecycle-notifier-system'
import TileSystem from './ecs/systems/tiles-system'
import { UpdateStateMachineSystem } from './ecs/systems/update-state-machine-system'
import World, { createSimpleListIndex, Entity } from './ecs/world'
import ForcesManager from './forces-manager'
import GameSettings from './misc/game-settings'
import { ResourcesManager } from './misc/resources-manager'
import SeededRandom from './misc/seeded-random'

const TICKS_PER_SECOND = 5
export const MILLIS_BETWEEN_TICKS = 1000 / TICKS_PER_SECOND
const ANIMATIONS_PER_TICK = 2

export interface System {
	onTick(tick: number): void
}

// export interface EntityEnteredTileEvent {
// 	entity: Entity & TilesIncumbentComponent
// 	mostWestTile: number
// 	mostNorthTile: number
// }
//
// export interface EntityLeftTileEvent {
// 	entity: Entity & TilesIncumbentComponent
// 	mostWestTile: number
// 	mostNorthTile: number
// }

export interface GameInstance {
	readonly tiles: TileSystem

	readonly settings: GameSettings

	readonly walkableTester: (x: number, y: number) => boolean

	readonly resources: ResourcesManager
	readonly forces: ForcesManager
	readonly random: SeededRandom
	readonly world: World

	startGame(): void

	stopGame(): void

	dispatchNextTick(action: (world: World) => void): void

	tick(): void

	generateSaveJson(): unknown
}

export interface GameInstanceForRenderer {
	readonly drawableEntities: () => IterableIterator<Entity & DrawableBaseComponent>
	readonly movingEntities: () => IterableIterator<Entity & MovingDrawableComponent>
	readonly delayedHideEntities: () => IterableIterator<Entity & DelayedHideComponent>
}

export class GameInstanceImpl implements GameInstance, GameInstanceForRenderer {
	// public readonly tiles = new TileSystem(this.settings)
	public readonly eventProcessor = createEventProcessor()
	// public readonly entityLeftTileEvent = this.eventProcessor.registerNewEvent<EntityLeftTileEvent>()
	public readonly resources: ResourcesManager = this.dataPack.resources
	public readonly chunkEntityIndex = new ChunkIndexer(this.settings)
	// public readonly entityEnteredTileEvent = this.eventProcessor.registerNewEvent<EntityEnteredTileEvent>()
	private readonly nextTickExecutionEvent = this.eventProcessor.registerNewEvent<(world: World) => void>()
	private readonly ecs = new World()
	public readonly tiles = new TileSystem(this.settings, this, this.ecs)
	public readonly drawableEntities = createSimpleListIndex<DrawableBaseComponent>(this.ecs, ['DrawableBaseComponent'])
	public readonly movingEntities = createSimpleListIndex<MovingDrawableComponent>(this.ecs, ['MovingDrawableComponent'])
	public readonly delayedHideEntities = createSimpleListIndex<DelayedHideComponent>(this.ecs, ['DelayedHideComponent'])
	private readonly serializableEntities = createSimpleListIndex<SerializableComponent>(this.ecs, ['SerializableComponent'])
	private readonly allSystems: System[] = []
	private nextTickIsOnlyForAnimations: number = 0
	private readonly advanceAnimationsSystem = new AdvanceAnimationsSystem(this.ecs)
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	private constructor(public readonly settings: GameSettings,
	                    public readonly dataPack: DataPack,
	                    public readonly forces: ForcesManager,
	                    public readonly random: SeededRandom) {
		// @ts-ignore
		window.game = this
		this.ecs.registerIndexAndListener(this.chunkEntityIndex)
		this.addSystem(new UpdateStateMachineSystem(this.ecs, this))
		this.addSystem(this.advanceAnimationsSystem)
		this.ecs.registerIndex(new LifecycleNotifierSystem(this))
		// this.ecs.registerEntityType(ArrowImpl)
		for (const entityType of this.dataPack.entityTypes) {
			this.ecs.registerEntityType(entityType)
		}
		// this.ecs.registerEntityType(ArcherImpl)
		// this.ecs.registerEntityType(GuardTowerImpl)
		// this.ecs.registerEntityType(FarmImpl)
		//
		// const force1 = new ForceImpl(1, 'One')
		// const force2 = new ForceImpl(2, 'Two')

		this.ecs.lockTypes()
		this.dispatchNextTick((world) => {
			const createArcher = (left: number, top: number) => {
				const archer = world.spawnEntity('critter') as UnitPrototype
				archer.destinationDrawX = 32 * left - (32 - archer.spriteSize) / 2
				archer.destinationDrawY = 32 * top - (32 - archer.spriteSize) / 2
				archer.mostWestTile = left
				archer.mostNorthTile = top
				return archer
			}
			for (let i = 0; i < this.settings.mapWidth; i++) {
				const n = this.random.intMax(this.settings.mapHeight)
				const s = 4
				const m = settings.mapHeight / s | 0
				for (let j = n; j < m * s; j += s) {
					createArcher(i, j % settings.mapHeight)
				}
			}
		})

		this.nextTickExecutionEvent.listen(foo => foo(this.ecs))
	}

	public get world() {
		return this.ecs
	}

	public static createNewGame(settings: GameSettings,
	                            dataPack: DataPack): GameInstanceImpl {
		return new GameInstanceImpl(settings,
			dataPack,
			ForcesManager.createNew(),
			// SeededRandom.createWithRandomSeed()
			SeededRandom.fromSeed(1),
		)
	}

	public static loadGameFromObj(dataPack: DataPack,
	                              obj: Config): GameInstanceImpl {
		const settings: GameSettings = {
			mapHeight: obj.requirePositiveInt('mapHeight'),
			mapWidth: obj.requirePositiveInt('mapWidth'),
		}
		const game = new GameInstanceImpl(settings,
			dataPack,
			ForcesManager.deserialize(obj.child('forces')),
			SeededRandom.deserialize(obj.child('random')))

		const entities: [Entity & SerializableComponent, Config][] = []
		for (const [key, description] of obj.child('entities').objectEntries()) {
			const entity = game.ecs.spawnEntityWithId(description.requireString('prototype'), +key) as Entity & SerializableComponent
			entity.deserializeFromObject(description)
			entities.push([entity, description])
		}

		game.ecs.resumeFromTick(
			obj.requirePositiveInt('tick'),
			obj.requirePositiveInt('nextEntityId'))
		for (const [entity, description] of entities) {
			entity.postSetup({
				game: game,
				world: game.ecs,
			}, description)
		}
		return game
	}

	public readonly walkableTester = (x: number, y: number) => this.tiles.isTileWalkableNoThrow(x, y)

	addSystem(s: System): void {
		this.allSystems.push(s)
	}

	// lastTick: number = 0
	tick(): void {
		const startTime = performance.now()
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
		const delta = performance.now() - startTime
		if (delta > 10)
			console.log('Took', delta, 'ms to execute update!, quite a lot')
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

	generateSaveJson(): unknown {
		const obj: any = {
			tick: this.ecs.lastExecutedTick,
			nextEntityId: this.ecs.publicNextEntityId,
			mapWidth: this.settings.mapWidth,
			mapHeight: this.settings.mapHeight,
			entities: {},
			forces: this.forces.serialize(),
			random: this.random.serialize(),
		}

		for (const entity of this.serializableEntities()) {
			obj.entities[entity.id] = entity.serializeToJson()
		}
		return JSON.parse(JSON.stringify(obj))
	}
}

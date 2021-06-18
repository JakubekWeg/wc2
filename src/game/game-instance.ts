import {
	DelayedHideComponent,
	DrawableBaseComponent,
	MovingDrawableComponent,
	SerializableComponent,
} from './ecs/components'
import './ecs/entities/composer'
import createEventProcessor from './ecs/game-event-processor'
import { AdvanceAnimationsSystem } from './ecs/systems/advance-animations-system'
import { LifecycleNotifierSystem } from './ecs/systems/lifecycle-notifier-system'
import TileSystem from './ecs/systems/tiles-system'
import { UpdateStateMachineSystem } from './ecs/systems/update-state-machine-system'
import World, { createSimpleListIndex, Entity, EntityType } from './ecs/world'
import GameSettings from './misc/game-settings'

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

export class GameInstance {
	// public readonly tiles = new TileSystem(this.settings)
	public readonly eventProcessor = createEventProcessor()
	// public readonly entityLeftTileEvent = this.eventProcessor.registerNewEvent<EntityLeftTileEvent>()
	// public readonly entityEnteredTileEvent = this.eventProcessor.registerNewEvent<EntityEnteredTileEvent>()
	private readonly nextTickExecutionEvent = this.eventProcessor.registerNewEvent<(world: World) => void>()
	// public readonly chunkEntityIndex = new ChunkIndexer(this.settings)
	private readonly ecs = new World()
	public readonly tiles = new TileSystem(this.settings, this, this.ecs)
	public readonly serializableEntities = createSimpleListIndex<SerializableComponent>(this.ecs, ['SerializableComponent'])
	public readonly drawableEntities = createSimpleListIndex<DrawableBaseComponent>(this.ecs, ['DrawableBaseComponent'])
	public readonly movingEntities = createSimpleListIndex<MovingDrawableComponent>(this.ecs, ['MovingDrawableComponent'])
	public readonly delayedHideEntities = createSimpleListIndex<DelayedHideComponent>(this.ecs, ['DelayedHideComponent'])
	private readonly allSystems: System[] = []
	private nextTickIsOnlyForAnimations: number = 0
	private readonly advanceAnimationsSystem = new AdvanceAnimationsSystem(this.ecs)
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	private constructor(public readonly settings: GameSettings) {
		// @ts-ignore
		window.game = this
		this.addSystem(new UpdateStateMachineSystem(this.ecs, this))
		this.addSystem(this.advanceAnimationsSystem)
		this.ecs.registerIndex(new LifecycleNotifierSystem(this))
		// this.ecs.registerEntityType(ArrowImpl)
		for (const entityType of this.settings.entityTypes) {
			this.ecs.registerEntityType(entityType)
		}
		// this.ecs.registerEntityType(ArcherImpl)
		// this.ecs.registerEntityType(GuardTowerImpl)
		// this.ecs.registerEntityType(FarmImpl)
		//
		// const force1 = new ForceImpl(1, 'One')
		// const force2 = new ForceImpl(2, 'Two')

		this.ecs.lockTypes()
		// this.dispatchNextTick((world) => {
		// 	// const createArcher = (left: number, top: number, force: Force = force1) => {
		// 	// 	const archer = world.spawnEntity('archer') as UnitPrototype
		// 	// 	archer.destinationDrawX = -18 + 32 * left
		// 	// 	archer.destinationDrawY = -18 + 32 * top
		// 	// 	archer.mostWestTile = left
		// 	// 	archer.mostNorthTile = top
		// 	// 	archer.myForce = force
		// 	// 	return archer
		// 	// }
		// 	// createArcher(1, 1, force1)
		// 	// createArcher(8, 1, force2)
		// })

		this.nextTickExecutionEvent.listen(foo => foo(this.ecs))
	}

	public get world() {
		return this.ecs
	}

	public static createNewGame(settings: GameSettings): GameInstance {
		return new GameInstance(settings)
	}

	public static loadGameFromObj(entityTypes: EntityType[], obj: any): GameInstance {
		const settings: GameSettings = {
			mapHeight: obj.mapHeight,
			mapWidth: obj.mapWidth,
			entityTypes: [...entityTypes],
		}
		const game = new GameInstance(settings)

		const entities: [Entity & SerializableComponent, any][] = []
		for (const key in obj.entities) {
			if (obj.entities.hasOwnProperty(key)) {
				const description = obj.entities[key]
				const entity = game.world.spawnEntityWithId(description.prototype, +key) as Entity & SerializableComponent
				entity.deserializeFromJson(description)
				entities.push([entity, description])
			}
		}
		for (const [entity, description] of entities) {
			entity.postSetup({
				game: game,
				world: game.ecs,
			}, description)
		}
		game.world.resumeFromTick(obj.tick, obj.nextEntityId)
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

	generateSaveJson(): any {
		const obj: any = {
			tick: this.world.lastExecutedTick,
			nextEntityId: this.world.publicNextEntityId,
			mapWidth: this.settings.mapWidth,
			mapHeight: this.settings.mapHeight,
			entities: {},
		}

		for (const entity of this.serializableEntities()) {
			obj.entities[entity.id] = entity.serializeToJson()
		}
		return JSON.parse(JSON.stringify(obj))
	}
}

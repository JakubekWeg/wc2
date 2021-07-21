import { GameInstanceImpl, System } from '../../game-instance'
import { ComponentNameType, TicksToLiveComponent } from '../components'
import { Entity, Index } from '../world'

export class TicksToLiveCleaner implements Index<Entity & TicksToLiveComponent>, System {
	readonly components: ComponentNameType[] = ['TicksToLiveComponent']

	private entities = new Set<Entity & TicksToLiveComponent>()

	constructor(private readonly game: GameInstanceImpl) {
	}

	entityAdded(entity: Entity & TicksToLiveComponent): void {
		if (entity.removeMeAtTick === 0)
			entity.removeMeAtTick = this.game.world.lastExecutedTick + entity.ticksToLive - 1
		this.entities.add(entity)
	}

	entityRemoved(entity: Entity & TicksToLiveComponent): void {
		this.entities.delete(entity)
	}

	onTick(tick: number) {
		const toRemove: number[] = []
		for (const entity of this.entities) {
			if (entity.removeMeAtTick <= tick) {
				toRemove.push(entity.id)
			}
		}
		for (const elementId of toRemove)
			this.game.world.removeEntity(elementId)
	}
}

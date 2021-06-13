import { GameInstance } from '../../game-instance'
import { ComponentNameType, SelfLifecycleObserverComponent } from '../components'
import { Entity, Index } from '../world'

export class LifecycleNotifierSystem implements Index<Entity & SelfLifecycleObserverComponent> {
	readonly components: ComponentNameType[] = ['SelfLifecycleObserverComponent']

	constructor(private readonly game: GameInstance) {
	}

	entityAdded(entity: Entity & SelfLifecycleObserverComponent): void {
		entity.entityCreated(this.game)
	}

	entityRemoved(entity: Entity & SelfLifecycleObserverComponent): void {
		entity.entityRemoved(this.game)
	}
}

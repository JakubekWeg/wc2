import { GameInstance, System } from '../../game-instance'
import { StateMachineHolderComponent, UpdateContext } from '../components'
import World, { createSimpleListIndex } from '../world'

export class UpdateStateMachineSystem implements System {
	private entities = createSimpleListIndex<StateMachineHolderComponent>(this.world, ['StateMachineHolderComponent'])
	constructor(private readonly world: World,
	            private readonly instance: GameInstance) {
	}

	onTick(tick: number): void {
		// const ctx = {
		// 	currentTick: tick,
		// 	game: this.instance,
		// 	world: this.world
		// } as UpdateContext

		for (const entity of this.entities()) {
			entity.updateState(this.instance)
		}
	}
}

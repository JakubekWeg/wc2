import { GameInstanceImpl, System } from '../../game-instance'
import { StateMachineHolderComponent } from '../components'
import World, { createSimpleListIndex } from '../world'

export class UpdateStateMachineSystem implements System {
	private entities = createSimpleListIndex<StateMachineHolderComponent>(this.world, ['StateMachineHolderComponent'])

	constructor(private readonly world: World,
	            private readonly instance: GameInstanceImpl) {
	}

	onTick(tick: number): void {
		// const ctx = {
		// 	currentTick: tick,
		// 	game: this.instance,
		// 	world: this.world
		// } as GameInstance

		const game: GameInstanceImpl = this.instance
		for (const entity of this.entities()) {
			entity.myCurrentState.execute(game)
			// entity.updateState(this.instance)
		}
		// const xd = Array.from(this.entities()).map(e => e.myCurrentState.get().id)
		// console.log(xd)
	}
}

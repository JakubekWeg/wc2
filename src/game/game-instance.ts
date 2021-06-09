import { GraphicComponent } from '../ecs/components'
import { SimpleCircle } from '../ecs/entity-types'
import World, { createSimpleListIndex } from '../ecs/world'

export class GameInstance {
	private executeNextTickList: ((world: World) => void)[] = []
	private readonly ecs = new World()
	private isRunning: boolean = false
	private lastIntervalId: number = -1

	public readonly graphicEntitiesGetter = createSimpleListIndex<GraphicComponent>(this.ecs, ['GraphicComponent'])

	constructor() {
		this.ecs.registerEntityType(SimpleCircle)
		this.ecs.lockTypes()
	}

	tick(): void {
		const world = this.ecs
		world.executeTick(() => {
			for (let i = 0; i < this.executeNextTickList.length; i++){
				const element = this.executeNextTickList[i]
				element(world)
			}
			this.executeNextTickList.length = 0

			for (const entity of this.graphicEntitiesGetter()) {
				entity.size -= 1
				if (entity.size < 0)
					world.removeEntity(entity.id)
			}
		})
	}

	dispatchNextTick(action: (world: World) => void) {
		this.executeNextTickList.push(action)
	}

	startGame() {
		if (this.isRunning) throw new Error('Game is already running')
		this.isRunning = true
		this.lastIntervalId = setInterval(() => this.tick(), 100) as any
	}

	stopGame() {
		clearInterval(this.lastIntervalId)
		this.isRunning = false
	}
}

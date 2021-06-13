import { System } from '../../game-instance'
import { AnimatableDrawableComponent } from '../components'
import World, { createSimpleListIndex } from '../world'

export class AdvanceAnimationsSystem implements System {
	private animatedDrawableEntities = createSimpleListIndex<AnimatableDrawableComponent>(this.world, ['AnimatableDrawableComponent'])
	constructor(private readonly world: World) {
	}

	onTick(tick: number) {
		for (const e of this.animatedDrawableEntities()) {
			if (++e.currentAnimationFrame >= e.currentAnimation.length)
				e.currentAnimationFrame = 0
			e.sourceDrawY = e.currentAnimation[e.currentAnimationFrame]
		}
	}
}

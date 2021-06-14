import { MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { facingDirectionFromAngle } from '../../misc/facing-direction'
import { registry } from '../../misc/resources-manager'
import {
	ComponentNameType,
	DelayedHideComponent,
	MovingDrawableComponent, PossibleAttackTarget,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
} from '../components'
import World, { Entity } from '../world'
import { ArcherImpl } from './archer'

export class ArrowImpl extends Entity
	implements PredefinedDrawableComponent, MovingDrawableComponent, DelayedHideComponent {
	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'MovingDrawableComponent', 'DamageableComponent', 'DelayedHideComponent'])

	hideMeAtMillis: number = 0
	destinationDrawX: number = 0
	destinationDrawY: number = 0
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteVelocityX: number = 0
	spriteVelocityY: number = 0
	spriteSize: number = 40
	texture: CanvasImageSource = registry[5]
	currentAnimationFrame: number = 0
	myForce: number = 0


	render = PredefinedDrawableComponent_render

	static spawn(world: World, sender: PossibleAttackTarget, target: PossibleAttackTarget) {
		const arrow = world.spawnEntity(ArrowImpl)
		const startPosX = sender.hitBoxCenterX * 32
		const startPosY = sender.hitBoxCenterY * 32
		const endPosX = target.hitBoxCenterX * 32
		const endPosY = target.hitBoxCenterY * 32

		arrow.destinationDrawX = startPosX - arrow.spriteSize / 2
		arrow.destinationDrawY = startPosY - arrow.spriteSize / 2

		const x = endPosX - startPosX
		const y = endPosY - startPosY
		const alfa = Math.atan2(x, y)
		const facingDirection = facingDirectionFromAngle(alfa)
		arrow.sourceDrawX = facingDirection * arrow.spriteSize

		const distance = Math.sqrt(x * x + y * y)
		const ARROW_SPEED_PER_TICK = 150
		const ticksToTravel = (distance / ARROW_SPEED_PER_TICK)
		const travelDurationMillis = ticksToTravel * MILLIS_BETWEEN_TICKS
		arrow.spriteVelocityX = x / (travelDurationMillis | 0)
		arrow.spriteVelocityY = y / (travelDurationMillis | 0)
		arrow.hideMeAtMillis = travelDurationMillis + Date.now()
	}
}


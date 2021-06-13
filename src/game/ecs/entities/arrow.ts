import { registry } from '../../misc/resources-manager'
import {
	ComponentNameType,
	DelayedHideComponent,
	MovingDrawableComponent,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
} from '../components'
import { Entity } from '../world'

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
	myTeamId: number = 0


	render = PredefinedDrawableComponent_render
}


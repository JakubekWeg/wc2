import { registry } from '../../misc/resources-manager'
import {
	ComponentNameType,
	DamageableComponent,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	TeamId,
	TilesIncumbentComponent,
} from '../components'
import { Force, neutralForce } from '../force'
import { Entity } from '../world'

export class FarmImpl extends Entity
	implements PredefinedDrawableComponent, TilesIncumbentComponent, DamageableComponent {
	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'TilesIncumbentComponent', 'DamageableComponent'])

	destinationDrawX: number = 0
	destinationDrawY: number = 0
	sourceDrawX: number = 0
	sourceDrawY: number = 0
	spriteSize: number = 32 * 2
	tileOccupySize: number = 2
	mostWestTile: number = 0
	mostNorthTile: number = 0
	texture: CanvasImageSource = registry[2]
	render = PredefinedDrawableComponent_render
	hitBoxCenterX: number = 0
	hitBoxCenterY: number = 0
	myForce: Force = neutralForce
}

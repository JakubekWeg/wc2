import { registry } from '../../misc/resources-manager'
import {
	ComponentNameType,
	PredefinedDrawableComponent,
	PredefinedDrawableComponent_render,
	TilesIncumbentComponent,
} from '../components'
import { Entity } from '../world'

export class FarmImpl extends Entity
	implements PredefinedDrawableComponent, TilesIncumbentComponent {
	static components = new Set<ComponentNameType>(['DrawableBaseComponent', 'TilesIncumbentComponent'])

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
}

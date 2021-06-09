import { ComponentNameType, GraphicComponent } from './components'

export class Entity {
	static components: Set<ComponentNameType> = new Set<ComponentNameType>()
	public readonly id: number = 0
}

export class SimpleCircle
	extends Entity
	implements GraphicComponent {

	static components = new Set<ComponentNameType>(['GraphicComponent'])
	color: string = 'red'
	x: number = 0
	y: number = 0
	size: number = 50

}

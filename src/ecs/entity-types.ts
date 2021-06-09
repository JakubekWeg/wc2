import {
	ComponentNameType,
	GraphicCircleComponent,
	SpriteDrawableComponent,
	TickComponent,
	TilePosition,
	TilesIncumbent,
	WalkableComponent,
} from './components'

export class Entity {
	static components: Set<ComponentNameType> = new Set<ComponentNameType>()
	public readonly id: number = 0
}

export class SimpleCircle
	extends Entity
	implements GraphicCircleComponent {

	static components = new Set<ComponentNameType>(['GraphicComponent'])
	color: string = 'red'
	x: number = 0
	y: number = 0
	size: number = 50
}

const archerFrames: number [] = [
	0,
	72,
	2 * 72,
	0,
	3 * 72,
	4 * 72,
]


export class ArcherEntity
	extends Entity
	implements TilesIncumbent, SpriteDrawableComponent, TickComponent, WalkableComponent {
	static components = new Set<ComponentNameType>(['SpriteDrawableComponent', 'TilesIncumbent', 'TickComponent', 'WalkableComponent'])

	occupiedTilesSize = 1
	occupiedTiles: TilePosition[] = []
	imageIndex = 0
	destinationDrawX = 0
	destinationDrawY = 0
	sourceDrawX = 72 * 7
	spriteSize = 72
	sourceDrawY = 0
	walkProgress: number = 0

	private currentFrame: number = 0
	private changeFrameIn: number = 0

	updateBeforeRender(now: number) {
	}

	update(tick: number) {
		if (this.changeFrameIn === 0) {
			if (this.currentFrame === 5)
				this.currentFrame = 0
			else
				this.currentFrame += 1
			this.sourceDrawY = archerFrames[this.currentFrame]
			this.changeFrameIn = 2
		}
		this.changeFrameIn--
	}
}

export class Farm extends Entity
	implements TilesIncumbent, SpriteDrawableComponent {
	static components = new Set<ComponentNameType>(['SpriteDrawableComponent', 'TilesIncumbent'])
	occupiedTilesSize = 2
	occupiedTiles: TilePosition[] = []
	imageIndex = 2
	destinationDrawX = 0
	destinationDrawY = 0
	sourceDrawX = 0
	sourceDrawY = 0
	spriteSize = 64

	updateBeforeRender(delta: number): void {
	}
}

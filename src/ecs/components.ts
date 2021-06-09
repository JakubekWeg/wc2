export type ComponentNameType = 'GraphicComponent' | 'TilesIncumbent' | 'SpriteDrawableComponent' | 'TickComponent' | 'WalkableComponent'

export interface GraphicCircleComponent {
	color: string,
	x: number,
	y: number,
	size: number
}

export interface TilePosition {
	x: number
	y: number
}

export interface TilesIncumbent {
	occupiedTiles: TilePosition[]
	occupiedTilesSize: number
}

export interface WalkableComponent {
	walkProgress: number
}

export interface SpriteDrawableComponent {
	sourceDrawX: number
	sourceDrawY: number
	destinationDrawX: number
	destinationDrawY: number
	spriteSize: number
	imageIndex: number
	updateBeforeRender(delta: number): void
}

export interface TickComponent {
	update(tick: number): void;
}

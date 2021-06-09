export type ComponentNameType = 'GraphicComponent'


export interface GraphicComponent {
	color: string,
	x: number,
	y: number,
	size: number
}

export interface PositionComponent {
	x: number,
	y: number,
}

export interface HealthComponent {
	health: number
	maxHealth: number
}

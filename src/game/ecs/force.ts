/**
 * Represents a force (team/player) type
 * This can either player, computer AI or neutral force
 * Force with id = 0 is always passive and created statically
 */
export interface Force {
	readonly id: number
	readonly name: string

	isAggressiveTowards(other?: Force): boolean
}


export class ForceImpl implements Force {
	constructor(public readonly id: number,
	            public readonly name: string) {
	}
	isAggressiveTowards(other?: Force): boolean {
		return other != null && other !== this && other !== neutralForce
	}
}

export const neutralForce: Force = new class extends ForceImpl {
	constructor() {
		super(0, 'Passive units');
	}
	isAggressiveTowards(other?: Force): boolean {
		return false
	}
}()

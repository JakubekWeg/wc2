/**
 * Represents a force (team/player) type
 * This can either player, computer AI or neutral force
 * Force with id = 0 is always passive and created statically
 */
import { Camera } from './camera'
import Config from './config'


export interface Force {
	readonly id: number
	readonly name: string

	readonly camera?: Camera

	isAggressiveTowards(other?: Force): boolean
}


class ForceImpl implements Force {
	constructor(public readonly id: number,
	            public readonly name: string) {
	}

	isAggressiveTowards(other?: Force): boolean {
		return other != null && other !== this && other !== neutralForce
	}
}

export const neutralForce: Force = new class extends ForceImpl {
	constructor() {
		super(0, 'Passive units')
	}

	isAggressiveTowards(other?: Force): boolean {
		return false
	}
}()

class ForcesManager {
	private forcesMap = new Map<number, ForceImpl>()
	private nextForceId: number = 1

	private constructor() {
		this.forcesMap.set(0, neutralForce)
	}

	public static createNew(): ForcesManager {
		const f = new ForcesManager()
		f.createNewForce('Team red')
		f.createNewForce('Team blue')
		return f
	}

	public static deserialize(config: Config): ForcesManager {
		return new ForcesManager().restoreFromJson(config)
	}

	public getAll(): Force[] {
		return Array.from(this.forcesMap.values())
	}

	public createNewForce(name: string): Force {
		const f = new ForceImpl(this.nextForceId++, name)
		this.forcesMap.set(f.id, f)
		return f
	}

	public getForce(id: number): Force {
		const f = this.forcesMap.get(id)
		if (f == null)
			throw new Error(`Force with id ${id} not found`)
		return f
	}

	public serialize(): unknown {
		return {
			nextForceId: this.nextForceId,
			forces: Array.from(this.forcesMap.values()).map(e => ({
				id: e.id,
				name: e.name,
			})),
		}
	}

	private restoreFromJson(obj: Config): ForcesManager {
		this.nextForceId = obj.requirePositiveInt('nextForceId')
		for (const entry of obj.child('forces').listEntries()) {
			const id = entry.requireInt('id')
			const name = entry.requireString('name')
			if (id === 0) continue
			if (id >= this.nextForceId || this.forcesMap.has(id))
				throw new Error('Invalid force ID ' + id)
			this.forcesMap.set(id, new ForceImpl(id, name))
		}
		return this
	}
}

export default ForcesManager

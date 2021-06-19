import Config from '../../../config/config'
import { GameInstance } from '../../game-instance'
import { PlayerCommand, TilesIncumbentComponent } from '../components'
import World, { Entity } from '../world'

export interface State {
	readonly id?: string

	// onPush(): void
	onPop(): void

	update(game: GameInstance): void

	serializeToJson(): unknown

	handleCommand(command: PlayerCommand, game: GameInstance): void

	entityLeftSightRange?(which: Entity & TilesIncumbentComponent): void

	entityEnteredSightRange?(which: Entity & TilesIncumbentComponent): void
}

export interface StateController<S extends State> {

	push<T extends S>(newState: T): T

	pop(): void

	clear(): void

	replace<T extends S>(newState: T): T

	get(): S

	execute(ctx: GameInstance): void

	serializeToJson(): unknown
}

export const createState = <S extends State>(first: (controller: StateController<S>) => S): StateController<S> => {
	const stack: State[] = []
	const c = {
		pop() {
			// @ts-ignore
			stack.shift().onPop()
		},
		push<T extends S>(newState: T) {
			stack.unshift(newState)
			// newState.onPush()
			return newState
		},
		clear() {
			stack.length = 0
		},
		replace<T extends S>(newState: T) {
			stack[0].onPop()
			stack[0] = newState
			// newState.onPush()
			return newState
		},
		get() {
			return stack[0]
		},
		execute(ctx: GameInstance) {
			stack[0].update(ctx)
		},
		serializeToJson(): unknown {
			return {
				stack: stack.map(e => e.serializeToJson()),
			}
		},
	} as StateController<S>
	stack.push(first(c))
	return c
}

/**
 * Null temporary state that shouldn't be used in the game
 */
export const nullState = (): any => ({
	id: 'nullState',
	update(_: GameInstance) {
		throw new Error('Not implemented')
	},
	handleCommand(_: PlayerCommand, __: GameInstance) {
		throw new Error('Not implemented')
	},
	onPop() {
	},
	serializeToJson(): unknown {
		return {id: this.id}
	},
})

export interface StateDeserializeContext {
	entity: Entity & any,
	game: GameInstance,
	controller: StateController<State>,
	world: World,
}

const states = new Map<string, any>()
export const addState = (which: any) => {
	const id = which.ID
	if (!id) throw new Error('State requires ID!')
	if (states.has(id))
		throw new Error('State with id ' + id + ' is already registered')
	if (!which.deserialize)
		throw new Error('State with id ' + id + ' is missing deserialize static function')
	states.set(id, which.deserialize)
}

export function UnitState(constructor: Function) {
	addState(constructor)
}

export const deserializeUnitState = (entity: Entity,
                                     game: GameInstance,
                                     world: World,
                                     data: Config) => {
	const stack: State[] = []
	const c = {
		pop() {
			// @ts-ignore
			stack.shift().onPop()
		},
		push(newState: State) {
			stack.unshift(newState)
			// newState.onPush()
			return newState
		},
		clear() {
			stack.length = 0
		},
		replace(newState: State) {
			stack[0].onPop()
			stack[0] = newState
			// newState.onPush()
			return newState
		},
		get() {
			return stack[0]
		},
		execute(ctx: GameInstance) {
			stack[0].update(ctx)
		},
		serializeToJson(): unknown {
			return {
				stack: stack.map(e => e.serializeToJson()),
			}
		},
	} as StateController<State>

	const ctx = {
		entity: entity,
		controller: c,
		game: game,
		world: world,
	} as StateDeserializeContext

	for (const description of data.child('stack').listEntries()) {
		const id = description.requireString('id')
		const deserializer: Function = states.get(id)
		if (!deserializer)
			throw new Error('Deserializer for state ' + id + ' not found')

		stack.push(deserializer(ctx, description))
	}

	return c
}

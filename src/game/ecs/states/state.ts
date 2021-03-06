import Config from '../../config'
import { GameInstance } from '../../game-instance'
import { ComponentNameType, PlayerCommand, StateMachineHolderComponent, TilesIncumbentComponent } from '../components'
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

export interface StateController {

	push<T extends State>(newState: T): T

	pop(): void

	clear(): void

	replace<T extends State>(newState: T): T

	get(): State

	execute(ctx: GameInstance): void

	serializeToJson(): unknown
}

export const createState = <S extends State>(first: (controller: StateController) => S): StateController => {
	const stack: State[] = []
	const c = {
		pop() {
			// @ts-ignore
			stack.shift().onPop()
		},
		push<T extends State>(newState: T) {
			stack.unshift(newState)
			// newState.onPush()
			return newState
		},
		clear() {
			stack.length = 0
		},
		replace<T extends State>(newState: T) {
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
	} as StateController
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
	serializeToJson(): unknown {
		return {id: this.id}
	},
})

export interface StateDeserializeContext {
	entity: Entity & any,
	game: GameInstance,
	controller: StateController,
	world: World,
}

const states = new Map<string, any>()
export const addState = (which: any) => {
	const id: string | undefined = which.ID
	if (!id) throw new Error('State requires ID!')
	const indexOfSlash = id.indexOf('/')

	if (indexOfSlash < 0) throw new Error('State requires namespaceID and type name!')
	if (typeof which.deserialize !== 'function')
		throw new Error('State with id ' + id + ' is missing deserialize static function')
	if (id.substring(indexOfSlash + 1) === 'root') {
		if (typeof which.create !== 'function')
			throw new Error('State with id ' + id + ' is missing create static function, but root state requires it')
		if (typeof which.isCompatibleWithComponents !== 'function')
			throw new Error('State with id ' + id + ' is missing isCompatibleWithComponents static function, but root state requires it')
	}
	states.set(id, which)
}

export function UnitState(constructor: Function) {
	addState(constructor)
}

export const getRootStateByAiName = (name: string, components: Set<ComponentNameType>): (entity: Entity & StateMachineHolderComponent, controller: StateController) => State => {
	const state = states.get(name + '/root')
	if (state === undefined)
		throw new Error(`Root state of group ${name} not found`)

	if (!state.isCompatibleWithComponents(components))
		throw new Error(`Root state of group ${name} claims to be incompatible with current components state`)

	return state.create
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
	} as StateController

	const ctx = {
		entity: entity,
		controller: c,
		game: game,
		world: world,
	} as StateDeserializeContext

	for (const description of data.child('stack').listEntries()) {
		const id = description.requireString('id')
		const deserializer: Function = states.get(id)?.deserialize
		if (!deserializer)
			throw new Error('Deserializer for state ' + id + ' not found')

		stack.push(deserializer(ctx, description))
	}

	return c
}

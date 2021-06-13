import { UpdateContext, UpdateStateMachineFunction } from './components'

export type State<EntityType> = (entity: EntityType,
                                 controller: StateController<EntityType>,
                                 ctx: UpdateContext) => void

export interface StateController<EntityType> {
	push(newState: State<EntityType>): void

	pop(): void

	clear(): void

	replace(newState: State<EntityType>): void
}

export const createState = <EntityType>(entity: EntityType,
                                        first: State<EntityType>): UpdateStateMachineFunction => {
	const stack: State<EntityType>[] = [first]
	const controller = {
		pop() {
			stack.shift()
		},
		push(newState: State<EntityType>) {
			stack.unshift(newState)
		},
		clear() {
			stack.length = 0
		},
		replace(newState: State<EntityType>) {
			stack[0] = newState
		},
	} as StateController<EntityType>
	return (ctx) => stack[0](entity, controller, ctx)
}

export interface State2 {
	update(ctx: UpdateContext): void
}

export interface State2Controller<S extends State2> {
	push(newState: S): void

	pop(): void

	clear(): void

	replace(newState: S): void

	get(): S

	execute(ctx: UpdateContext): void
}

export const createState2 = <S extends State2>(first: (controller: State2Controller<S>) => S): State2Controller<S> => {
	const stack: State2[] = []
	const c = {
		pop() {
			stack.shift()
		},
		push(newState: S) {
			stack.unshift(newState)
		},
		clear() {
			stack.length = 0
		},
		replace(newState: S) {
			stack[0] = newState
		},
		get() {
			return stack[0]
		},
		execute(ctx: UpdateContext) {
			stack[0].update(ctx)
		}
	} as State2Controller<S>
	stack.push(first(c))
	return c
}

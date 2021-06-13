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

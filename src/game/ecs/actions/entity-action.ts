import Config from '../../config'
import { GameInstance } from '../../game-instance'
import { ActionsComponent } from '../components'
import { Entity } from '../world'

export interface EntityActionContext {
	game: GameInstance,
	entity: Entity & ActionsComponent,
	/**
	 * If EntityAction$requiresSelector returns true then this should be specified
	 */
	targetTile?: { x: number, y: number }
}

export interface EntityAction {
	/**
	 * Icon index associated with this action
	 * Color of the icon should be gathered from context's entity
	 */
	iconIndex: number

	/**
	 * Checks if this action can be executed right now
	 * This should always be called before execution
	 * @returns true if execute method can be called
	 */
	isAvailable(context: EntityActionContext): boolean

	/**
	 * If this method returns true caller should add location into execution context
	 * @returns true if action requires location to be executed
	 */
	requiresSelector(context: EntityActionContext): boolean

	/**
	 * Requests an entity to execute this action
	 * Called should check if isAvailable returns true before calling this method
	 */
	execute(context: EntityActionContext): void
}

const defaultActions: Map<string, EntityAction> = new Map()
const createDefaultActions = () => {
	const alwaysTrue = () => true

	defaultActions.set('walk', {
		iconIndex: 83,
		isAvailable: alwaysTrue,
		requiresSelector: alwaysTrue,
		execute(context: EntityActionContext) {
			console.log('EntityAction#execute: walk', context)

			const target = context.targetTile
			if (target === undefined) throw new Error(`Attempt to invoke walk command, but targetTile was not specified`)
			context.entity.myCurrentState.get().handleCommand({
				type: 'go',
				targetX: target.x,
				targetY: target.y,
			}, context.game)
		},
	})
}
createDefaultActions()

const getFromString = (name: string): EntityAction => {
	const action = defaultActions.get(name)
	if (action === undefined)
		throw new Error(`Cannot get entity action from string: invalid name ${name}`)
	return action
}


export const parseEntityActionFromJson = (obj: Config): EntityAction => {
	const raw = obj.getRawObject()
	if (!raw) throw new Error(`Cannot parse entity action: it's nullish`)

	if (typeof raw === 'string')
		return getFromString(raw)

	throw new Error('not implemented')
}

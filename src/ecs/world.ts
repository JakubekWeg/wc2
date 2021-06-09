import { ComponentNameType } from './components'
import { Entity } from './entity-types'

export interface Index<T extends Entity = Entity> {
	readonly components: ComponentNameType[]

	entityAdded(entity: T): void

	entityRemoved(entity: T): void
}

export interface ModificationListener<T extends Entity> {
	readonly listensForChangesInComponent: ComponentNameType

	entityModified(entity: T): void
}

export type IndexAndListener<T> = Index<Entity & T> & ModificationListener<Entity & T>

interface EntityType {
	constructor: new () => Entity,
	componentNames: Set<string>
	triggers: Index[]
}

export class World {
	private currentTick: number = 0
	private nextEntityId: number = 1
	private readonly allEntities = new Map<number, Entity>()
	private readonly modificationListeners = new Map<ComponentNameType, ModificationListener<any>[]>()
	private readonly entitiesAboutToAdd: [Entity, EntityType][] = []
	private readonly entityIdsToRemove: number[] = []
	private readonly allIndexes: Index<any>[] = []
	private readonly allEntityTypes = new Map<string, EntityType>()

	private prototypesLocked: boolean = false
	private executingTick: boolean = false

	registerEntityType<T extends Entity>(instance: new () => T): void {
		if (this.prototypesLocked) throw new Error('World is locked')
		const name = instance.name
		if (this.allEntityTypes.has(name))
			throw new Error('Entity type ' + name + ' has already been registered')

		this.allEntityTypes.set(name, {
			constructor: instance,
			componentNames: (instance as any).components,
			triggers: [],
		})
	}

	registerIndex<T extends Entity>(index: Index<T>): Index<T> {
		if (this.prototypesLocked) throw new Error('World is locked')
		this.allIndexes.push(index)
		return index
	}

	registerModificationListener<T extends Entity>(listener: ModificationListener<T>): ModificationListener<T> {
		if (this.prototypesLocked) throw new Error('World is locked')
		const list = this.modificationListeners.get(listener.listensForChangesInComponent)
		if (list != null)
			list.push(listener)
		else
			this.modificationListeners.set(listener.listensForChangesInComponent, [listener])
		return listener
	}

	registerIndexAndListener<T extends Entity>(obj: IndexAndListener<T>): (IndexAndListener<T>) {
		this.registerIndex(obj)
		this.registerModificationListener(obj)
		return obj
	}

	lockTypes() {
		if (this.prototypesLocked) throw new Error('World is locked')
		this.prototypesLocked = true

		for (const entityType of this.allEntityTypes.values()) {
			const names = entityType.componentNames
			for (const index of this.allIndexes) {
				let ok = true
				for (const componentName of index.components) {
					if (!names.has(componentName)) {
						ok = false
						break
					}
				}
				if (ok) {
					entityType.triggers.push(index)
				}
			}
		}
	}

	spawnEntity<T extends Entity>(creator: new () => T): T {
		if (!this.prototypesLocked) throw new Error('World is not locked')
		if (!this.executingTick) throw new Error('Game logic is not executing now')
		const name = creator.name
		const type = this.allEntityTypes.get(name)
		if (type == null)
			throw new Error('Entity type ' + name + ' is not registered')
		const result: T = new type.constructor() as T
		// @ts-ignore
		// noinspection JSConstantReassignment
		result.id = this.nextEntityId++
		this.entitiesAboutToAdd.push([result, type])
		return result
	}

	getSpawnedEntity(id: number): Entity | undefined {
		return this.allEntities.get(id)
	}

	notifyEntityModified(entity: Entity, affectedComponentName: ComponentNameType) {
		if (!this.executingTick) throw new Error('Game logic is not executing now')
		const list = this.modificationListeners.get(affectedComponentName)
		if (list != null)
			for (const listener of list)
				listener.entityModified(entity)
	}

	removeEntity(id: number) {
		this.entityIdsToRemove.push(id)
	}

	executeTick(func: (currentTick: number) => void) {
		this.executingTick = true
		func(this.currentTick++)
		while (this.entitiesAboutToAdd.length > 0 || this.entityIdsToRemove.length > 0) {
			for (let i = 0; i < this.entitiesAboutToAdd.length; i++) {
				const [entity, type] = this.entitiesAboutToAdd[i]
				this.allEntities.set(entity.id, entity)
				for (const trigger of type.triggers) {
					trigger.entityAdded(entity)
				}
			}
			this.entitiesAboutToAdd.length = 0
			for (let i = 0; i < this.entityIdsToRemove.length; i++) {
				const id = this.entityIdsToRemove[i]
				const entity = this.allEntities.get(id)
				if (entity != null) {
					this.allEntities.delete(id)
					const type = this.allEntityTypes.get(entity.constructor.name)
					if (type != null) {
						for (const trigger of type.triggers) {
							trigger.entityRemoved(entity)
						}
					}
				}
			}
			this.entityIdsToRemove.length = 0
		}
		this.executingTick = false
	}

}

export default World

export const createSimpleListIndex = <T>(world: World,
                                      components: ComponentNameType[]): (() => IterableIterator<Entity & T>) => {
	const entities = new Map<number, Entity & T>()
	class SimpleListIndex implements Index {
		readonly components: ComponentNameType[] = components

		entityAdded(entity: Entity & T): void {
			entities.set(entity.id, entity)
		}
		entityRemoved(entity: Entity): void {
			entities.delete(entity.id)
		}
	}
	world.registerIndex(new SimpleListIndex())
	return () => entities.values()
}

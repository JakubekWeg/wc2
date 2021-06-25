import Config from '../../../config/config'
import { ComposedFunction, composeFunction } from '../../misc/functions-composer'
import { ResourcesManager } from '../../misc/resources-manager'
import { ComponentNameType, DeserializationUnitContext } from '../components'
import { Entity, EntityType } from '../world'
import { createTypeForBuilding, createTypeForUnit, doNothingCallback } from './common'


export interface EntityRegistrationRequest {
	id: string,
	data: Config,
	entity: Entity
	resources: ResourcesManager
	fork: ComposedFunction<Entity>
	serialize: ComposedFunction<Entity, any>,
	deserialize: ComposedFunction<Entity, Config>,
	postSetup: ComposedFunction<Entity, DeserializationUnitContext, Config>,
	components: Set<ComponentNameType>
}

export interface EntityRegistrationResult {
	components: Set<ComponentNameType>
	spawn: () => Entity
	getTemplate: () => Entity
}


export const createEntityType = (id: string, description: Config, mgr: ResourcesManager): EntityType => {
	let result: EntityRegistrationResult | undefined

	const proto = description.requireString('prototype')
	const request = {
		id,
		entity: new Entity(),
		data: description.child('prototypeData'),
		resources: mgr,
		fork: composeFunction(doNothingCallback),
		components: new Set(),

		serialize: composeFunction(doNothingCallback),
		deserialize: composeFunction(doNothingCallback),
		postSetup: composeFunction(doNothingCallback),
	} as EntityRegistrationRequest

	switch (proto) {
		case 'unit':
			result = createTypeForUnit(request)
			break
		case 'building':
			result = createTypeForBuilding(request)
			break
	}

	if (result == null)
		throw new Error('Invalid entity prototype ' + proto)


	return {
		id,
		getTemplate: result.getTemplate,
		spawn: result.spawn,
		componentNames: result.components,
	}
}



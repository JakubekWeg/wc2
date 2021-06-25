import Config from '../config/config'
import { AnimationFrames } from './ecs/entities/common'
import { createEntityType } from './ecs/entities/composer'
import { EntityType } from './ecs/world'
import { ResourcesManager, TextureType } from './misc/resources-manager'

export interface DataPack {
	readonly rawObject: unknown,
	readonly resources: ResourcesManager
	readonly entityTypes: EntityType[]
}

export const fetchDataPack = async (url: string): Promise<DataPack> => {

	const response = await fetch(url, {
		credentials: 'omit',
		mode: 'no-cors',
	})
	if (!response.ok)
		throw new Error(`Failed to fetch, response code ${response.status} ${response.statusText}`)

	try {
		const mgr = new ResourcesManager()
		const config = Config.createConfigFromObject(await response.json())

		// load textures
		await Promise.all(Array.from(config.child('textures').objectEntries())
			.map(([key, obj]) => mgr
				.addAsset(key,
					obj.requireString('name'),
					obj.child('spriteSize').getRawObject() as number | undefined,
					obj.requireString('type') as TextureType),
			),
		)

		// load keyframes
		for (const [key, obj] of config.child('animations').objectEntries()) {
			const frames: AnimationFrames = obj.getAsNotEmptyListOfNonNegativeIntegers()
			config.setRegistryValue('animation', key, frames)
		}


		const entities = []
		// load entity types
		for (const [key, obj] of config.child('entities').objectEntries()) {
			entities.push(createEntityType(key, obj, mgr))
		}

		return {
			rawObject: config.getRawObject(),
			entityTypes: entities,
			resources: mgr,
		}
	} catch (e) {
		throw new Error(`Failed to parse data pack due to error ${e}`)
	}
}

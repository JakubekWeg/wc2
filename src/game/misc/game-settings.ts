import { EntityType } from '../ecs/world'

interface GameSettings {
	mapWidth: number
	mapHeight: number
	entityTypes: EntityType[]
}

export default GameSettings

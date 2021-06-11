import { FacingDirection, facingDirectionToVector } from '../ecs/facing-direction'
import World from '../ecs/world'
import { GameInstance, MILLIS_BETWEEN_TICKS, System } from './game-instance'

const walkingSystem = (game: GameInstance, ecs: World): System => (new class implements System {
	walkingEntities = game.walkingEntities
	tiles = game.tiles

	onTick(tick: number) {
		for (const entity of this.walkingEntities()) {
			if (entity.walkProgress > 0 && ++entity.walkProgress > entity.ticksToMoveThisField) {
				// finish walking
				if (entity.pathDirections.length === 0) {
					entity.currentFrame = 0
					entity.currentFrames = entity.standingAnimationFrames
					const entities = Array.from(game.chunkEntityIndex
						.getNearbyEntities(entity.occupiedTilesWest, entity.occupiedTilesNorth, 1))
						.filter(e => e !== entity)
					console.log(entities)
				}
				entity.walkProgress = 0
				entity.spriteVelocityX = 0
				entity.spriteVelocityY = 0
				const x = entity.occupiedTilesWest
				const y = entity.occupiedTilesNorth
				entity.destinationDrawX = x * 32 - 18
				entity.destinationDrawY = y * 32 - 18
			}

			if (entity.walkProgress === 0) {
				// consider start walking
				const first: FacingDirection | undefined = entity.pathDirections.shift()
				if (first !== undefined) {
					entity.walkDirection = first
					entity.sourceDrawX = first * 72
					if (entity.occupiedTilesSize !== 1)
						throw new Error('Unable to move entity that occupies more then a single tile')

					const x = entity.occupiedTilesWest
					const y = entity.occupiedTilesNorth
					const [ox, oy] = facingDirectionToVector(first)

					// check if can reserve next tile
					if (this.tiles.updateRegistryCheck(x + ox, y + oy, entity)) {
						// if ok then start walking animation
						this.tiles.updateRegistryThrow(x, y, undefined)

						const ticksToMoveThisField = entity.ticksToMoveThisField = ((ox !== 0 && oy !== 0) ? ((20 - entity.unitMovingSpeed) * 1.6 | 0) : (20 - entity.unitMovingSpeed))
						entity.occupiedTilesWest += ox
						entity.occupiedTilesNorth += oy
						ecs.notifyEntityModified(entity, 'TilesIncumbent')
						entity.walkProgress = 1
						entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
						entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
						entity.currentFrames = entity.walkingAnimationFrames
					} else {
						// tile is now occupied by someone else so stop moving
						entity.pathDirections.length = 0
						entity.currentFrame = 0
						entity.currentFrames = entity.standingAnimationFrames
					}
				} else {
					// walking is not requested, stand still
				}
			} else {
				// walk in progress
			}
		}
	}
})

export const initSystemsForInstance = (game: GameInstance, ecs: World) => {
	game.addSystem(walkingSystem(game, ecs))
	game.addSystem(detectAndReactToNearbyEntitiesSystem(game))
}

const detectAndReactToNearbyEntitiesSystem = (game: GameInstance): System => (new class implements System {
	onTick(tick: number): void {

	}
})

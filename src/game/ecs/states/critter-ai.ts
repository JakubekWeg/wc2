import Config from '../../../config/config'
import { GameInstance, MILLIS_BETWEEN_TICKS } from '../../game-instance'
import { FacingDirection, facingDirectionToVector } from '../../misc/facing-direction'
import { PlayerCommand } from '../components'
import { UnitPrototype } from '../entities/composer'
import { State, StateController, StateDeserializeContext, UnitState } from './state'

const namespaceId = 'critter-ai/'

interface UnitState extends State {
}

export const createAiState = (entity: UnitPrototype, controller: StateController<UnitState>): UnitState => {
	return RootState.create(entity, controller)
}

/**
 * State that handles commands, it switches immediately to something other
 */
@UnitState
class RootState implements State {
	public static ID = namespaceId + 'root'

	private constructor(private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    private nextMoveIn: number) {
	}

	public static create(entity: UnitPrototype,
	                     controller: StateController<UnitState>) {
		return new RootState(entity, controller, 10)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		return new RootState(ctx.entity, ctx.controller, data.requireInt('nextMoveIn'))
	}

	onPop() {
	}

	handleCommand(command: PlayerCommand, game: GameInstance) {
	}

	serializeToJson(): unknown {
		return {
			id: RootState.ID,
			nextMoveIn: this.nextMoveIn,
		}
	}

	update(game: GameInstance) {
		if (this.nextMoveIn-- < 0) {
			this.nextMoveIn = game.random.intMax(30)
			const dir = game.random.intMax(8)
			const state = GoingTileState.tryToWalkThisWay(dir, this.entity, this.controller, game)
			if (state !== undefined)
				this.controller.push(state)
		}
	}
}


/**
 * Makes entity go through a single tile
 */
@UnitState
class GoingTileState implements State {
	public static ID = namespaceId + 'walking-tile'

	private constructor(private readonly direction: FacingDirection,
	                    private readonly entity: UnitPrototype,
	                    private readonly controller: StateController<UnitState>,
	                    private readonly game: GameInstance,
	                    private progress: number,
	                    private readonly ticksToMoveThisField: number,
	                    private delayedCommand?: PlayerCommand) {

	}

	public static tryToWalkThisWay(direction: FacingDirection,
	                               entity: UnitPrototype,
	                               controller: StateController<UnitState>,
	                               game: GameInstance): State | undefined {
		entity.sourceDrawX = direction * entity.spriteSize
		const [ox, oy] = facingDirectionToVector(direction)

		if (!game.tiles.moveOccupationAtOnceNoThrow(entity.mostWestTile,
			entity.mostNorthTile,
			entity.mostWestTile + ox,
			entity.mostNorthTile + oy)) {
			return undefined
		}

		const ticksToMoveThisField = (ox !== 0 && oy !== 0) ? ((11 - entity.unitMovingSpeed) * 1.5 | 0) : (11 - entity.unitMovingSpeed)
		entity.destinationDrawX = entity.mostWestTile * 32 - (entity.spriteSize - 32) / 2 | 0
		entity.destinationDrawY = entity.mostNorthTile * 32 - (entity.spriteSize - 32) / 2 | 0
		entity.spriteVelocityX = ox * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
		entity.spriteVelocityY = oy * 32 / (ticksToMoveThisField * MILLIS_BETWEEN_TICKS)
		entity.mostWestTile += ox
		entity.mostNorthTile += oy
		return new GoingTileState(direction, entity, controller, game, 0, ticksToMoveThisField, undefined)
	}

	public static deserialize(ctx: StateDeserializeContext, data: Config) {
		const direction: number = data.requireInt('direction')
		const entity = ctx.entity as UnitPrototype
		const ticksToMoveThisField: number = data.requireInt('ticksToMoveThisField')
		entity.sourceDrawX = direction * entity.spriteSize
		entity.destinationDrawX = (entity.mostWestTile * 32 - entity.spriteSize / 4) | 0
		entity.destinationDrawY = (entity.mostNorthTile * 32 - entity.spriteSize / 4) | 0
		return new GoingTileState(direction, entity, ctx.controller,
			ctx.game,
			data.requireInt('progress'),
			ticksToMoveThisField,
			data.child('command').getRawObject() as PlayerCommand)
	}

	onPop(): void {
		const entity = this.entity
		entity.spriteVelocityX = entity.spriteVelocityY = 0
		entity.destinationDrawX = (entity.mostWestTile * 32 - (32 - entity.spriteSize) / 2) | 0
		entity.destinationDrawY = (entity.mostNorthTile * 32 - (32 - entity.spriteSize) / 2) | 0
		this.game.world.notifyEntityModified(entity, 'PredefinedDrawableComponent')
	}

	handleCommand(command: PlayerCommand, game: GameInstance): void {
	}

	update(game: GameInstance): void {
		if (++this.progress >= this.ticksToMoveThisField) {
			this.controller.pop()
			const state = this.controller.get()
			if (this.delayedCommand) {
				state.handleCommand(this.delayedCommand, game)
				if (this.controller.get() === state || true) {
					state.update(game)
				}
			}
		}
	}

	serializeToJson(): unknown {
		return {
			id: GoingTileState.ID,
			progress: this.progress,
			ticksToMoveThisField: this.ticksToMoveThisField,
			direction: this.direction,
			command: this.delayedCommand,
		}
	}
}

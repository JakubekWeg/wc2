import { GameInstanceImpl } from '../../game-instance'
import { PlayerCommand, PredefinedDrawableComponent } from '../components'
import { UnitPrototype } from './composer'

export type AnimationFrames = number[]

export const standardWalkingAnimationFrames: AnimationFrames = [
	0,
	72,
	2 * 72,
	0,
	4 * 72,
	3 * 72,
	4 * 72,
]

export const standardArcherAttackingAnimationFrames: AnimationFrames = [
	0, 0,
	0, 0,
	0, 0,
	0, 0,
	5 * 72, 5 * 72,
	5 * 72, 5 * 72,
	6 * 72, 6 * 72,
]

export const standardFootmanAttackingAnimationFrames: AnimationFrames = [
	0, 0,
	5 * 72, 6 * 72,
	7 * 72, 8 * 72,
]

export const standardStandingAnimationFrames: AnimationFrames = [0, 0]

export const doNothingCallback = () => {
}

export const isInRectRange = (px: number, py: number, l: number, t: number, w: number, h: number): boolean => {
	return isInRectRange2(px, py, l, t, l + w, t + h)
}
export const isInRectRange2 = (px: number, py: number, l: number, t: number, r: number, b: number): boolean => {
	return px >= l && px < r && py >= t && py < b
}

// export const PlayerCommandTakerComponent_acceptByUnit = function (this: UnitPrototype,
//                                                                   command: PlayerCommand, game: GameInstance) {
// 	this.updateState()
// }

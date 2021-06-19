import { GameInstanceImpl } from '../../game-instance'
import { PlayerCommand, PredefinedDrawableComponent } from '../components'
import { UnitPrototype } from './composer'

export type AnimationFrames = number[]

export const doNothingCallback = () => {
}

export const isInRectRange = (px: number, py: number, l: number, t: number, w: number, h: number): boolean => {
	return isInRectRange2(px, py, l, t, l + w, t + h)
}
export const isInRectRange2 = (px: number, py: number, l: number, t: number, r: number, b: number): boolean => {
	return px >= l && px <= r && py >= t && py <= b
}

// export const PlayerCommandTakerComponent_acceptByUnit = function (this: UnitPrototype,
//                                                                   command: PlayerCommand, game: GameInstance) {
// 	this.updateState()
// }

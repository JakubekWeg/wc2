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
	return px >= l && px <= l + w && py >= t && py < t + h
}

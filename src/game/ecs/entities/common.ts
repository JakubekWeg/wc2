export type AnimationFrames = number[]

export const standardWalkingAnimationFrames: AnimationFrames = [
	0,
	72,
	72,
	2 * 72,
	2 * 72,
	0,
	4 * 72,
	4 * 72,
	3 * 72,
	3 * 72,
	4 * 72,
	4 * 72,
]

export const standardAttackingAnimationFrames: AnimationFrames = [
	0, 0,
	0, 0,
	0, 0,
	0, 0,
	0, 0,
	0, 0,
	5 * 72, 5 * 72,
	5 * 72, 5 * 72,
	5 * 72, 5 * 72,
	5 * 72, 5 * 72,
	6 * 72, 6 * 72,
]

export const standardStandingAnimationFrames: AnimationFrames = [0, 0]

export const doNothingCallback = () => {
}

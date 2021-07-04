import React, { useContext, useEffect, useRef } from 'react'
import { TILE_SET_WIDTH } from '../../game/ecs/terrain'
import { getFullTextureOfVariant } from '../../game/ecs/variant'
import { GameContext } from './GameLayout'

interface Props {
	iconIndex: number
	image: 'tile-set' | 'icons'

	onClicked?(e: React.MouseEvent): void

	children?: React.ReactElement
}

export const ICONS_SET_SIZE_W = 5
const CANVAS_OPTIONS = {alpha: false} as CanvasRenderingContext2DSettings

function Component(props: Props) {
	const game = useContext(GameContext)
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (canvas == null) return

		const ctx = canvas.getContext('2d', CANVAS_OPTIONS)
		if (ctx == null) return
		if (props.image === 'tile-set') {
			canvas.width = canvas.height = 32

			const {image} = game!.resources.getEntry('summer')

			const index = getFullTextureOfVariant(props.iconIndex)()
			const sx = index % TILE_SET_WIDTH * 32
			const sy = (index / TILE_SET_WIDTH | 0) * 32

			ctx.drawImage(image,
				sx, sy,
				32, 32,
				0, 0,
				32, 32)
		} else if (props.image === 'icons') {
			canvas.width = 46
			canvas.height = 38

			const {image} = game!.resources.getEntry('icons')

			const index = props.iconIndex
			const sx = index % ICONS_SET_SIZE_W * 46
			const sy = (index / ICONS_SET_SIZE_W | 0) * 38

			ctx.drawImage(image,
				sx, sy,
				46, 38,
				0, 0,
				46, 38)
		} else {
			console.error('invalid image', props.image)
		}
	})

	return (
		<div className="MouseActionIcon" onClick={props.onClicked}>
			<canvas className="IconCanvas" ref={ref}>
			</canvas>
			{props.children}
		</div>
	)
}

export default Component

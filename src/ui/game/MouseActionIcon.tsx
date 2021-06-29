import React, { useContext, useEffect, useRef } from 'react'
import { TILE_SET_WIDTH } from '../../game/ecs/terrain'
import { getFullTextureOfVariant } from '../../game/ecs/variant'
import { MouseAction } from './frontend-controller'
import { GameContext } from './GameLayout'
import TileVariantPicker from './TileVariantPicker'

interface Props {
	action: MouseAction
	opened: boolean

	onClicked?(): void

	onPicked?(a: MouseAction): void
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
		if (props.action.type === 'set-tile') {
			canvas.width = canvas.height = 32

			const {image} = game!.resources.getEntry('summer')

			const index = getFullTextureOfVariant(props.action.iconIndex)()
			const sx = index % TILE_SET_WIDTH * 32
			const sy = (index / TILE_SET_WIDTH | 0) * 32

			ctx.drawImage(image,
				sx, sy,
				32, 32,
				0, 0,
				32, 32)
		} else if (props.action.type === 'spawn-entity') {
			canvas.width = 46
			canvas.height = 38

			const {image} = game!.resources.getEntry('icons')

			const index = props.action.iconIndex
			const sx = index % ICONS_SET_SIZE_W * 46
			const sy = (index / ICONS_SET_SIZE_W | 0) * 38

			ctx.drawImage(image,
				sx, sy,
				46, 38,
				0, 0,
				46, 38)
		} else {
			console.error('what?', props.action.type)
		}
	})

	return (
		<div className="MouseActionIcon" onClick={props.opened ? undefined : props.onClicked}>
			<canvas className="IconCanvas" ref={ref}>
			</canvas>
			{props.opened ? <TileVariantPicker onPicked={props.onPicked}/> : undefined}
		</div>
	)
}

export default Component

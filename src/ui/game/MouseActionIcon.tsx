import React, { useContext, useEffect, useRef } from 'react'
import { TILE_SET_WIDTH } from '../../game/ecs/terrain'
import { getFullTextureOfVariant } from '../../game/ecs/variant'
import { GameInstanceImpl } from '../../game/game-instance'
import { allColorNames, EntityColor } from '../../game/misc/colors-palette'
import { GameContext } from './GameLayout'

interface Props {
	iconIndex: number
	image: 'tile-set' | 'icons' | 'color'
	color?: EntityColor

	onClicked?(e: React.MouseEvent): void

	children?: React.ReactElement
}

export const ICONS_SET_SIZE_W = 5
const CANVAS_OPTIONS = {alpha: false} as CanvasRenderingContext2DSettings

function handleTileSet(canvas: HTMLCanvasElement, game: GameInstanceImpl, props: Props, ctx: CanvasRenderingContext2D) {
	canvas.width = canvas.height = 32

	const image = game.resources.getDefaultImage('summer')

	const index = getFullTextureOfVariant(props.iconIndex)()
	const sx = index % TILE_SET_WIDTH * 32
	const sy = (index / TILE_SET_WIDTH | 0) * 32

	ctx.drawImage(image,
		sx, sy,
		32, 32,
		0, 0,
		32, 32)
}

function handleIcons(canvas: HTMLCanvasElement, game: GameInstanceImpl, props: Props, ctx: CanvasRenderingContext2D) {
	canvas.width = 46
	canvas.height = 38

	const image = props.color === undefined ? game.resources.getDefaultImage('icons') : game.resources.getColorImage('icons', props.color)

	const index = props.iconIndex
	const sx = index % ICONS_SET_SIZE_W * 46
	const sy = (index / ICONS_SET_SIZE_W | 0) * 38

	ctx.drawImage(image,
		sx, sy,
		46, 38,
		0, 0,
		46, 38)
}

function Component(props: Props) {
	const game = useContext(GameContext)!
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (canvas == null) return

		const ctx = canvas.getContext('2d', CANVAS_OPTIONS)
		if (ctx == null) return
		switch (props.image) {
			case 'tile-set':
				handleTileSet(canvas, game, props, ctx)
				break
			case 'icons':
				handleIcons(canvas, game, props, ctx)
				break
			case 'color':
				break
			default:
				console.error('invalid image', props.image)
				break
		}
	}, [props, game])

	if (props.image === 'color')
		return (
			<div className="MouseActionIcon" onClick={props.onClicked}>
				<div className="IconCanvas ColorCanvas" style={{backgroundColor: allColorNames[props.iconIndex]}}>
				</div>
				{props.children}
			</div>
		)


	return (
		<div className="MouseActionIcon" onClick={props.onClicked}>
			<canvas className="IconCanvas" ref={ref}>
			</canvas>
			{props.children}
		</div>
	)
}

export default Component

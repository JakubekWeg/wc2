import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getFullTextureOfVariant, TILE_SET_WIDTH, Variant } from '../../game/ecs/terrain'
import { GameContext } from './GameLayout'
import TileVariantPicker from './TileVariantPicker'

interface Props {
	variant: Variant
	opened: boolean
	onClicked?(): void
	onPicked?(v: Variant): void
}

function Component(props: Props) {
	const game = useContext(GameContext)
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = ref.current
		if (canvas == null) return

		canvas.width = canvas.height = 32
		const ctx = canvas.getContext('2d', {alpha: false})
		if (ctx == null) return

		const {image} = game!.resources.getEntry('summer')

		const index = getFullTextureOfVariant(props.variant)()
		const sx = index % TILE_SET_WIDTH * 32
		const sy = (index / TILE_SET_WIDTH | 0) * 32

		ctx.drawImage(image,
			sx, sy,
			32, 32,
			0, 0,
			32, 32)
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

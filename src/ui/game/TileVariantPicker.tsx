import React, { ReactElement, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { allVariants, Variant } from '../../game/ecs/terrain'
import { GameContext } from './GameLayout'
import MouseActionIcon from './MouseActionIcon'

interface Props {
	onPicked?(which: Variant): void
}

function Component(props: Props) {
	const game = useContext(GameContext)
	const [variants, setVariants] = useState<ReactElement[]>([])

	useEffect(() => {
		setVariants(allVariants.map(v => (
			<MouseActionIcon
				opened={false}
				onClicked={() => props.onPicked?.(v)}
				variant={v}
				key={`${v}`}
			/>
		)))
	}, [game])

	return (
		<div className="TileSelector">
			{variants}
		</div>
	)
}

export default Component

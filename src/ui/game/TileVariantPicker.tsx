import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { IconComponent } from '../../game/ecs/components'
import { allVariants } from '../../game/ecs/terrain'
import { MouseAction } from './frontend-controller'
import { GameContext } from './GameLayout'
import MouseActionIcon from './MouseActionIcon'

interface Props {
	onPicked?(which: MouseAction): void
}

function Component(props: Props) {
	const game = useContext(GameContext)

	const [actions, setActions] = useState<ReactElement[]>([])

	useEffect(() => {
		if (game == undefined) return
		const entitiesWithIcons = game.dataPack.entityTypes
			.filter((e) => e.componentNames.has('IconComponent'))


		setActions([
			...allVariants.map(v => {
				const a = {
					type: 'set-tile',
					iconIndex: v as number,
				} as MouseAction
				return <MouseActionIcon
					action={a}
					opened={false}
					onClicked={() => props.onPicked?.(a)}
					key={`${v}`}
				/>
			}),
			...entitiesWithIcons.map((e,i) => {
				const entity = e.getTemplate() as unknown as IconComponent
				const a = {
					type: 'spawn-entity',
					iconIndex: entity.iconIndex,
					entityName: e.id,
				} as MouseAction
				return <MouseActionIcon
					action={a}
					opened={false}
					onClicked={() => props.onPicked?.(a)}
					key={`${i + allVariants.length}`}
				/>
			})
		])
	}, [game])

	return (
		<div className="TileSelector">
			{actions}
		</div>
	)
}

export default Component

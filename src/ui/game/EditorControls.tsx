import React, { useContext, useEffect, useState } from 'react'
import { Variant } from '../../game/ecs/terrain'
import { EditorFrontedController, FrontedControllerContext } from './frontend-controller'
import MouseActionIcon from './MouseActionIcon'

interface Props {
}

function Component(props: Props) {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [openedIndex, setOpenedIndex] = useState(-1)
	const [variants, setVariants] = useState<Variant[]>([])

	useEffect(() => {
		setVariants(controller.variants)
	}, [controller])

	const picked = (i: number) => (v: Variant) => {
		setOpenedIndex(-1)
		controller.variants[i] = v
		setVariants([...controller.variants])
	}

	return (
		<div className="EditorControls">
			<div className="MouseActionsParent">
				{
					variants.map((v, i) => <MouseActionIcon
						variant={v}
						key={`${i}`}
						opened={openedIndex === i}
						onClicked={() => setOpenedIndex(i)}
						onPicked={picked(i)}/>)
				}
			</div>
		</div>
	)
}

export default Component

import React, { useContext, useEffect, useState } from 'react'
import { EditorFrontedController, FrontedControllerContext, MouseAction } from './frontend-controller'
import MouseActionIcon from './MouseActionIcon'

interface Props {
}

function Component(props: Props) {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [openedIndex, setOpenedIndex] = useState(-1)
	// const [variants, setVariants] = useState<Variant[]>([])
	const [actions, setActions] = useState<MouseAction[]>([])

	useEffect(() => {
		// setVariants(controller.variants)
		setActions(controller.mouseActions)
	}, [controller])

	const picked = (i: number) => (a: MouseAction) => {
		setOpenedIndex(-1)
		// controller.variants[i] = v
		// setVariants([...controller.variants])
		controller.mouseActions[i] = a
		setActions([...controller.mouseActions])
	}

	return (
		<div className="EditorControls">
			{/*<div className="MouseActionsParent">*/}
			{/*	{*/}
			{/*		variants.map((v, i) => <MouseActionIcon*/}
			{/*			type={'tile'}*/}
			{/*			variant={v}*/}
			{/*			key={`${i}`}*/}
			{/*			opened={openedIndex === i}*/}
			{/*			onClicked={() => setOpenedIndex(i)}*/}
			{/*			onPicked={picked(i)}/>)*/}
			{/*	}*/}
			{/*</div>*/}

			<div className="MouseActionsParent">
				{
					actions.map((a, i) => <MouseActionIcon
						action={a}
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

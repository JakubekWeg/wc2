import React, { useContext, useEffect, useState } from 'react'
import { PredefinedDrawableComponent, TilesIncumbentComponent } from '../../game/ecs/components'
import { Entity } from '../../game/ecs/world'
import { BuildingPreview, NullPreview } from '../../game/renderer'
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
		controller.mouseActions[i] = a
		if (a.type === 'spawn-entity' && a.entityName) {
			const template = controller.game.world.getEntityTemplate(a.entityName) as Entity & PredefinedDrawableComponent & TilesIncumbentComponent
			controller.renderer.currentlyShowingHoverPreview = new BuildingPreview(template, controller.game, 0, 0)
		} else {
			controller.renderer.currentlyShowingHoverPreview = new NullPreview()
		}

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

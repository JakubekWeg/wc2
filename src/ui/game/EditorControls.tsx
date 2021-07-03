import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { allVariants, Variant } from '../../game/ecs/variant'
import { NullPreview, SetVariantPreview, SpawnEntityPreview } from '../../game/renderer-pointers'
import { EditorFrontedController, FrontedControllerContext } from './frontend-controller'
import MouseActionIcon2 from './MouseActionIcon2'

interface Props {
}

function NoneMode(): ReactElement {
	return <div className="EditorMode"/>
}

function TerrainPicker({onSelected}: { onSelected: (v: Variant) => void }): ReactElement {
	return <div className="TileSelector">
		{allVariants.map(v => {
			return <MouseActionIcon2
				iconIndex={v}
				image="tile-set"
				onClicked={(e) => {e.stopPropagation(); onSelected(v)}}
				key={`${v}`}
			/>
		})}
	</div>
}

function PlaceTerrainMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [variants, setVariants] = useState(controller.variantsToPlace)
	const [opened, setOpened] = useState(-1)

	useEffect(() => {
		controller.openedSelector = opened
	}, [opened])

	const selected = (i: number, v: Variant) => {
		controller.variantsToPlace[i] = v
		setVariants([...controller.variantsToPlace])
		setOpened(-1)
	}

	return <div className="EditorMode MouseActionsParent">
		{variants.map((v, i) => <MouseActionIcon2
			iconIndex={v}
			key={`${i}`}
			image="tile-set"
			onClicked={() => setOpened(i)}
			children={opened === i ? <TerrainPicker onSelected={(v) => selected(i, v)}/> : undefined}
		/>)}
	</div>
}


function PlaceEntitiesMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController

	return <div className="EditorMode PlaceEntitiesMode">
		entity?
	</div>
}

function Component(props: Props) {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [checked, setChecked] = useState(0)
	const [modes, setModes] = useState<ReactElement[]>([])

	useEffect(() => {
		switch (checked) {
			case 0:
				controller.renderer.currentlyShowingHoverPreview = new NullPreview()
				break
			case 1:
				controller.renderer.currentlyShowingHoverPreview = new SetVariantPreview(controller.game, controller)
				break
			case 2:
				controller.renderer.currentlyShowingHoverPreview = new SpawnEntityPreview('castle', controller.game)
				break
		}
	}, [checked])

	useEffect(() => {
		setModes([
			<label key="0">
				<input type="radio" name="method" checked={checked === 0} onChange={() => setChecked(0)}/>
				<p>Select units and buildings</p>
				<NoneMode/>
			</label>,
			<label key="1">
				<input type="radio" name="method" checked={checked === 1} onChange={() => setChecked(1)}/>
				<p>Modify the terrain</p>
				<PlaceTerrainMode/>
			</label>,
			<label key="2">
				<input type="radio" name="method" checked={checked === 2} onChange={() => setChecked(2)}/>
				<p>Spawn units and buildings</p>
				<PlaceEntitiesMode/>
			</label>,
		])
	}, [checked])


	return <div className="EditorControls">
		{modes}
	</div>

	// const [openedIndex, setOpenedIndex] = useState(-1)
	// const [actions, setActions] = useState<MouseAction[]>([])
	//
	// useEffect(() => {
	// 	setActions(controller.mouseActions)
	// }, [controller])
	//
	// const picked = (i: number) => (a: MouseAction) => {
	// 	setOpenedIndex(-1)
	// 	controller.mouseActions[i] = a
	// 	if (a.type === 'spawn-entity' && a.entityName) {
	// 		// controller.renderer.currentlyShowingHoverPreview = new BuildingPreview(a.entityName, controller.game, 0, 0)
	// 		controller.renderer.currentlyShowingHoverPreview = new SetVariantPreview(controller.game)
	// 	} else {
	// 		controller.renderer.currentlyShowingHoverPreview = new NullPreview()
	// 	}
	//
	// 	setActions([...controller.mouseActions])
	// }
	//
	// return (
	// 	<div className="EditorControls">
	// 		<div className="MouseActionsParent">
	// 			{
	// 				actions.map((a, i) => <MouseActionIcon
	// 					action={a}
	// 					key={`${i}`}
	// 					childComponent={<p>Hello</p>}
	// 					onClicked={() => setOpenedIndex(i)}
	// 					onPicked={picked(i)}/>)
	// 			}
	// 		</div>
	// 		{/*<div className="MouseActionsParent">*/}
	// 		{/*	{*/}
	// 		{/*		actions.map((a, i) => <MouseActionIcon*/}
	// 		{/*			action={a}*/}
	// 		{/*			key={`${i}`}*/}
	// 		{/*			opened={openedIndex === i}*/}
	// 		{/*			onClicked={() => setOpenedIndex(i)}*/}
	// 		{/*			onPicked={picked(i)}/>)*/}
	// 		{/*	}*/}
	// 		{/*</div>*/}
	// 	</div>
	// )
}

export default Component

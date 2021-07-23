import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { allVariants, Variant } from '../../../game/ecs/variant'
import { EditorFrontedController, FrontedControllerContext } from '../frontend-controller'
import MouseActionIcon from '../MouseActionIcon'

function TerrainPicker({onSelected}: { onSelected: (v: Variant) => void }): ReactElement {
	return <div className="TileSelector">
		{allVariants.map(v => {
			return <MouseActionIcon
				iconIndex={v}
				image="tile-set"
				onClicked={(e) => {
					e.stopPropagation()
					onSelected(v)
				}}
				key={`${v}`}
			/>
		})}
	</div>
}

export function PlaceTerrainMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [variants, setVariants] = useState(controller.variantsToPlace)
	const [terrainSize, setTerrainSize] = useState(controller.setTerrainSize)
	const [opened, setOpened] = useState(-1)

	useEffect(() => {
		controller.setTerrainSize = terrainSize
	}, [terrainSize, controller])

	useEffect(() => {
		controller.openedSelector = opened
	}, [opened, controller])

	const selected = (i: number, v: Variant) => {
		controller.variantsToPlace[i] = v
		setVariants([...controller.variantsToPlace])
		setOpened(-1)
	}

	return <div className="EditorMode">
		<div className="MouseActionsParent">
			{variants.map((v, i) => <MouseActionIcon
				iconIndex={v}
				key={`${i}`}
				image="tile-set"
				onClicked={() => setOpened(i)}
				children={opened === i ? <TerrainPicker onSelected={(v) => selected(i, v)}/> : undefined}
			/>)}
		</div>

		<div className="MouseActionsParent">
			<label>
				<input type="radio" name="terrain-size" checked={1 === terrainSize} onChange={() => setTerrainSize(1)}/>
				1x1
			</label>
			<label>
				<input type="radio" name="terrain-size" checked={2 === terrainSize} onChange={() => setTerrainSize(2)}/>
				3x3
			</label>
			<label>
				<input type="radio" name="terrain-size" checked={3 === terrainSize} onChange={() => setTerrainSize(3)}/>
				5x5
			</label>
		</div>
	</div>
}

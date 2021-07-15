import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { SelectEntitiesPreview } from '../../game/pointer-previews/previews'
import { SetVariantPreview } from '../../game/pointer-previews/set-variant-preview'
import { SpawnEntityPreview } from '../../game/pointer-previews/spawn-entity-preview'
import { NoneMode, PlaceEntitiesMode, PlaceTerrainMode } from './EditorModes'
import { EditorFrontedController, FrontedControllerContext } from './frontend-controller'


function Component() {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [checked, setChecked] = useState(0)
	const [modes, setModes] = useState<ReactElement[]>([])

	useEffect(() => {
		switch (checked) {
			case 0:
				controller.renderer.currentlyShowingHoverPreview = new SelectEntitiesPreview(controller)
				break
			case 1:
				controller.renderer.currentlyShowingHoverPreview = new SetVariantPreview(controller.game, controller)
				break
			case 2:
				controller.renderer.currentlyShowingHoverPreview = new SpawnEntityPreview(controller.entityToSpawn.id, controller.game)
				break
		}
	}, [checked, controller])

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
}

export default Component

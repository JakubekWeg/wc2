import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { IconComponent } from '../../../game/ecs/components'
import { Entity, EntityType } from '../../../game/ecs/world'
import { allColorNames, EntityColor } from '../../../game/misc/colors-palette'
import { SpawnEntityPreview } from '../../../game/pointer-previews/spawn-entity-preview'
import { EditorFrontedController, FrontedControllerContext } from '../frontend-controller'
import MouseActionIcon from '../MouseActionIcon'

function EntityPicker({
	                      onSelected,
	                      entities,
	                      color,
                      }: { entities: EntityType[], onSelected: (i: number) => void, color: EntityColor }): ReactElement {
	return <div className="TileSelector">
		{entities.map((e, i) => {
			const icon = (e.getTemplate() as unknown as IconComponent).iconIndex
			return <MouseActionIcon
				iconIndex={icon}
				image="icons"
				color={color}
				onClicked={(e) => {
					e.stopPropagation()
					onSelected(i)
				}}
				key={e.id}
			/>
		})}
	</div>
}

function ColorsPicker({onSelected}: { onSelected: (i: EntityColor) => void }): ReactElement {
	return <div className="TileSelector">
		{allColorNames.map((e, i) => {
			return <MouseActionIcon
				iconIndex={i}
				image="color"
				onClicked={(e) => {
					e.stopPropagation()
					onSelected(i)
				}}
				key={e}
			/>
		})}
	</div>
}

export function PlaceEntitiesMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [isOpen, setOpen] = useState(0)
	const forces = useMemo(() => controller.game.forces.getAll(), [controller])
	const [selectedForceIndex, setForceIndex] = useState(forces.indexOf((controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithForce))
	const [selectedColor, setSelectedColor] = useState((controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithColor ?? EntityColor.Red)

	useEffect(() => {
		setOpen(0)
		const entity = controller.entityToSpawn = controller.entitiesToPickFrom[selectedIndex];
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview)?.setEntityType?.(entity.id)
	}, [selectedIndex, controller])

	useEffect(() => {
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithForce = forces[selectedForceIndex]
	}, [selectedForceIndex, controller, forces])

	useEffect(() => {
		setOpen(0);
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithColor = selectedColor
	}, [selectedColor, controller])

	return <div className="EditorMode PlaceEntitiesMode">
		<MouseActionIcon
			iconIndex={(controller.entitiesToPickFrom[selectedIndex]?.getTemplate() as Entity & IconComponent)?.iconIndex}
			image="icons"
			onClicked={() => setOpen(1)}
			color={selectedColor}
			children={isOpen === 1 ?
				<EntityPicker entities={controller.entitiesToPickFrom} onSelected={setSelectedIndex}
				              color={selectedColor}/> : undefined}
		/>

		<MouseActionIcon
			image="color"
			iconIndex={selectedColor}
			onClicked={() => setOpen(2)}
			children={isOpen === 2 ?
				<ColorsPicker onSelected={(c) => setSelectedColor(c)}/> : undefined}
		/>

		<select value={forces[selectedForceIndex]?.id}
		        onChange={e => setForceIndex(e.target.selectedIndex)}>
			{forces.map(f =>
				<option
					key={`${f.id}`}
					value={f.id}>
					{f.name}
				</option>)
			}
		</select>
	</div>
}

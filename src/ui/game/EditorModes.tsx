import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { IconComponent } from '../../game/ecs/components'
import { allVariants, Variant } from '../../game/ecs/variant'
import { Entity, EntityType } from '../../game/ecs/world'
import { allColorNames, EntityColor } from '../../game/misc/colors-palette'
import { SpawnEntityPreview } from '../../game/renderer-pointers'
import { EditorFrontedController, FrontedControllerContext } from './frontend-controller'
import MouseActionIcon from './MouseActionIcon'

export function NoneMode(): ReactElement {
	return <div className="EditorMode"/>
}

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
		{variants.map((v, i) => <MouseActionIcon
			iconIndex={v}
			key={`${i}`}
			image="tile-set"
			onClicked={() => setOpened(i)}
			children={opened === i ? <TerrainPicker onSelected={(v) => selected(i, v)}/> : undefined}
		/>)}
	</div>
}

function EntityPicker({
	                      onSelected,
	                      entities,
                      }: { entities: EntityType[], onSelected: (i: number) => void }): ReactElement {
	return <div className="TileSelector">
		{entities.map((e, i) => {
			const icon = (e.getTemplate() as unknown as IconComponent).iconIndex
			return <MouseActionIcon
				iconIndex={icon}
				image="icons"
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
	const forces = useMemo(() => controller.game.forces.getAll(), [])
	const [selectedForceIndex, setForceIndex] = useState(forces.indexOf((controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithForce))
	const [selectedColor, setSelectedColor] = useState((controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithColor ?? EntityColor.Red)

	useEffect(() => {
		setOpen(0)
		const entity = controller.entityToSpawn = controller.entitiesToPickFrom[selectedIndex];
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview)?.setEntityType?.(entity.id)
	}, [selectedIndex])

	useEffect(() => {
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithForce = forces[selectedForceIndex]
	}, [selectedForceIndex])

	useEffect(() => {
		setOpen(0);
		(controller.renderer.currentlyShowingHoverPreview as SpawnEntityPreview).spawnWithColor = selectedColor
	}, [selectedColor])

	return <div className="EditorMode PlaceEntitiesMode">
		<MouseActionIcon
			iconIndex={(controller.entitiesToPickFrom[selectedIndex]?.getTemplate() as Entity & IconComponent)?.iconIndex}
			image="icons"
			onClicked={() => setOpen(1)}
			children={isOpen === 1 ?
				<EntityPicker entities={controller.entitiesToPickFrom} onSelected={setSelectedIndex}/> : undefined}
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

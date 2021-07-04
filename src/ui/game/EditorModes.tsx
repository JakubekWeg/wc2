import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { IconComponent } from '../../game/ecs/components'
import { allVariants, Variant } from '../../game/ecs/variant'
import { Entity, EntityType } from '../../game/ecs/world'
import { SpawnEntityPreview } from '../../game/renderer-pointers'
import { EditorFrontedController, FrontedControllerContext } from './frontend-controller'
import MouseActionIcon2 from './MouseActionIcon'

export function NoneMode(): ReactElement {
	return <div className="EditorMode"/>
}

function TerrainPicker({onSelected}: { onSelected: (v: Variant) => void }): ReactElement {
	return <div className="TileSelector">
		{allVariants.map(v => {
			return <MouseActionIcon2
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
		{variants.map((v, i) => <MouseActionIcon2
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
			return <MouseActionIcon2
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

export function PlaceEntitiesMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [isOpen, setOpen] = useState(false)

	useEffect(() => {
		setOpen(false)
		const entity = controller.entityToSpawn = controller.entitiesToPickFrom[selectedIndex]
		controller.renderer.currentlyShowingHoverPreview = new SpawnEntityPreview(entity.id, controller.game)
	}, [selectedIndex])

	return <div className="EditorMode PlaceEntitiesMode">
		<MouseActionIcon2
			iconIndex={(controller.entitiesToPickFrom[selectedIndex]?.getTemplate() as Entity & IconComponent)?.iconIndex}
			image="icons"
			key={controller.entitiesToPickFrom[selectedIndex]?.id}
			onClicked={() => setOpen(!isOpen)}
			children={isOpen ?
				<EntityPicker entities={controller.entitiesToPickFrom} onSelected={setSelectedIndex}/> : undefined}
		/>
	</div>
}

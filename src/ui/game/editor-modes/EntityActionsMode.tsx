import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { EntityAction, EntityActionContext } from '../../../game/ecs/actions/entity-action'
import { ActionsComponent, DamageableComponent, SelectableComponent } from '../../../game/ecs/components'
import { Entity } from '../../../game/ecs/world'
import { EntityColor } from '../../../game/misc/colors-palette'
import { EditorFrontedController, FrontedControllerContext } from '../frontend-controller'
import MouseActionIcon from '../MouseActionIcon'

type InspectableEntity = Entity & SelectableComponent & DamageableComponent & ActionsComponent

interface ManyUnitsSelectionProps {
	entities: (InspectableEntity)[],
	onClicked: (which: InspectableEntity) => void
	onActionClicked: (action: EntityAction) => void
}

function ManyUnitsSelection({entities, onClicked, onActionClicked}: ManyUnitsSelectionProps): ReactElement {
	return <div>
		<div className="LimitedMouseActionsParent">
			{entities.map((e) => (
				<MouseActionIcon
					key={`${e.id}`}
					image={'icons'}
					iconIndex={e.iconIndex}
					color={e.myColor}
					onClicked={() => onClicked(e)}
				/>
			))}
		</div>
		<hr/>
		{entities.length > 0 &&
        <EntityActionsList
            onActionClicked={onActionClicked}
            actions={entities[0].availableActions}
            color={entities[0].myColor}/>}
	</div>
}

interface SingleUnitSelectionParams {
	entity: InspectableEntity
	onActionClicked: (action: EntityAction) => void
}

function SingleUnitSelection({entity, onActionClicked}: SingleUnitSelectionParams): ReactElement {
	return <div className="SingleUnitSelectionParent">
		<div>
			<MouseActionIcon
				image={'icons'}
				iconIndex={entity.iconIndex}
				color={entity.myColor}
			/>
		</div>
		<div>
			Prototype: {entity.typeName}<br/>
			Entity ID: {entity.id}<br/>
			Force: {entity.myForce.name} ({entity.myForce.id})<br/>
		</div>
		<hr/>
		<EntityActionsList
			onActionClicked={onActionClicked}
			actions={entity.availableActions}
			color={entity.myColor}/>
	</div>
}

interface EntityActionsListProps {
	actions?: EntityAction[]
	color: EntityColor
	onActionClicked: (action: EntityAction) => void
}

function EntityActionsList({actions, color, onActionClicked}: EntityActionsListProps): ReactElement {
	return <div className="LimitedMouseActionsParent">
		{actions?.map((action, index) => (
			<MouseActionIcon iconIndex={action.iconIndex}
			                 key={`${index}`}
			                 image={'icons'}
			                 color={color}
			                 onClicked={() => onActionClicked(action)}/>
		))}
	</div>
}

export function EntityActionsMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [entities, setEntities] = useState<InspectableEntity[]>([])

	useEffect(() => {
		controller.listenSelectedEntities((entities) => {
			setEntities(Array.from(entities) as InspectableEntity[])
		})

		return () => {
			controller.listenSelectedEntities(undefined)
		}
	}, [controller])

	const onActionClicked = (a: EntityAction) => {
		if (entities.length === 0) return
		const ctx = {
			game: controller.game,
			entity: entities[0],
		} as EntityActionContext

		if (a.isAvailable(ctx)) {
			if (a.requiresSelector(ctx))
				ctx.targetTile = {x: 0, y: 0} // TODO make actual selector call

			controller.game.dispatchNextTick(() => {
				for (const entity of entities) {
					a.execute({...ctx, entity})
				}
			})
		}
	}

	return <div className="EditorMode">
		{
			entities.length === 1 ?
				<SingleUnitSelection
					entity={entities[0]}
					onActionClicked={onActionClicked}/>
				:
				<ManyUnitsSelection
					entities={entities}
					onActionClicked={onActionClicked}
					onClicked={e => controller.setSelectedEntities([e])}/>
		}
	</div>
}


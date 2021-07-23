import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { DamageableComponent, SelectableComponent } from '../../../game/ecs/components'
import { Entity } from '../../../game/ecs/world'
import { EditorFrontedController, FrontedControllerContext } from '../frontend-controller'
import MouseActionIcon from '../MouseActionIcon'


interface ManyUnitsSelectionProps {
	entities: (Entity & SelectableComponent & DamageableComponent)[],
	onClicked: (which: Entity & SelectableComponent & DamageableComponent) => void
}

function ManyUnitsSelection({entities, onClicked}: ManyUnitsSelectionProps): ReactElement {
	return <div className="LimitedMouseActionsParent">
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
}

export function EntityActionsMode(): ReactElement {
	const controller = useContext(FrontedControllerContext) as EditorFrontedController
	const [entities, setEntities] = useState<(Entity & SelectableComponent & DamageableComponent)[]>([])

	useEffect(() => {
		controller.listenSelectedEntities((entities) => {
			setEntities(Array.from(entities) as any[])
		})

		return () => {
			controller.listenSelectedEntities(undefined)
		}
	}, [controller])

	return <div className="EditorMode">
		<ManyUnitsSelection entities={entities}
		                    onClicked={e => controller.setSelectedEntities([e])}/>
	</div>
}


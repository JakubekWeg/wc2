import React, { useState } from 'react'
import { GameInstanceImpl } from '../../game/game-instance'
import EditorControls from './EditorControls'
import { FrontendController } from './frontend-controller'
import Minimap from './Minimap'

interface Props {

}

function GameLeftControls(props: Props): React.ReactElement {

	return (
		<div className="GameLeftControls">
			<Minimap/>
			<EditorControls/>
		</div>
	)
}

export default GameLeftControls

import React from 'react'
import EditorControls from './EditorControls'
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

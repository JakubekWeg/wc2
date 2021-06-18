import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import Game from './Game'
import { createEntityType } from './game/ecs/entities/composer'
import { GameInstance } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { DebugOptions } from './game/renderer'

const debugOptions: DebugOptions = {
	showTilesOccupation: false,
	showPaths: false,
	showChunkBoundaries: false,
	showTileListenersCount: false,
}

function App() {
	const [gameInstance, setGameInstance] = useState<GameInstance>()
	useEffect(() => {
		(async () => {
			const settings: GameSettings = {
				mapWidth: 40,
				mapHeight: 20,
				entityTypes: [],
			}
			const response = await (await fetch('/entities-description.json')).json()
			for (const key in response.entities) {
				if (response.entities.hasOwnProperty(key)) {
					const description = response.entities[key]
					const type = createEntityType(key, description)
					settings.entityTypes.push(type)
				}
			}
			setGameInstance(GameInstance.createNewGame(settings))
		})()
	}, [])

	const reload = useCallback(() => {
		if (gameInstance) {
			setGameInstance(undefined)
			const x = localStorage.getItem('last-save')
			if (x) {
				const save = JSON.parse(x)
				const game = GameInstance.loadGameFromObj(gameInstance.settings.entityTypes, save)
				setGameInstance(game)
			}
		}
	}, [gameInstance])

	if (!gameInstance)
		return (<p>Loading...</p>)
	return (
		<div className="App">
			<Game debugOptions={debugOptions} settings={gameInstance.settings} reloadRequested={reload}
			      gameInstance={gameInstance}/>
		</div>
	)
}

export default App

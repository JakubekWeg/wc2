import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import Config from './config/config'
import Game from './Game'
import { DataPack, fetchDataPack } from './game/data-pack'
import { GameInstanceImpl } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { DebugOptions } from './game/renderer'

const debugOptions: DebugOptions = {
	showTilesOccupation: false,
	showPaths: false,
	showChunkBoundaries: false,
	showTileListenersCount: false,
}

function App() {
	const [dataPack, setDataPack] = useState<DataPack>()
	const [gameInstance, setGameInstance] = useState<GameInstanceImpl>()

	useEffect(() => {
		(async () => {
			const settings: GameSettings = {
				mapWidth: 40,
				mapHeight: 20,
			}

			const dp = await fetchDataPack('/entities-description.json')

			setDataPack(dp)
			setGameInstance(GameInstanceImpl.createNewGame(settings, dp))
		})()
	}, [])

	const reload = useCallback(() => {
		if (dataPack == null) return
		if (gameInstance) {
			setGameInstance(undefined)
			const x = localStorage.getItem('last-save')
			if (x) {
				const save = Config.createConfigFromObject(JSON.parse(x))
				// const save = JSON.parse(x)
				const game = GameInstanceImpl.loadGameFromObj(dataPack, save)
				setGameInstance(game)
			}
		}
	}, [gameInstance, dataPack])

	if (!gameInstance)
		return (<p>Loading...</p>)
	return (
		<div className="App">
			<Game debugOptions={debugOptions}
			      settings={gameInstance.settings}
			      reloadRequested={reload}
			      gameInstance={gameInstance}/>
		</div>
	)
}

export default App

import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import Config  from './config/config'
import Game from './Game'
import { AnimationFrames } from './game/ecs/entities/common'
import { createEntityType } from './game/ecs/entities/composer'
import { GameInstanceImpl } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { ResourcesManager, TextureType } from './game/misc/resources-manager'
import { DebugOptions } from './game/renderer'

const debugOptions: DebugOptions = {
	showTilesOccupation: false,
	showPaths: false,
	showChunkBoundaries: false,
	showTileListenersCount: false,
}

function App() {
	const [resourceManager, setResourceManager] = useState<ResourcesManager>()
	const [gameInstance, setGameInstance] = useState<GameInstanceImpl>()

	useEffect(() => {
		(async () => {
			const settings: GameSettings = {
				mapWidth: 40,
				mapHeight: 20,
				entityTypes: [],
			}

			const mgr = new ResourcesManager()
			const config = Config
				.createConfigFromObject(await (await fetch('/entities-description.json')).json())

			// load textures
			await Promise.all(Array.from(config.child('textures').objectEntries())
				.map(([key, obj]) => mgr
					.addAsset(key, obj.requireString('name'), obj.requirePositiveInt('spriteSize'), obj.requireString('type') as TextureType)))

			// load keyframes
			for (const [key, obj] of config.child('animations').objectEntries()) {
				const frames: AnimationFrames = obj.getAsNotEmptyListOfNonNegativeIntegers()
				config.setRegistryValue('animation', key, frames)
			}


			// load entity types
			for (const [key, obj] of config.child('entities').objectEntries()) {
				settings.entityTypes.push(createEntityType(key, obj, mgr))
			}

			setResourceManager(mgr)
			setGameInstance(GameInstanceImpl.createNewGame(settings, mgr))
		})()
	}, [])

	const reload = useCallback(() => {
		if (resourceManager == null) return
		if (gameInstance) {
			setGameInstance(undefined)
			const x = localStorage.getItem('last-save')
			if (x) {
				const save = Config.createConfigFromObject(JSON.parse(x))
				// const save = JSON.parse(x)
				const game = GameInstanceImpl.loadGameFromObj(gameInstance.settings.entityTypes, resourceManager, save)
				setGameInstance(game)
			}
		}
	}, [gameInstance, resourceManager])

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

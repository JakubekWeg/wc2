import React, { useEffect, useState } from 'react'
import Config from '../game/config'
import { fetchDataPack } from '../game/data-pack'
import { GameInstanceImpl } from '../game/game-instance'
import './App.css'
import GameLayout from './game/GameLayout'

export interface LoadMethod {
	type: 'new' | 'saved'
}

function App() {
	const [gameInstance, setGameInstance] = useState<GameInstanceImpl>()
	const [loadMethod, setLoadMethod] = useState<LoadMethod>({type: 'saved'})


	useEffect(() => {
		let cancelled: boolean = false;
		(async () => {
			const dp = await fetchDataPack('/entities-description.json')
			if (cancelled) return

			let game: GameInstanceImpl
			const str = localStorage.getItem('last-save')
			if (str && loadMethod.type === 'saved') {
				const save = Config.createConfigFromObject(JSON.parse(str))
				game = GameInstanceImpl.loadGameFromObj(dp, save)
			} else {
				game = GameInstanceImpl.createNewGame({
					mapSize: 32,
				}, dp)
			}

			setGameInstance(game)
		})()
		return () => {
			cancelled = true
		}
	}, [loadMethod])

	if (gameInstance == null)
		return (<div>Loading... please wait</div>)

	return (
		<div className="App">
			<GameLayout game={gameInstance} reloadRequest={m => setLoadMethod(m)}/>
		</div>
	)
}

export default App

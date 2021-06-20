import React, { useEffect, useState } from 'react'
import Config from '../../config/config'
import { fetchDataPack } from '../../game/data-pack'
import { GameInstanceImpl } from '../../game/game-instance'
import GameCanvas from './GameCanvas'
import GameLeftTopControls from './GameLeftControls'
import ResourcesBar from './ResourcesBar'


function Component() {
	const [game, setGame] = useState<GameInstanceImpl>()

	useEffect(() => {
		let cancelled: boolean = false;
		(async () => {
			const dp = await fetchDataPack('/entities-description.json')
			if (cancelled) return

			const str = localStorage.getItem('last-save')
			if (str) {
				const save = Config.createConfigFromObject(JSON.parse(str))
				const game = GameInstanceImpl.loadGameFromObj(dp, save)
				setGame(game)
			} else {
				const game = GameInstanceImpl.createNewGame({
					mapWidth: 60,
					mapHeight: 30,
				}, dp)
				setGame(game)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		game?.startGame()
		return () => game?.stopGame()
	}, [game])

	if (game == null)
		return (<div className="GameLayout">Loading... please wait</div>)

	return (
		<div className="GameLayout">
			<GameLeftTopControls/>
			<ResourcesBar/>
			<GameCanvas game={game} />
		</div>
	)
}

export default Component

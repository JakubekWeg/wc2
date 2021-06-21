import React, { useEffect, useState } from 'react'
import Config from '../../config/config'
import { fetchDataPack } from '../../game/data-pack'
import { DamageableComponent, PredefinedDrawableComponent, TilesIncumbentComponent } from '../../game/ecs/components'
import { Entity } from '../../game/ecs/world'
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
					mapWidth: 32,
					mapHeight: 32,
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
			<GameCanvas game={game} tileClicked={(x, y,which: number) => {
				game?.dispatchNextTick(world => {
					if (which === 2) {
						const e = world.spawnEntity('castle') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
						e.mostWestTile = x
						e.mostNorthTile = y
						e.destinationDrawX = x * 32
						e.destinationDrawY = y * 32
						e.myForce = game?.forces.getForce(1)

						// const e = world.spawnEntity('catapult') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
						// e.mostWestTile = x
						// e.mostNorthTile = y
						// e.destinationDrawX = x * 32 - 20
						// e.destinationDrawY = y * 32 - 20
						// e.myForce = game?.forces.getForce(1)
					} else if (which === 0) {
						const e = world.spawnEntity('elven-archer') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
						e.mostWestTile = x
						e.mostNorthTile = y
						e.destinationDrawX = x * 32 - 20
						e.destinationDrawY = y * 32 - 20
						e.myForce = game?.forces.getForce(2)
					}
				})
			}
			}/>
		</div>
	)
}

export default Component

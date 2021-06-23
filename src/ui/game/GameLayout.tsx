import React, { useEffect, useState } from 'react'
import { Camera, CameraDirection, CameraImpl } from '../../game/camera'
import { Variant } from '../../game/ecs/terrain'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { LoadMethod } from '../App'
import GameCanvas from './GameCanvas'
import GameLeftTopControls from './GameLeftControls'
import ResourcesBar from './ResourcesBar'

export interface GameComponents {
	game: GameInstanceImpl
	camera: Camera
	renderer: Renderer
}

interface Props {
	game: GameInstanceImpl
	reloadRequest: (method: LoadMethod) => void
}

function Component(props: Props) {
	const [parts, setGame] = useState<GameComponents>()

	useEffect(() => {
		const game = props.game
		const camera = CameraImpl.createNew(game.settings)
		const renderer = new Renderer(game.settings, camera)

		renderer.setGameInstance(game)

		setGame({
			game,
			camera,
			renderer,
		})

		return () => {
			renderer.setGameInstance(undefined)
			renderer.setCanvas(undefined)
		}
	}, [props])

	useEffect(() => {
		const game = parts
		const keydownCallback = (ev: KeyboardEvent) => {
			if (!game) return
			let dir: CameraDirection | undefined = undefined
			switch (ev.code) {
				case 'Digit1':
					game.renderer.toggleDebugOptions('showTilesOccupation')
					break
				case 'Digit2':
					game.renderer.toggleDebugOptions('showPaths')
					break
				case 'Digit3':
					game.renderer.toggleDebugOptions('showChunkBoundaries')
					break
				case 'Digit4':
					game.renderer.toggleDebugOptions('showTileListenersCount')
					break
				case 'Digit5':
					game.renderer.toggleDebugOptions('renderZoomedOut')
					break
				case 'KeyN': {
					const obj = game.game.generateSaveJson()
					localStorage.setItem('last-save', JSON.stringify(obj))
					break
				}
				case 'KeyM':
					props.reloadRequest({type: 'saved'})
					break
				case 'KeyB':
					props.reloadRequest({type: 'new'})
					break
				case 'ArrowRight':
					dir = CameraDirection.Right
					break
				case 'ArrowLeft':
					dir = CameraDirection.Left
					break
				case 'ArrowUp':
					dir = CameraDirection.Up
					break
				case 'ArrowDown':
					dir = CameraDirection.Down
					break
				case 'Equal':
					game.camera.setZooming(true, true)
					break
				case 'Minus':
					game.camera.setZooming(false, true)
					break
			}
			if (dir !== undefined)
				game.camera.setMoving(dir, true)
		}
		const keyupCallback = (ev: any) => {
			if (!game) return
			let dir: CameraDirection | undefined = undefined
			switch (ev.code) {
				case 'ArrowRight':
					dir = CameraDirection.Right
					break
				case 'ArrowLeft':
					dir = CameraDirection.Left
					break
				case 'ArrowUp':
					dir = CameraDirection.Up
					break
				case 'ArrowDown':
					dir = CameraDirection.Down
					break
				case 'Equal':
					game.camera.setZooming(true, false)
					break
				case 'Minus':
					game.camera.setZooming(false, false)
					break
			}
			if (dir !== undefined)
				game.camera.setMoving(dir, false)
		}
		window.addEventListener('keydown', keydownCallback, {passive: true})
		window.addEventListener('keyup', keyupCallback, {passive: true})

		return () => {
			window.removeEventListener('keydown', keydownCallback)
			window.removeEventListener('keyup', keyupCallback)
			if (!game) return
			game.renderer.setGameInstance(undefined)
		}
	}, [parts])

	useEffect(() => {
		parts?.game.startGame()
		return () => parts?.game.stopGame()
	}, [parts])


	if (parts == null)
		return (<div className="GameLayout">Loading... please wait</div>)

	const getVariant = (btn: number | undefined): Variant => {
		switch (btn) {
			case 0:
				return Variant.DarkWater
			case 1:
				return Variant.DarkGrass
			case 2:
				return Variant.DarkDirt
			default:
				throw new Error()
		}
	}

	return (
		<div className="GameLayout">
			<GameLeftTopControls/>
			<ResourcesBar/>
			<GameCanvas game={parts}
			            mouseDown={(e) => {
				            parts?.game.terrain.setVariantForTile(e.tileX, e.tileY, getVariant(e.button))
			            }
			            }
			            mouseMoved={(e) => {
				            if (e.button !== undefined) {
					            parts?.game.terrain.setVariantForTile(e.tileX, e.tileY, getVariant(e.button))
				            }
			            }
			            }
				// tileClicked={(x, y, which: number) => {
				//     game?.dispatchNextTick(world => {
				//         if (which === 2) {
				//             const e = world.spawnEntity('castle') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
				//             e.mostWestTile = x
				//             e.mostNorthTile = y
				//             e.destinationDrawX = x * 32
				//             e.destinationDrawY = y * 32
				//             e.myForce = game?.forces.getForce(1)
				//
				//             // const e = world.spawnEntity('catapult') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
				//             // e.mostWestTile = x
				//             // e.mostNorthTile = y
				//             // e.destinationDrawX = x * 32 - 20
				//             // e.destinationDrawY = y * 32 - 20
				//             // e.myForce = game?.forces.getForce(1)
				//         } else if (which === 0) {
				//             const e = world.spawnEntity('elven-archer') as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
				//             e.mostWestTile = x
				//             e.mostNorthTile = y
				//             e.destinationDrawX = x * 32 - 20
				//             e.destinationDrawY = y * 32 - 20
				//             e.myForce = game?.forces.getForce(2)
				//         }
				//     })
				// }
				// }
			/>
		</div>
	)
}

export default Component

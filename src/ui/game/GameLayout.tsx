import React, { createContext, useEffect, useState } from 'react'
import { Camera, CameraDirection, CameraImpl } from '../../game/camera'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'
import { LoadMethod } from '../App'
import { EditorFrontedController, FrontedControllerContext, FrontendController } from './frontend-controller'
import GameCanvas from './GameCanvas'
import GameLeftTopControls from './GameLeftControls'
import ResourcesBar from './ResourcesBar'

export interface GameComponents {
	game: GameInstanceImpl
	camera: Camera
	renderer: Renderer
	controller: FrontendController
}

interface Props {
	game: GameInstanceImpl
	reloadRequest: (method: LoadMethod) => void
}

export const GameContext = createContext<GameInstanceImpl | null>(null)

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
			controller: new EditorFrontedController(game),
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
	}, [parts,props])

	useEffect(() => {
		parts?.game.startGame()
		return () => parts?.game.stopGame()
	}, [parts])

	if (parts == null)
		return (<div className="GameLayout">Loading... please wait</div>)

	return (
		<GameContext.Provider value={parts.game}>
			<FrontedControllerContext.Provider value={parts.controller as EditorFrontedController}>
				<div className="GameLayout">
					<GameLeftTopControls/>
					<ResourcesBar/>
					<GameCanvas game={parts} mouseEvent={e => parts?.controller?.mouseEvent?.(e)}/>
				</div>
			</FrontedControllerContext.Provider>
		</GameContext.Provider>
	)
}

export default Component

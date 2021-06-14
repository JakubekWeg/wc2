import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import { PlayerCommandTakerComponent } from './game/ecs/components'
import { GameInstance } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { DebugOptions, Renderer } from './game/renderer'

const settings: GameSettings = {
	mapWidth: 40,
	mapHeight: 20,
	chunkSize: 4,
}

const debugOptions: DebugOptions = {
	showTilesOccupation: false,
	showPaths: false,
	showChunkBoundaries: false,
	showTileListenersCount: false,
}

function App() {
	const [renderer] = useState(new Renderer(settings))
	const [gameInstance] = useState(new GameInstance(settings))
	const [width, setWidth] = useState(window.innerWidth)
	const [height, setHeight] = useState(window.innerHeight)

	useEffect(() => {
		gameInstance.startGame()
		return () => gameInstance.stopGame()
	}, [gameInstance])

	useEffect(() => {
		renderer.updateDebugOptions(debugOptions)
		renderer.setGameInstance(gameInstance)
		renderer.setSize(width, height)
	}, [renderer, width, height, gameInstance])

	useEffect(() => {
		const resizeCallback = () => {
			const w = window.innerWidth / 2 | 0
			const h = window.innerHeight / 2 | 0
			setWidth(w)
			setHeight(h)
			renderer.setSize(w, h)
		}
		window.addEventListener('resize', resizeCallback, {passive: true})
		return () => window.removeEventListener('resize', resizeCallback)
	}, [setWidth, setHeight, renderer])

	useEffect(() => {
		const focusCallback = () => renderer.setPageFocused(true)
		const blurCallback = () => renderer.setPageFocused(false)
		const keyPressCallback = (ev: KeyboardEvent) => {
			switch (ev.code) {
				case 'Digit1':
					debugOptions.showTilesOccupation = !debugOptions.showTilesOccupation
					break
				case 'Digit2':
					debugOptions.showPaths = !debugOptions.showPaths
					break
				case 'Digit3':
					debugOptions.showChunkBoundaries = !debugOptions.showChunkBoundaries
					break
				case 'Digit4':
					debugOptions.showTileListenersCount = !debugOptions.showTileListenersCount
					break
			}
			renderer.updateDebugOptions(debugOptions)
		}
		window.addEventListener('focus', focusCallback, {passive: true})
		window.addEventListener('blur', blurCallback, {passive: true})
		window.addEventListener('keypress', keyPressCallback, {passive: false})
		return () => {
			window.removeEventListener('focus', focusCallback)
			window.removeEventListener('blur', blurCallback)
			window.removeEventListener('keypress', keyPressCallback)
		}
	}, [renderer])

	const canvasRefCallback = useCallback((canvas: HTMLCanvasElement) => {
		renderer.setCanvas(canvas)
	}, [renderer])

	const onClicked = useCallback((ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		ev.preventDefault()
		gameInstance.dispatchNextTick((world) => {
			let x = world.getSpawnedEntity(1) as unknown as PlayerCommandTakerComponent
			if (x.canAcceptCommands) {
				x.accept({
					type: 'go',
					targetX: ev.clientX / 32 / 2 | 0,
					targetY: ev.clientY / 32 / 2 | 0,
				}, gameInstance)
			}

			x = world.getSpawnedEntity(2) as unknown as PlayerCommandTakerComponent
			if (x.canAcceptCommands) {
				x.accept({
					type: 'go',
					targetX: ev.clientX / 32 / 2 | 0,
					targetY: ev.clientY / 32 / 2 | 0,
				}, gameInstance)
			}
		})
	}, [gameInstance])

	return (
		<div className="App">
			<canvas ref={canvasRefCallback}
			        onClick={onClicked}
			        onContextMenu={onClicked}
			        width={width}
			        height={height}
			        style={{width: `${width * 2}px`, height: `${height * 2}px`}}/>
		</div>
	)
}

export default App

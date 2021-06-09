import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import { ArcherEntity } from './ecs/entity-types'
import { GameInstance } from './game/game-instance'
import GameSettings from './game/game-settings'
import { Renderer } from './game/renderer'

const settings = {
	mapWidth: 40,
	mapHeight: 20,
	tileSizeInPixels: 32
} as GameSettings

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
		renderer.setGameInstance(gameInstance)
		renderer.setSize(width, height)
	}, [renderer, width, height, gameInstance])

	useEffect(() => {
		const resizeCallback = () => {
			const w = window.innerWidth | 0
			const h = window.innerHeight | 0
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
		window.addEventListener('focus', focusCallback, {passive: true})
		window.addEventListener('blur', blurCallback, {passive: true})
		return () => {
			window.removeEventListener('focus', focusCallback)
			window.removeEventListener('blur', blurCallback)
		}
	}, [renderer])

	const canvasRefCallback = useCallback((canvas: HTMLCanvasElement) => {
		renderer.setCanvas(canvas)
	}, [renderer])

	const onClicked = useCallback((ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		gameInstance.dispatchNextTick((world) => {
			// {
			// 	const entity = world.spawnEntity(ArcherEntity)
			// 	entity.scaleX = 1
			// 	entity.occupiedTiles.push({x: 0, y: 0})
			// }
			{
				const entity = world.spawnEntity(ArcherEntity)
				entity.destinationDrawX = -18
				entity.destinationDrawY = -18
				entity.occupiedTiles.push({x: 0, y: 0})
			}
			// const entity = world.spawnEntity(SimpleCircle)
			// entity.x = ev.clientX
			// entity.y = ev.clientY
		})
	}, [gameInstance])

	return (
		<div className="App">
			<canvas ref={canvasRefCallback}
			        onClick={onClicked}
			        width={width}
			        height={height}
			        style={{width: `${width}px`, height: `${height}px`}}/>
		</div>
	)
}

export default App

import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import { TilesIncumbent, WalkableComponent } from './ecs/components'
import { ArcherEntity } from './ecs/entity-types'
import { GameInstance } from './game/game-instance'
import GameSettings from './game/game-settings'
import { findPathDirections } from './game/path-finder'
import { DebugOptions, Renderer } from './game/renderer'

const settings: GameSettings = {
	mapWidth: 40,
	mapHeight: 20,
}

const debugOptions: DebugOptions = {
	showTilesOccupation: true,
	showPaths: true,
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
		const keyPressCallback = (ev: KeyboardEvent) => {
			switch (ev.code) {
				case 'Digit1':
					debugOptions.showTilesOccupation = !debugOptions.showTilesOccupation
					break
				case 'Digit2':
					debugOptions.showPaths = !debugOptions.showPaths
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
		gameInstance.dispatchNextTick((world) => {
			// {
			// 	const entity = world.spawnEntity(ArcherEntity)
			// 	entity.scaleX = 1
			// 	entity.occupiedTiles.push({x: 0, y: 0})
			// }
			const spawnedEntity = world.getSpawnedEntity(5) as any as (WalkableComponent & TilesIncumbent)
			if (spawnedEntity == null) {
				const entity = world.spawnEntity(ArcherEntity)
				entity.destinationDrawX = -18
				entity.destinationDrawY = -18
				entity.occupiedTiles.push({x: 0, y: 0})
			} else {

				const dx = ev.clientX / 32 | 0
				const dy = ev.clientY / 32 | 0
				const {x: sx, y: sy} = spawnedEntity.occupiedTiles[0]
				const path = findPathDirections(sx, sy, dx, dy, gameInstance.walkableTester)
				if (path != null) {
					console.log(path, spawnedEntity.occupiedTiles[0], {dx, dy})
					spawnedEntity.pathDirections = path
				}
				// spawnedEntity.pathDirections = [
				// 	FacingDirection.South,
				// 	FacingDirection.SouthEast,
				// 	FacingDirection.NorthEast,
				// ]
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

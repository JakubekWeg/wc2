import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import { GameInstance } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { findPathDirections } from './game/misc/path-finder'
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
	showTileListenersCount: false
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
			// const x = world.getSpawnedEntity(1)
			// console.log(x)
			// const spawnedEntity = world.getSpawnedEntity(ev.button ? 2 : 1) as any as (WalkableComponent & TilesIncumbent)
			// if (spawnedEntity == null) {
			// 	console.log('entity not exists')
			// } else {
			//
			// 	const dx = ev.clientX / 2 / 32 | 0
			// 	const dy = ev.clientY / 2  / 32 | 0
			// 	const sx = spawnedEntity.occupiedTilesWest
			// 	const sy = spawnedEntity.occupiedTilesNorth
			// 	const path = findPathDirections(sx, sy, dx, dy, gameInstance.walkableTester)
			// 	if (path != null) {
			// 		spawnedEntity.pathDirections = path
			// 	}
			// 	// spawnedEntity.pathDirections = [
			// 	// 	FacingDirection.South,
			// 	// 	FacingDirection.SouthEast,
			// 	// 	FacingDirection.NorthEast,
			// 	// ]
			// }
			// const entity = world.spawnEntity(TrollAxeThrower)
			// entity.destinationDrawX = -18
			// entity.destinationDrawY = -18
			// entity.sourceDrawX = FacingDirection.South * 72
			// entity.spriteVelocityY = 0.02
			// entity.occupiedTiles.push({x: 0, y: 0})
			// const spawnedEntity = world.getSpawnedEntity(5) as any as (WalkableComponent & TilesIncumbent)
			// if (spawnedEntity == null) {
			// 	const entity = world.spawnEntity(TrollAxeThrower)
			// 	entity.occupiedTiles.push({x: 0, y: 0})
			// } else {
			//
			// 	const dx = ev.clientX / 32 | 0
			// 	const dy = ev.clientY / 32 | 0
			// 	const {x: sx, y: sy} = spawnedEntity.occupiedTiles[0]
			// 	const path = findPathDirections(sx, sy, dx, dy, gameInstance.walkableTester)
			// 	console.log(path, spawnedEntity.occupiedTiles[0], {dx, dy})
			// 	if (path != null) {
			// 		spawnedEntity.pathDirections = path
			// 	}
			// 	// spawnedEntity.pathDirections = [
			// 	// 	FacingDirection.South,
			// 	// 	FacingDirection.SouthEast,
			// 	// 	FacingDirection.NorthEast,
			// 	// ]
			// }
			// const entity = world.spawnEntity(SimpleCircle)
			// entity.x = ev.clientX
			// entity.y = ev.clientY
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

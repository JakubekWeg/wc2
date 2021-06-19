import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
	PlayerCommand,
	PlayerCommandTakerComponent,
	PredefinedDrawableComponent,
	TilesIncumbentComponent,
} from './game/ecs/components'
import { GameInstanceImpl } from './game/game-instance'
import GameSettings from './game/misc/game-settings'
import { DebugOptions, Renderer } from './game/renderer'


function Game({
	              settings,
	              debugOptions,
	              reloadRequested,
	              gameInstance,
              }: {
	settings: GameSettings,
	debugOptions: DebugOptions,
	gameInstance: GameInstanceImpl,
	reloadRequested: Function
}) {
	const [renderer] = useState(new Renderer(settings))
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
	}, [renderer, width, height, gameInstance, debugOptions])

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
				case 'Digit5':
					const json = gameInstance.generateSaveJson()
					console.log(json)
					localStorage.setItem('last-save', JSON.stringify(json))
					break
				case 'Digit6':
					reloadRequested()
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
	}, [renderer, debugOptions, gameInstance, reloadRequested])

	const canvasRefCallback = useCallback((canvas: HTMLCanvasElement) => {
		renderer.setCanvas(canvas)
	}, [renderer])

	const onClicked = useCallback((ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		ev.preventDefault()
		gameInstance.dispatchNextTick((world) => {
				const x = ev.clientX / 32 / 2 | 0
				const y = ev.clientY / 32 / 2 | 0
				switch (ev.button) {
					case 0: {
						// left button
						const archer = world.spawnEntity('archer') as unknown as (TilesIncumbentComponent & PredefinedDrawableComponent)
						archer.mostWestTile = x
						archer.mostNorthTile = y
						archer.destinationDrawX = x * 32 - 18
						archer.destinationDrawY = y * 32 - 18
						break
					}
					case 2: {
						//right click
						let entity = world.getSpawnedEntity(2) as unknown as PlayerCommandTakerComponent
						if (entity?.canAcceptCommands) {
							const command = {
								type: 'go',
								targetX: x,
								targetY: y,
							} as PlayerCommand
							entity.myCurrentState.get().handleCommand(command, gameInstance)
						}
						break
					}
					case 1: {
						//middle click
						let entity = world.getSpawnedEntity(1) as unknown as PlayerCommandTakerComponent
						if (entity?.canAcceptCommands) {
							const command = {
								type: 'go',
								targetX: x,
								targetY: y,
							} as PlayerCommand
							entity.myCurrentState.get().handleCommand(command, gameInstance)
						}
						break
					}
				}
			},
		)
	}, [gameInstance])

	return (
		<canvas ref={canvasRefCallback}
		        onClick={onClicked}
		        onContextMenu={onClicked}
		        onAuxClick={onClicked}
		        width={width}
		        height={height}
		        style={{width: `${width * 2}px`, height: `${height * 2}px`}}/>
	)
}

export default Game

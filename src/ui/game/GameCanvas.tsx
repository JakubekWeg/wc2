import React, { useEffect, useRef, useState } from 'react'
import { CameraDirection, CameraImpl } from '../../game/camera'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'

interface ComponentParams {
	game: GameInstanceImpl
	tileClicked: (x: number, y: number, which: number) => void
}

function Component(params: ComponentParams) {

	const ref = useRef<HTMLCanvasElement>(null)
	const [lastSize, setLastSize] = useState<[number, number]>([0, 0])

	useEffect(() => {
		if (ref.current == null)
			return
		const canvas: HTMLCanvasElement = ref.current
		const camera = CameraImpl.createNew(params.game.settings)
		const renderer = new Renderer(params.game.settings, camera)
		renderer.updateDebugOptions({
			showTilesOccupation: false,
			showPaths: false,
			showTileListenersCount: false,
			showChunkBoundaries: false,
			renderZoomedOut: false,
		})
		renderer.setGameInstance(params.game)
		renderer.setCanvas(canvas)

		const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
		if (thisSize[0] !== lastSize[0] || thisSize[1] !== lastSize[1]) {
			setLastSize(thisSize)
			renderer.setSize(thisSize[0], thisSize[1])
		}
		renderer.setPageFocused(document.hasFocus())

		const resizeCallback = () => {
			const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
			setLastSize(thisSize)
			renderer.setSize(thisSize[0], thisSize[1])
		}
		const keydownCallback = (ev: KeyboardEvent) => {
			let dir: CameraDirection | undefined = undefined
			console.log(ev.code)
			switch (ev.code) {
				case 'Digit5': {
					const obj = params.game.generateSaveJson()
					localStorage.setItem('last-save', JSON.stringify(obj))
					break
				}
				// case 'Digit6': {
				// 	const obj = JSON.parse(localStorage.getItem('last-save') || 'null')
				// 	if (obj) {
				// 		const config = Config.createConfigFromObject(obj)
				// 		console.log(config.getRawObject())
				// 	}
				// 	break
				// }
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
					camera.setZooming(true, true)
					break
				case 'Minus':
					camera.setZooming(false, true)
					break
			}
			if (dir !== undefined)
				camera.setMoving(dir, true)
		}
		const keyupCallback = (ev: any) => {
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
					camera.setZooming(true, false)
					break
				case 'Minus':
					camera.setZooming(false, false)
					break
			}
			if (dir !== undefined)
				camera.setMoving(dir, false)
		}

		const focusCallback = () => {
			const has = document.hasFocus()
			renderer.setPageFocused(has)
			camera.setMoving(CameraDirection.Left, false)
			camera.setMoving(CameraDirection.Right, false)
			camera.setMoving(CameraDirection.Up, false)
			camera.setMoving(CameraDirection.Down, false)
		}

		const mouseClick = (ev: MouseEvent) => {
			ev.preventDefault()

			const w = (ev.target as HTMLCanvasElement).width
			const h = (ev.target as HTMLCanvasElement).height
			const scale = camera.scale * (renderer.getDebugOptions().renderZoomedOut ? 0.3 : 1)
			// const scale = camera.scale
			const x = (ev.offsetX / scale + camera.centerX - w * 0.5 / scale) / 32 | 0
			const y = (ev.offsetY / scale + camera.centerY - h * 0.5 / scale) / 32 | 0
			params.tileClicked(x, y, ev.button)
		}

		window.addEventListener('focus', focusCallback, {passive: true})
		window.addEventListener('blur', focusCallback, {passive: true})
		window.addEventListener('resize', resizeCallback, {passive: true})
		window.addEventListener('keydown', keydownCallback, {passive: true})
		window.addEventListener('keyup', keyupCallback, {passive: true})
		window.addEventListener('click', mouseClick, {passive: false})
		window.addEventListener('contextmenu', mouseClick, {passive: false})

		return () => {
			renderer.setGameInstance(undefined)
			window.removeEventListener('focus', focusCallback)
			window.removeEventListener('blur', focusCallback)
			window.removeEventListener('resize', resizeCallback)
			window.removeEventListener('keydown', keydownCallback)
			window.removeEventListener('keyup', keyupCallback)
			window.removeEventListener('click', mouseClick)
			window.removeEventListener('contextmenu', mouseClick)
		}
	}, [params.game])


	return (
		<div className="GameCanvas">
			<canvas ref={ref}
			        onWheel={(e) => {
				        const canvas: HTMLCanvasElement | null = ref.current
				        if (canvas == null) return
				        const delta = Math.sign(e.deltaY)
				        // canvas.width += delta
				        // canvas.height += delta
			        }
			        }
			        style={{
				        width: '100%',
				        height: '100%',
			        }
			        }/>
		</div>
	)
}

export default Component

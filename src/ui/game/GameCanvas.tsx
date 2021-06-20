import React, { useEffect, useRef, useState } from 'react'
import { CameraDirection, CameraImpl } from '../../game/camera'
import { GameInstanceImpl } from '../../game/game-instance'
import { Renderer } from '../../game/renderer'

interface ComponentParams {
	game: GameInstanceImpl

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
			showChunkBoundaries: false,
			renderZoomedOut: false
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

		window.addEventListener('focus', focusCallback, {passive: true})
		window.addEventListener('blur', focusCallback, {passive: true})
		window.addEventListener('resize', resizeCallback, {passive: true})
		window.addEventListener('keydown', keydownCallback, {passive: true})
		window.addEventListener('keyup', keyupCallback, {passive: true})

		return () => {
			renderer.setGameInstance(undefined)
			window.removeEventListener('resize', resizeCallback)
			window.removeEventListener('keydown', keydownCallback)
			window.removeEventListener('keyup', keyupCallback)
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

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraDirection } from '../../game/camera'
import { Renderer } from '../../game/renderer'
import { GameComponents } from './GameLayout'

interface Props {
	game: GameComponents
	mouseDown?: (ev: CanvasMouseEvent) => void
	mouseMoved?: (ev: CanvasMouseEvent) => void
	mouseUp?: (ev: CanvasMouseEvent) => void
}

interface CanvasMouseEvent {
	x: number
	y: number
	tileX: number
	tileY: number
	button: number
}

const produceMouseEvent = (camera: Camera, renderer: Renderer, ev: MouseEvent): CanvasMouseEvent => {
	ev.preventDefault()

	const offsetX = ev.offsetX
	const offsetY = ev.offsetY
	const w = (ev.target as HTMLCanvasElement).width
	const h = (ev.target as HTMLCanvasElement).height
	const scale = camera.scale * (renderer.getDebugOptions().renderZoomedOut ? 0.3 : 1)
	// const scale = camera.scale
	const x = (offsetX / scale + camera.centerX - w * 0.5 / scale) / 32 | 0
	const y = (offsetY / scale + camera.centerY - h * 0.5 / scale) / 32 | 0

	return {
		x: offsetX,
		y: offsetY,
		tileX: x,
		tileY: y,
		button: ev.button,
	}
}

function Component(props: Props) {

	const ref = useRef<HTMLCanvasElement>(null)
	const [lastSize, setLastSize] = useState<[number, number]>([0, 0])

	useEffect(() => {
		if (ref.current == null)
			return
		const canvas: HTMLCanvasElement = ref.current
		const game = props.game
		game.renderer.updateDebugOptions({
			showTilesOccupation: false,
			showPaths: false,
			showTileListenersCount: false,
			showChunkBoundaries: false,
			renderZoomedOut: false,
		})
		game.renderer.setCanvas(canvas)

		const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
		if (thisSize[0] !== lastSize[0] || thisSize[1] !== lastSize[1]) {
			setLastSize(thisSize)
			game.renderer.setSize(thisSize[0], thisSize[1])
		}
		game.renderer.setPageFocused(document.hasFocus())

		const resizeCallback = () => {
			const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
			setLastSize(thisSize)
			game.renderer.setSize(thisSize[0], thisSize[1])
		}

		const focusCallback = () => {
			const has = document.hasFocus()
			game.renderer.setPageFocused(has)
			game.camera.setMoving(CameraDirection.Left, false)
			game.camera.setMoving(CameraDirection.Right, false)
			game.camera.setMoving(CameraDirection.Up, false)
			game.camera.setMoving(CameraDirection.Down, false)
		}


		window.addEventListener('focus', focusCallback, {passive: true})
		window.addEventListener('blur', focusCallback, {passive: true})
		window.addEventListener('resize', resizeCallback, {passive: true})

		return () => {
			game.renderer.setGameInstance(undefined)
			window.removeEventListener('focus', focusCallback)
			window.removeEventListener('blur', focusCallback)
			window.removeEventListener('resize', resizeCallback)
		}
	}, [props])

	const [lastClickTime, setLastClickTime] = useState(0)
	const onMouseEvent = useCallback((ev: React.MouseEvent<HTMLCanvasElement>) => {
		// const now = Date.now()
		// if (lastClickTime + 50 > now) return
		// setLastClickTime(now)

		switch (ev.type) {
			case 'mousedown':
				props.mouseDown?.(produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent))
				break
			case 'mouseup':
				props.mouseUp?.(produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent))
				break
			case 'mousemove':
				props.mouseMoved?.(produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent))
				break
			default:
				return
		}

		ev.preventDefault()
		console.log()

	}, [lastClickTime,props])

	return (
		<div className="GameCanvas">
			<canvas ref={ref}
					onMouseDown={onMouseEvent}
					onMouseUp={onMouseEvent}
					onMouseMove={onMouseEvent}
			        onContextMenu={e => e.preventDefault()}
			        style={{width: '100%', height: '100%'}}/>
		</div>
	)
}

export default Component

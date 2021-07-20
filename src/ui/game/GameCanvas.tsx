import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraDirection } from '../../game/camera'
import { getGlobalRendererDebugOptions } from '../../game/debug-renderer-options'
import { Renderer } from '../../game/renderer'
import { GameComponents } from './GameLayout'

interface Props {
	game: GameComponents
	mouseEvent?: (ev: CanvasMouseEvent) => void
}

export enum MouseActionType {
	Down,
	Move,
	Up,
	Leave,
}

export enum MouseButtonType {
	None,
	Left,
	Middle,
	Right
}

export interface CanvasMouseEvent {
	type: MouseActionType
	x: number
	y: number
	tileX: number
	tileY: number
	button: MouseButtonType
}

const produceMouseEvent = (camera: Camera, renderer: Renderer, ev: MouseEvent, type: MouseActionType): CanvasMouseEvent => {
	ev.preventDefault()

	const offsetX = ev.offsetX
	const offsetY = ev.offsetY
	const w = (ev.target as HTMLCanvasElement).width
	const h = (ev.target as HTMLCanvasElement).height
	const scale = camera.scale * (getGlobalRendererDebugOptions().renderZoomedOut ? 0.3 : 1)
	const x = (offsetX / scale + camera.centerX - w * 0.5 / scale) | 0
	const y = (offsetY / scale + camera.centerY - h * 0.5 / scale) | 0

	return {
		type,
		x: x,
		y: y,
		tileX: x / 32 | 0,
		tileY: y / 32 | 0,
		button: ev.button === undefined ? MouseButtonType.None : (ev.button + 1),
	}
}

function Component(props: Props) {

	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const game = props.game
		const canvas = ref.current
		if (!canvas) return
		const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
		game.renderer.setSize(thisSize[0], thisSize[1])
		return () => {
		}
	}, [props.game])

	useEffect(() => {
		if (ref.current == null)
			return
		const canvas: HTMLCanvasElement = ref.current
		const game = props.game
		game.renderer.setCanvas(canvas)

		game.renderer.setPageFocused(document.hasFocus())

		const resizeCallback = () => {
			const thisSize = [canvas.offsetWidth, canvas.offsetHeight] as [number, number]
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
		focusCallback()


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


	const [pressed, setPressed] = useState<MouseButtonType>(MouseButtonType.None)

	const onMouseEvent = useCallback((ev: React.MouseEvent<HTMLCanvasElement>) => {
		let event: CanvasMouseEvent | undefined = undefined

		const button: MouseButtonType = ev.button === undefined ? MouseButtonType.None : (ev.button + 1)
		switch (ev.type) {
			case 'mousedown':
				setPressed(ev.button + 1)
				event = produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent, MouseActionType.Down)
				break
			case 'mouseleave':
			case 'mouseup':
				if (pressed !== button)
					return
				setPressed(MouseButtonType.None)
				event = produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent, MouseActionType.Up)
				break
			case 'mousemove':
				event = produceMouseEvent(props.game.camera, props.game.renderer, ev.nativeEvent, MouseActionType.Move)
				event.button = pressed
				break
			default:
				return
		}

		ev.preventDefault()
		if (props.game.game.terrain
			.isValidTile(event.tileX, event.tileY))
			props.mouseEvent?.(event)
		else {
			event.type = MouseActionType.Leave
			props.mouseEvent?.(event)
		}

	}, [props, pressed])

	return (
		<div className="GameCanvas">
			<canvas ref={ref}
			        onMouseDown={onMouseEvent}
			        onMouseUp={onMouseEvent}
			        onMouseMove={onMouseEvent}
			        onMouseLeave={onMouseEvent}
			        onContextMenu={e => e.preventDefault()}
			        style={{width: '100%', height: '100%'}}/>
		</div>
	)
}

export default Component

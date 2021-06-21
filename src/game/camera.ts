import Config from '../config/config'
import GameSettings from './misc/game-settings'

export enum CameraDirection {
	Left,
	Right,
	Up,
	Down
}

export interface Camera {
	readonly centerX: number
	readonly centerY: number

	readonly scale: number

	setMoving(direction: CameraDirection, enabled: boolean): void

	setZooming(in_: boolean, enabled: boolean): void

	zoom(delta: number): void

	isPointWithinViewport(x: number, y: number): boolean

	serialize(): unknown

	clone(): Camera

	update(delta: number): void
}

export class CameraImpl implements Camera {
	centerX: number = 300
	centerY: number = 300
	scale: number = 2

	private movingLeft = 0
	private movingRight = 0
	private movingUp = 0
	private movingDown = 0
	private zoomingIn: number = 0
	private zoomingOut: number = 0

	private constructor(private readonly mapSizeX: number,
	                    private readonly mapSizeY: number) {
	}

	public static createNew(settings: GameSettings): Camera {
		return new CameraImpl(settings.mapWidth * 32, settings.mapHeight * 32)
	}

	public static deserialize(obj: Config): Camera {
		const tmp = new CameraImpl(
			obj.requirePositiveInt('mw'),
			obj.requirePositiveInt('mh'),
		)
		tmp.centerX = obj.requirePositiveInt('x')
		tmp.centerY = obj.requirePositiveInt('y')
		// tmp.cameraSizeX = obj.requirePositiveInt('w')
		// tmp.cameraSizeY = obj.requirePositiveInt('h')
		return tmp
	}

	clone(): Camera {
		return CameraImpl.deserialize(Config.createConfigFromObject(this.serialize()))
	}

	isPointWithinViewport(x: number, y: number): boolean {
		// return isInRectRange2(x, y, this.left, this.top, this.right, this.bottom)
		return true
	}

	setMoving(direction: CameraDirection, enabled: boolean): void {
		const val = enabled ? 1 : 0
		switch (direction) {
			case CameraDirection.Left:
				this.movingLeft = val
				break
			case CameraDirection.Right:
				this.movingRight = val
				break
			case CameraDirection.Up:
				this.movingUp = val
				break
			case CameraDirection.Down:
				this.movingDown = val
				break

		}
	}

	setZooming(in_: boolean, enabled: boolean): void {
		const val = enabled ? 1 : 0
		if (in_) this.zoomingIn = val
		else this.zoomingOut = val
	}

	serialize(): unknown {
		return {
			// w: this.cameraSizeX,
			// h: this.cameraSizeY,
			mw: this.mapSizeX,
			mh: this.mapSizeY,
			x: this.centerX,
			y: this.centerY,
		}
	}

	zoom(delta: number): void {
		// this.cameraSizeX += delta * 2
		// this.cameraSizeY += delta * 2
	}

	update(delta: number) {
		const VELOCITY = 0.6 * delta / this.scale

		this.centerX -= (this.movingLeft - this.movingRight) * VELOCITY
		this.centerY -= (this.movingUp - this.movingDown) * VELOCITY

		this.scale += (this.zoomingIn - this.zoomingOut) * 0.01 * delta
		if (this.scale < 0.2)
			this.scale = 0.2
		if (this.scale > 8)
			this.scale = 8
	}
}


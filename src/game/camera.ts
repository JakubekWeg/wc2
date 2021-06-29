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

	serialize(): unknown

	update(delta: number): void
}

export class CameraImpl implements Camera {
	centerX: number = 600
	centerY: number = 600
	scale: number = 1

	private movingLeft = 0
	private movingRight = 0
	private movingUp = 0
	private movingDown = 0
	private zoomingIn: number = 0
	private zoomingOut: number = 0

	private constructor() {
	}

	public static createNew(): Camera {
		return new CameraImpl()
	}

	public static deserialize(settings: GameSettings, obj: Config): Camera {
		const tmp = new CameraImpl(

		)
		tmp.centerX = obj.requirePositiveInt('x')
		tmp.centerY = obj.requirePositiveInt('y')
		return tmp
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
			x: this.centerX,
			y: this.centerY,
		}
	}

	update(delta: number) {
		const VELOCITY = 0.6 * delta / this.scale

		this.centerX -= (this.movingLeft - this.movingRight) * VELOCITY
		this.centerY -= (this.movingUp - this.movingDown) * VELOCITY

		this.scale *= (this.zoomingIn - this.zoomingOut) * delta * 0.003 + 1
		if (this.scale < 0.2)
			this.scale = 0.2
		if (this.scale > 8)
			this.scale = 8
	}
}


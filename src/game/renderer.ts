// import createLogger from './log'

// const log = createLogger('Renderer')

import { CanvasMouseEvent } from '../ui/game/GameCanvas'
import { Camera } from './camera'
import { DebugRendererOptions, getGlobalRendererDebugOptions } from './debug-renderer-options'
import { CHUNK_REAL_PX_SIZE, CHUNK_TILE_SIZE } from './ecs/chunk-indexer'
import { PredefinedDrawableComponent, TilesIncumbentComponent } from './ecs/components'
import { doNothingCallback } from './ecs/entities/common'
import { TileImpl } from './ecs/systems/tiles-system'
import { Entity } from './ecs/world'
import { GameInstance, GameInstanceImpl } from './game-instance'
import { FacingDirection, facingDirectionToVector } from './misc/facing-direction'
import GameSettings from './misc/game-settings'

export interface DebugPath {
	current: number
	entityFor: Entity & TilesIncumbentComponent,
	path: FacingDirection[]
}

export interface PointerPreview {
	onHover: (e: CanvasMouseEvent) => void
	render: (ctx: CanvasRenderingContext2D) => void
}

export class NullPreview implements PointerPreview {
	onHover = doNothingCallback
	render = doNothingCallback
}

interface PreviewRect {
	drawX: number
	drawY: number
	color: string
}

export class BuildingPreview implements PointerPreview {
	private static BUILD_AVAILABLE_OUTLINE_COLOR: string = '#00FF00'
	private static BUILD_NOT_AVAILABLE_OUTLINE_COLOR: string = '#AA0000'
	private static TILE_AVAILABLE_COLOR: string = BuildingPreview.BUILD_AVAILABLE_OUTLINE_COLOR + '44'
	private static TILE_NOT_AVAILABLE_COLOR: string = BuildingPreview.BUILD_NOT_AVAILABLE_OUTLINE_COLOR + '77'
	private static OUTLINE_WIDTH = 2
	private drawRects: PreviewRect[] = []
	private outlineColor: string = '#000000'

	constructor(private readonly buildingTemplate: Entity & PredefinedDrawableComponent & TilesIncumbentComponent,
	            private readonly game: GameInstance,
	            private tileX: number,
	            private tileY: number) {
	}

	onHover(e: CanvasMouseEvent) {
		const notChangedHoveredTile = this.tileX === e.tileX && this.tileY === e.tileY
		if (notChangedHoveredTile)
			return

		this.tileX = e.tileX
		this.tileY = e.tileY
		this.drawRects.length = 0
		const size = this.buildingTemplate.tileOccupySize
		let ok = true
		for (let x = this.tileX, r = this.tileX + size; x < r; x++) {
			for (let y = this.tileY, b = this.tileY + size; y < b; y++) {
				const canBePlaced = this.game.tiles.isTileBuildableNoThrow(x, y)
				if (!canBePlaced)
					ok = false
				this.drawRects.push({
					color: canBePlaced ? BuildingPreview.TILE_AVAILABLE_COLOR : BuildingPreview.TILE_NOT_AVAILABLE_COLOR,
					drawX: x * 32,
					drawY: y * 32,
				})
			}
		}
		this.outlineColor = ok ? BuildingPreview.BUILD_AVAILABLE_OUTLINE_COLOR : BuildingPreview.BUILD_NOT_AVAILABLE_OUTLINE_COLOR
	}

	render(ctx: CanvasRenderingContext2D) {
		const {texture, spriteSize} = this.buildingTemplate
		const destinationX = this.tileX * 32
		const destinationY = this.tileY * 32

		for (let rect of this.drawRects) {
			ctx.fillStyle = rect.color
			ctx.fillRect(rect.drawX, rect.drawY, 32, 32)
		}

		ctx.globalAlpha = (Math.sin(Date.now() * 0.004) + 1) * 0.15 + 0.5
		ctx.drawImage(texture,
			0, 0,
			spriteSize, spriteSize,
			destinationX, destinationY,
			spriteSize, spriteSize)
		ctx.globalAlpha = 1

		ctx.strokeStyle = this.outlineColor
		const size = BuildingPreview.OUTLINE_WIDTH
		ctx.lineWidth = size * 2
		ctx.strokeRect(destinationX - size, destinationY - size, spriteSize + size + size, spriteSize + size + size)
	}
}

export class Renderer {
	public static DEBUG_PATHS: Set<DebugPath> = new Set()
	public currentlyShowingHoverPreview: PointerPreview = new NullPreview()
	private debugOptions: DebugRendererOptions = getGlobalRendererDebugOptions()
	private enabled: boolean = false
	private game?: GameInstanceImpl
	private canvas?: HTMLCanvasElement
	private context?: CanvasRenderingContext2D
	private width: number = 0
	private height: number = 0
	private lastFrameTime: number = Date.now()
	private nextFrameBind = this.nextFrame.bind(this)
	private animationHandle: number = -1
	private hasFocus: boolean = true

	constructor(private readonly settings: GameSettings,
	            private readonly camera: Camera) {
	}

	private static drawTileListenersCount(game: GameInstanceImpl, context: CanvasRenderingContext2D) {

		const {mapSize} = game.settings
		for (let i = 0; i < mapSize; i++) {
			for (let j = 0; j < mapSize; j++) {
				const tile = game.tiles.get(i, j) as TileImpl
				const count = tile.getListenersCount()
				if (count > 0) {
					context.fillStyle = '#0000FF44'
					context?.fillRect(i * 32, j * 32, 32, 32)
				}
				context.fillStyle = 'black'
				context.fillText(`${count}`,
					i * 32 + 12,
					j * 32 + 20)
			}
		}

	}

	private static drawChunkBoundaries(context: CanvasRenderingContext2D, game: GameInstanceImpl) {

		context.lineWidth = 2
		const {mapSize} = game.settings
		const chunks = Math.ceil(mapSize / CHUNK_TILE_SIZE)
		const margin = 4
		context.font = '12px Roboto'
		context.fillStyle = 'black'
		for (let i = 0; i < chunks; i++) {
			for (let j = 0; j < chunks; j++) {
				const count = game
					.chunkEntityIndex
					.getChunkByChunkCoords(i, j)
					?.getEntitiesCount()

				context.fillText(`${count}`,
					i * CHUNK_REAL_PX_SIZE + 2 * margin,
					j * CHUNK_REAL_PX_SIZE + 4 * margin)

				context.strokeRect(
					i * CHUNK_REAL_PX_SIZE + margin,
					j * CHUNK_REAL_PX_SIZE + margin,
					CHUNK_REAL_PX_SIZE - margin * 2,
					CHUNK_REAL_PX_SIZE - margin * 2)
			}
		}

	}

	private static drawTilesOccupations(game: GameInstanceImpl, context: CanvasRenderingContext2D) {
		const tileSizeInPixels = 32
		const s = game.settings.mapSize
		for (let i = 0; i < s; i++) {
			for (let j = 0; j < s; j++) {
				const walkable = game.tiles.isTileWalkableNoThrow(i, j)
				const buildable = game.tiles.isTileBuildableNoThrow(i, j)
				context.fillStyle = walkable ? (buildable ? '#00FF0077' : '#88005577') : '#FF000077'
				context.fillRect(
					(i + 0.3) * tileSizeInPixels,
					(j + 0.3) * tileSizeInPixels,
					tileSizeInPixels * 0.4,
					tileSizeInPixels * 0.4)
			}
		}
	}

	private static drawEntitiesPaths(context: CanvasRenderingContext2D) {
		context.strokeStyle = '#000000'
		for (const path of Renderer.DEBUG_PATHS) {

			context.beginPath()
			context.lineWidth = 2
			let lastX = path.entityFor.mostWestTile * 32 + 16
			let lastY = path.entityFor.mostNorthTile * 32 + 16
			context.moveTo(lastX, lastY)
			for (let i = path.current, s = path.path.length; i < s; i++) {
				const dir = path.path[i]
				const [ox, oy] = facingDirectionToVector(dir)
				lastX += ox * 32
				lastY += oy * 32
				context.lineTo(lastX, lastY)
			}
			context.stroke()
			context.closePath()
		}
	}

	public setCanvas(canvas?: HTMLCanvasElement) {
		this.canvas = canvas
		this.reinitialize()
	}

	public setGameInstance(game?: GameInstanceImpl) {
		this.game = game
		Renderer.DEBUG_PATHS.clear()
	}

	public toggleDebugOptions(key: keyof DebugRendererOptions) {
		const value: unknown = this.debugOptions[key]
		if (value === true)
			this.debugOptions[key] = false
		else if (value === false)
			this.debugOptions[key] = true
		else
			throw new Error(`Unable to toggle debug option ${key}, because it is not a boolean`)
	}

	public setSize(width: number,
	               height: number) {
		this.width = width
		this.height = height
		this.reinitialize()
	}

	setPageFocused(focus: boolean) {
		this.hasFocus = focus
	}

	private nextFrame(time: number) {
		if (!this.enabled) return
		requestAnimationFrame(this.nextFrameBind)
		try {
			const delta = time - this.lastFrameTime
			// if (delta < 100) return
			this.lastFrameTime = time

			if (!this.hasFocus) {
				this.renderNotFocused()
				return
			}
			const context = this.context
			if (context != null) {
				const game = this.game
				if (game == null) {
					context.fillStyle = '#880000'
					context.fillRect(0, 0, this.width, this.height)
				} else {
					context.fillStyle = '#2a1a00'
					context.fillRect(0, 0, this.width, this.height)

					const camera = this.camera
					camera.update(delta)
					const scale = camera.scale
					const viewPortWidth = this.width / scale
					const viewPortHeight = this.height / scale
					if (this.debugOptions.renderZoomedOut) {
						const newScale = scale * 0.3
						context.scale(newScale, newScale)
						context.translate(-camera.centerX + this.width / newScale * 0.5, -camera.centerY + this.height / newScale * 0.5)
					} else {
						context.scale(scale, scale)
						context.translate(-camera.centerX + viewPortWidth * 0.5, -camera.centerY + viewPortHeight * 0.5)
					}

					const now = Date.now()
					for (let e of game.delayedHideEntities()) {
						if (e.hideMeAtMillis <= now)
							e.render = doNothingCallback
					}

					for (const e of game.movingEntities()) {
						e.destinationDrawX += e.spriteVelocityX * delta
						e.destinationDrawY += e.spriteVelocityY * delta
					}


					const viewPortLeft = camera.centerX - viewPortWidth * 0.5
					const viewPortTop = camera.centerY - viewPortHeight * 0.5

					game.terrain.render(context, viewPortLeft, viewPortTop, viewPortWidth, viewPortHeight)

					for (const e of game.chunkEntityIndex
						.getEntitiesWithinCoarse(viewPortLeft, viewPortTop, viewPortWidth, viewPortHeight)) {
						e.render(context)
					}

					this.currentlyShowingHoverPreview.render(context)

					this.drawDebugOptions(game, context, scale, viewPortLeft, viewPortTop, viewPortWidth, viewPortHeight)

					context.resetTransform()
				}
			}
		} catch (e) {
			console.error(e)
			this.enabled = false
		}
	}

	private renderNotFocused() {
		const context = this.context
		if (context != null) {
			context.fillStyle = '#222'
			context.fillRect(0, 0, this.width, this.height)
		}
	}

	private drawDebugOptions(game: GameInstanceImpl, context: CanvasRenderingContext2D,
	                         scale: number, viewPortLeft: number, viewPortTop: number,
	                         viewPortWidth: number, viewPortHeight: number) {
		if (this.debugOptions.showTilesOccupation)
			Renderer.drawTilesOccupations(game, context)

		if (this.debugOptions.showPaths)
			Renderer.drawEntitiesPaths(context)

		if (this.debugOptions.showChunkBoundaries)
			Renderer.drawChunkBoundaries(context, game)

		if (this.debugOptions.showTileListenersCount)
			Renderer.drawTileListenersCount(game, context)

		if (this.debugOptions.renderZoomedOut) {
			const SIZE = 12 / scale
			context.strokeStyle = '#FF00FF'
			context.lineWidth = SIZE
			context.strokeRect(viewPortLeft - SIZE | 0, viewPortTop - SIZE | 0, viewPortWidth + SIZE * 2 | 0, viewPortHeight + SIZE * 2 | 0)
		}
	}

	private reinitialize() {
		const wasEnabled = this.enabled
		this.enabled = !!this.canvas && this.width > 0 && this.height > 0
		this.context = this.canvas?.getContext('2d', {
			alpha: false,
		}) ?? undefined

		if (this.context) {
			if (this.canvas != null) {
				this.canvas.width = this.width
				this.canvas.height = this.height
			}
			this.context.imageSmoothingEnabled = false
			this.context.fillStyle = 'black'
			this.context.fillRect(0, 0, this.width, this.height)
		}

		if (this.enabled && !wasEnabled) {
			cancelAnimationFrame(this.animationHandle)

			this.animationHandle = requestAnimationFrame(this.nextFrameBind)
		}
	}
}

import { CanvasMouseEvent } from '../../ui/game/GameCanvas'
import {
	DamageableComponent,
	MovingUnitComponent,
	PredefinedDrawableComponent,
	TilesIncumbentComponent,
} from '../ecs/components'
import { Entity } from '../ecs/world'
import { Force, neutralForce } from '../forces-manager'
import { GameInstance } from '../game-instance'
import { EntityColor } from '../misc/colors-palette'
import { PointerPreview } from './previews'

interface PreviewRect {
	drawX: number
	drawY: number
	color: string
}

export class SpawnEntityPreview implements PointerPreview {
	private static BUILD_AVAILABLE_OUTLINE_COLOR: string = '#00FF00'
	private static BUILD_NOT_AVAILABLE_OUTLINE_COLOR: string = '#AA0000'
	private static TILE_AVAILABLE_COLOR: string = SpawnEntityPreview.BUILD_AVAILABLE_OUTLINE_COLOR + '33'
	private static TILE_NOT_AVAILABLE_COLOR: string = SpawnEntityPreview.BUILD_NOT_AVAILABLE_OUTLINE_COLOR + '99'
	private static OUTLINE_WIDTH = 1
	public spawnWithColor: EntityColor = EntityColor.Red
	public spawnWithForce: Force = neutralForce
	private drawRects: PreviewRect[] = []
	private drawDestinationX: number = 0
	private drawDestinationY: number = 0
	private outlineColor: string = '#000000'
	private shouldUpdateTileColors: boolean = true
	private tileX: number = 0
	private tileY: number = 0
	private buildingTemplate: Entity & PredefinedDrawableComponent & TilesIncumbentComponent & MovingUnitComponent & DamageableComponent = undefined as any

	constructor(private templateName: string,
	            private readonly game: GameInstance) {
		this.setEntityType(templateName)
	}

	public setEntityType(name: string) {
		this.templateName = name
		this.buildingTemplate = this.game.world.getEntityTemplate(name) as Entity & PredefinedDrawableComponent & TilesIncumbentComponent & MovingUnitComponent & DamageableComponent
	}

	render(ctx: CanvasRenderingContext2D) {
		if (this.shouldUpdateTileColors)
			this.updateTilesAvailability()

		const {texture, paintedTexturesSet, spriteSize, tileOccupySize} = this.buildingTemplate
		const destinationX = this.drawDestinationX
		const destinationY = this.drawDestinationY

		for (let rect of this.drawRects) {
			ctx.fillStyle = rect.color
			ctx.fillRect(rect.drawX, rect.drawY, 32, 32)
		}

		ctx.globalAlpha = (Math.sin(Date.now() * 0.004) + 1) * 0.15 + 0.6
		ctx.drawImage(paintedTexturesSet === undefined ? texture : paintedTexturesSet[this.spawnWithColor],
			0, 0,
			spriteSize, spriteSize,
			destinationX, destinationY,
			spriteSize, spriteSize)
		ctx.globalAlpha = 1

		ctx.strokeStyle = this.outlineColor
		const size = SpawnEntityPreview.OUTLINE_WIDTH
		ctx.lineWidth = size * 2
		const rectSize = tileOccupySize * 32
		ctx.strokeRect(this.tileX * 32 - size, this.tileY * 32 - size, rectSize + size + size, rectSize + size + size)
	}


	handleMouse(e: CanvasMouseEvent) {
		this.tileX = e.tileX
		this.tileY = e.tileY
		this.shouldUpdateTileColors = true
		if (e.button !== undefined) {
			this.game.dispatchNextTick(world => {
				const template = this.buildingTemplate
				const entityIsBuilding = template.unitMovingSpeed === undefined
				if (entityIsBuilding) {
					if (!this.game.tiles.areTilesBuildableNoThrow(e.tileX, e.tileY, template.tileOccupySize))
						return
				} else {
					if (!this.game.tiles.isTileWalkableNoThrow(e.tileX, e.tileY))
						return
				}

				const entity = world.spawnEntity(this.templateName) as Entity & TilesIncumbentComponent & PredefinedDrawableComponent & DamageableComponent
				entity.mostWestTile = e.tileX
				entity.mostNorthTile = e.tileY
				if (entityIsBuilding) {
					entity.destinationDrawX = e.tileX * 32
					entity.destinationDrawY = e.tileY * 32
				} else {
					entity.destinationDrawX = e.tileX * 32 - (entity.spriteSize - 32) / 2
					entity.destinationDrawY = e.tileY * 32 - (entity.spriteSize - 32) / 2
				}
				if (template.myForce !== undefined)
					entity.myForce = this.spawnWithForce ?? neutralForce
				if (template.myColor !== undefined) {
					entity.myColor = this.spawnWithColor ?? EntityColor.Red
					entity.texture = entity.paintedTexturesSet[entity.myColor]
				}
				world.commitAddedEntities()
			})
		}
	}

	private updateTilesAvailability() {
		this.shouldUpdateTileColors = false
		this.game.dispatchNextTick(() => this.shouldUpdateTileColors = true)

		this.drawRects.length = 0

		const {tileOccupySize, unitMovingSpeed} = this.buildingTemplate
		const isBuilding = unitMovingSpeed === undefined
		const canBeBuilt = isBuilding ? this.refreshTilesForBuilding(tileOccupySize) : this.refreshTilesForUnit()

		this.outlineColor = canBeBuilt ? SpawnEntityPreview.BUILD_AVAILABLE_OUTLINE_COLOR : SpawnEntityPreview.BUILD_NOT_AVAILABLE_OUTLINE_COLOR

		const offset = tileOccupySize > 1 ? 0 : (32 - this.buildingTemplate.spriteSize) / 2
		this.drawDestinationX = this.tileX * 32 + offset
		this.drawDestinationY = this.tileY * 32 + offset
	}

	private refreshTilesForUnit() {
		const ok = this.game.tiles.isTileWalkableNoThrow(this.tileX, this.tileY)
		this.drawRects.push({
			color: ok ? SpawnEntityPreview.TILE_AVAILABLE_COLOR : SpawnEntityPreview.TILE_NOT_AVAILABLE_COLOR,
			drawX: this.tileX * 32,
			drawY: this.tileY * 32,
		})
		return ok
	}

	private refreshTilesForBuilding(size: number) {
		let ok = true
		for (let x = this.tileX, r = this.tileX + size; x < r; x++) {
			for (let y = this.tileY, b = this.tileY + size; y < b; y++) {
				const canBePlaced = this.game.tiles.isTileBuildableNoThrow(x, y)
				if (!canBePlaced)
					ok = false
				this.drawRects.push({
					color: canBePlaced ? SpawnEntityPreview.TILE_AVAILABLE_COLOR : SpawnEntityPreview.TILE_NOT_AVAILABLE_COLOR,
					drawX: x * 32,
					drawY: y * 32,
				})
			}
		}
		return ok
	}
}

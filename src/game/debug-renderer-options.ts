export interface DebugRendererOptions {
	showTilesOccupation: boolean
	showPaths: boolean
	showChunkBoundaries: boolean
	showTileListenersCount: boolean
	renderZoomedOut: boolean
}

let options: DebugRendererOptions | undefined = undefined
const createDefaultOptions = (): DebugRendererOptions => ({
	showTilesOccupation: false,
	showPaths: false,
	showChunkBoundaries: false,
	showTileListenersCount: false,
	renderZoomedOut: false,
})

const readOptionsFromStorage = (): DebugRendererOptions | undefined => {
	const str = localStorage.getItem('debug.renderer-options')
	if (str === null) return undefined
	return JSON.parse(str)
}

export const getGlobalRendererDebugOptions = (): DebugRendererOptions => {
	if (options === undefined) {
		options = readOptionsFromStorage() ?? createDefaultOptions()
	}
	return options
}

window.addEventListener('beforeunload', () => {
	localStorage.setItem('debug.renderer-options', JSON.stringify(getGlobalRendererDebugOptions()))
})

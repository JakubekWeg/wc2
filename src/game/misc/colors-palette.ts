export type ColorsPalette = [number, number, number, number, number, number, number, number, number, number, number, number]
const createColorPalette = (fromColors: [string, string, string, string,]): ColorsPalette => {
	const parseColorPart = (str: string) => {
		return parseInt(str, 16) / 255
	}

	const array: ColorsPalette = new Array(12) as ColorsPalette
	for (let i = 0; i < 4; i++) {
		const stringColor = fromColors[i]
		if (stringColor.length !== 6)
			throw new Error(`String color should be 4 characters long, is ` + stringColor)
		array[i * 3] = parseColorPart(stringColor.substr(0, 2))
		array[i * 3 + 1] = parseColorPart(stringColor.substr(2, 2))
		array[i * 3 + 2] = parseColorPart(stringColor.substr(4, 2))
	}
	return array
}

export enum EntityColor {
	Red = 0,
	Blue = 1,
	Green = 2,
	Purple = 3,
	Orange = 4,
	Black = 5,
	White = 6,
	Yellow = 7,
}

export const allColorNames = Object.values(EntityColor).slice(0, 8) as string[]

const entityColorPalettes = [
	'440400;5c0400;7c0000;a40000',
	'00044c;00146c;002494;003cc0',
	'00280c;04542c;14845c;2cb494',
	'2c082c;50104c;743084;9848b0',
	'6c200c;983810;c45810;f08414',
	'0c0c14;141420;1c1c2c;28283c',
	'24284c;545480;9898b4;e0e0e0',
	'b47400;cca010;e4cc28;fcfc48',
].map(x => createColorPalette(x.split(';') as any))

export const getColorPalette = (index: EntityColor): ColorsPalette => {
	const palette = entityColorPalettes[index]
	if (palette === undefined) throw new Error(`Color palette with index ${index} doesn't exist!`)
	return palette
}

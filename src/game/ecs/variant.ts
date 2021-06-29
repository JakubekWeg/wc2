export enum Variant {
	Grass = 0,
	DarkGrass = 1,
	Dirt = 2,
	DarkDirt = 3,
	Water = 4,
	DarkWater = 5,
}


type RandomIndexProducer = () => number
const makeRandomProducer = (start: number): (count: number) => RandomIndexProducer => {
	let current = start
	return (count: number) => {
		let myCurrent = current
		current += count
		// return () => myCurrent + Math.random() * count | 0
		return () => myCurrent
	}
}

export const textureIndexes = new Map<number, RandomIndexProducer>()

const initTextureIndexes = () => {
	textureIndexes.clear()

	textureIndexes.set(0, makeRandomProducer(356)(2))
	// light dirt
	{
		textureIndexes.set(2222, makeRandomProducer(334)(2))

		const tmp = makeRandomProducer(270)
		textureIndexes.set(2000, tmp(2))
		textureIndexes.set(200, tmp(2))
		textureIndexes.set(2200, tmp(3))
		textureIndexes.set(2, tmp(2))

		textureIndexes.set(2002, tmp(3))
		textureIndexes.set(202, tmp(2))
		textureIndexes.set(2202, tmp(1))
		textureIndexes.set(20, tmp(2))

		textureIndexes.set(2020, tmp(2))
		textureIndexes.set(220, tmp(3))
		textureIndexes.set(2220, tmp(1))
		textureIndexes.set(22, tmp(3))

		textureIndexes.set(2022, tmp(2))
		textureIndexes.set(222, tmp(2))
	}
	// dark grass
	{
		textureIndexes.set(1111, makeRandomProducer(364)(2))

		const tmp = makeRandomProducer(238)
		textureIndexes.set(1000, tmp(2))
		textureIndexes.set(100, tmp(2))
		textureIndexes.set(1100, tmp(3))
		textureIndexes.set(1, tmp(2))

		textureIndexes.set(1001, tmp(3))
		textureIndexes.set(101, tmp(2))
		textureIndexes.set(1101, tmp(2))
		textureIndexes.set(10, tmp(2))

		textureIndexes.set(1010, tmp(2))
		textureIndexes.set(110, tmp(3))
		textureIndexes.set(1110, tmp(2))
		textureIndexes.set(11, tmp(3))

		textureIndexes.set(1011, tmp(2))
		textureIndexes.set(111, tmp(2))
	}
	// dark dirt
	{
		textureIndexes.set(3333, makeRandomProducer(345)(3))

		const tmp = makeRandomProducer(180)
		textureIndexes.set(3222, tmp(1))
		textureIndexes.set(2322, tmp(2))
		textureIndexes.set(3322, tmp(3))
		textureIndexes.set(2223, tmp(1))
		tmp(1) // ignore this empty

		textureIndexes.set(3223, tmp(3))
		textureIndexes.set(2323, tmp(2))
		textureIndexes.set(3323, tmp(1))
		textureIndexes.set(2232, tmp(1))

		textureIndexes.set(3232, tmp(2))
		textureIndexes.set(2332, tmp(3))
		textureIndexes.set(3332, tmp(1))
		textureIndexes.set(2233, tmp(3))

		textureIndexes.set(3233, tmp(1))
		textureIndexes.set(2333, tmp(1))
	}
	// light water
	{
		textureIndexes.set(4444, makeRandomProducer(328)(3))

		const tmp = makeRandomProducer(206)
		textureIndexes.set(4222, tmp(2))
		textureIndexes.set(2422, tmp(2))
		textureIndexes.set(4422, tmp(3))
		textureIndexes.set(2224, tmp(2))

		textureIndexes.set(4224, tmp(3))
		textureIndexes.set(2424, tmp(1))
		textureIndexes.set(4424, tmp(2))
		textureIndexes.set(2242, tmp(2))

		textureIndexes.set(4242, tmp(1))
		textureIndexes.set(2442, tmp(3))
		textureIndexes.set(4442, tmp(2))
		textureIndexes.set(2244, tmp(3))

		textureIndexes.set(4244, tmp(2))
		textureIndexes.set(2444, tmp(2))
	}
	// dark water
	{
		textureIndexes.set(5555, makeRandomProducer(331)(3))

		const tmp = makeRandomProducer(300)
		textureIndexes.set(5444, tmp(2))
		textureIndexes.set(4544, tmp(2))
		textureIndexes.set(5544, tmp(3))
		textureIndexes.set(4445, tmp(2))

		textureIndexes.set(5445, tmp(3))
		textureIndexes.set(4545, tmp(2))
		textureIndexes.set(5545, tmp(1))
		textureIndexes.set(4454, tmp(2))

		textureIndexes.set(5454, tmp(2))
		textureIndexes.set(4554, tmp(3))
		textureIndexes.set(5554, tmp(1))
		textureIndexes.set(4455, tmp(3))

		textureIndexes.set(5455, tmp(1))
		textureIndexes.set(4555, tmp(1))
	}
}
initTextureIndexes()

export const getFullTextureOfVariant = (v: Variant): RandomIndexProducer => {
	const textureProducer = textureIndexes.get(((v * 10 + v) * 10 + v) * 10 + v)
	if (textureProducer === undefined)
		throw new Error(`Unknown variant ${v}`)
	return textureProducer
} // noinspection SuspiciousTypeOfGuard


export const allVariants: Variant[] = Array
	.from(Object.values(Variant))
	.filter(it => typeof it === 'number') as Variant[]

const initBuildableTypes = (): Set<number> => {
	return new Set<number>([
		0,
		// dark grass,
		1111,

		1000,
		100,
		1100,
		1,

		1001,
		101,
		1101,
		10,

		1010,
		110,
		1110,
		11,

		1011,
		111,

	])
}
const buildableTypes = initBuildableTypes()
export const getIsBuildable = (lt: number, rt: number, lb: number, rb: number): boolean => {
	return buildableTypes.has(((lt * 10 + rt) * 10 + lb) * 10 + rb)
}


const initWalkableTypes = (): Set<number> => {
	return new Set<number>([
		0,
		// dark grass,
		1111,

		1000,
		100,
		1100,
		1,

		1001,
		101,
		1101,
		10,

		1010,
		110,
		1110,
		11,

		1011,
		111,
		2222,

		2000,
		200,
		2200,
		2,

		2002,
		202,
		2202,
		20,

		2020,
		220,
		2220,
		22,

		2022,
		222,
		3333,

		3222,
		2322,
		3322,
		2223,

		3223,
		2323,
		3323,
		2232,

		3232,
		2332,
		3332,
		2233,

		3233,
		2333,
	])
}

const walkableTypes = initWalkableTypes()
export const getIsWalkable = (lt: number, rt: number, lb: number, rb: number): boolean => {
	return walkableTypes.has(((lt * 10 + rt) * 10 + lb) * 10 + rb)
}

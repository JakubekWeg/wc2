import Config from '../../config/config'

class SeededRandom {
	private constructor(private seed: number) {
	}

	public static createWithRandomSeed(): SeededRandom {
		return new SeededRandom(Date.now() % 100_000_000 + Math.random())
	}

	public static fromSeed(seed: number): SeededRandom {
		return new SeededRandom(seed)
	}

	public static deserialize(config: Config): SeededRandom {
		const seed = config.requireNumber('seed')
		return SeededRandom.fromSeed(seed)
	}

	public serialize(): unknown {
		return {
			seed: this.seed,
		}
	}


	public next(): number {
		return ((this.seed = Math.imul(1597334677, this.seed)) >>> 0) / 2 ** 32
	}

	public intMax(max: number): number {
		return this.next() * max | 0
	}
}

export default SeededRandom

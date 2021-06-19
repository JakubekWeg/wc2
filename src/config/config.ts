class Config {
	private constructor(private readonly obj: any,
	                    private readonly globalRegistry: Map<string, Map<string, any>>) {
	}


	public static createConfigFromObject(obj: any): Config {
		return new Config(obj, new Map<string, Map<string, any>>())
	}


	public child(key: string): Config {
		return new Config(this.getValueRaw(key), this.globalRegistry)
	}

	public setRegistryValue(registryName: string, id: string, value: any): void {
		const reg = this.globalRegistry.get(registryName)
		if (reg == null) {
			const m = new Map<string, any>()
			m.set(id, value)
			this.globalRegistry.set(registryName, m)
		} else reg.set(id, value)
	}

	public getRawObject(): unknown {
		return this.obj
	}

	public requirePositiveInt = (key: string): number => {
		const value = this.getValueRaw(key)
		if (typeof value !== 'number' || value !== (value | 0) || value <= 0)
			throw new Error(`Expected positive integer in config file key=${key}, got value=${value}`)
		return value
	}

	public requireInt = (key: string): number => {
		const value = this.getValueRaw(key)
		if (typeof value !== 'number' || value !== (value | 0))
			throw new Error(`Expected integer in config file key=${key}, got value=${value}`)
		return value
	}
	public requireNumber = (key: string): number => {
		const value = this.getValueRaw(key)
		if (typeof value !== 'number')
			throw new Error(`Expected number in config file key=${key}, got value=${value}`)
		return value
	}

	public requireString = (key: string): string => {
		const value = this.getValueRaw(key)
		if (typeof value !== 'string')
			throw new Error(`Expected string in config file key=${key}, got value=${value}`)
		return value
	}

	public* objectEntries(): Generator<[string, Config]> {
		if (typeof this.obj !== 'object' || this.obj == null)
			throw new Error('This must be an object to use .objectEntries() method')

		for (const key of Object.keys(this.obj)) {
			yield [key, this.child(key)]
		}
	}

	public* listEntries(): Generator<Config> {
		if (typeof this.obj !== 'object' || this.obj == null || !Array.isArray(this.obj))
			throw new Error('This must be an array to use .listEntries() method')

		for (const value of this.obj) {
			yield new Config(value, this.globalRegistry)
		}
	}

	public getAsNotEmptyListOfNonNegativeIntegers(): number[] {
		const value = this.getAsListOfNonNegativeIntegers()
		if (value.length === 0)
			throw new Error(`Expected not empty list, but got empty :/`)
		return value
	}

	public getAsListOfNonNegativeIntegers(): number[] {
		const value: any[] = this.getRawObject() as any[]
		if (!Array.isArray(value))
			throw new Error(`Expected list in config, got value=${value}`)

		for (let number of value) {
			if (typeof number !== 'number')
				throw new Error(`Expected number, but got ${number}`)
			if (number < 0)
				throw new Error(`Expected non negative number, but got ${number}`)
			if (number !== (number | 0))
				throw new Error(`Expected integer number, but got ${number}`)
		}
		return value
	}


	private getValueRaw(key: string): unknown {
		let obj = this.obj
		for (let part of key.replace('.', '/').split('/')) {
			if (obj == null)
				return undefined
			obj = obj[part]
		}

		if (typeof obj === 'string' && obj.startsWith('@') && !obj.startsWith('@@')) {
			obj = obj.substr(1)
			const index = obj.indexOf('/')
			if (index < 0)
				throw new Error('Reference config must contain path separator')

			const registryName = obj.substr(0, index)
			const registry = this.globalRegistry.get(registryName)
			if (registry == null) {
				throw new Error('Unknown registry name ' + registryName)
			}
			return registry.get(obj.substr(index + 1))
		}
		return obj
	}
}

export default Config

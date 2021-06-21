type callback<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void

export interface ComposedFunction<T1 = void, T2 = void, T3 = void> extends Function {
	then(func: callback<T1, T2, T3>): ComposedFunction<T1, T2, T3>
}

export const composeFunction = <T1 = void, T2 = void, T3 = void>(startWith: callback<T1, T2, T3>): ComposedFunction<T1, T2, T3> => {
	const functions = [startWith]

	const tmp = (arg1: T1, arg2: T2, arg3: T3) => {
		for (let f of functions) {
			f(arg1, arg2, arg3)
		}
	}

	tmp.then = (func: callback<T1, T2, T3>) => {
		functions.push(func)
		return tmp
	}
	return tmp
}

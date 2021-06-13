// export class GameEventProcessor<EventType> {
// 	constructor() {
// 	}
//
// 	addEventListener<ID extends keyof EventType>(x: ID, callback: EventType[ID]){
//
// 	}
// }

/**
 * Prototype for event listeners, allows to publish and listen for events
 */
export interface EventPrototype<T> {
	/**
	 * Schedules event to be fired later
	 */
	publish(event: T): void

	listen(listener: (event: T) => void): void
}

/**
 * Container for schedules events
 */
export interface GameEventProcessor {
	registerNewEvent<T>(): EventPrototype<T>

	dispatchAll(): void
}

export const createEventProcessor = (): GameEventProcessor => new GameEventProcessorImpl()
export default createEventProcessor

class EventPrototypeImpl<T> implements EventPrototype<T> {
	private listeners: ((event: T) => void)[] = []

	constructor(private readonly owner: GameEventProcessorImpl) {
	}

	listen(listener: (event: T) => void) {
		this.listeners.push(listener)
	}

	publish(event: T) {
		this.owner.scheduledEvents.push(() => this.broadcast(event))
	}

	private broadcast(event: T) {
		for (const listener of this.listeners)
			listener(event)
	}
}

class GameEventProcessorImpl implements GameEventProcessor {
	public scheduledEvents: any[] = []

	registerNewEvent<T>(): EventPrototype<T> {
		return new EventPrototypeImpl(this)
	}

	dispatchAll() {
		const size = this.scheduledEvents.length
		let i = 0
		for (; i < size; i++)
			this.scheduledEvents[i]()
		for (; i < this.scheduledEvents.length; i++)
			this.scheduledEvents[i]()

		this.scheduledEvents.length = 0
	}
}

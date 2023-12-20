export type PredicateResult = boolean | "invalid";
export type Predicate<T> = (data: T) => PredicateResult;

export type EventHandlerResult = undefined | "remove";

type EventCallbackErased = (data: any) => EventHandlerResult;
type PredicateErased = (data: any) => PredicateResult;
type EventRegistration = {
	callback: EventCallbackErased;
	predicates: PredicateErased[];
}

const events = new Map<defines.events, EventRegistration[]>();

/**
 * Subscribes to one or multiple events and registers a callback function to be executed when the event is triggered.
 *
 * @param event - The event ID or an array of event IDs to subscribe to.
 * @param f - The callback function to be executed when the event is triggered. It receives the event data as a parameter.
 * @param predicate - If any predicate does not evaluate to true, the callback will not be executed.
 */
export function subscribeEvent<E extends EventId<any>>(
	event: E | E[],
	f: ((data: E["_eventData"]) => void),
	predicate?: Predicate<E["_eventData"]>[]
): void {
	if (Array.isArray(event)) {
		for (const e of event) {
			subscribeEvent(e, f);
		}

		return;
	}

	if (!events.has(event)) {
		events.set(event, []);
	}

	events.get(event)!.push({callback: f as EventCallbackErased, predicates: predicate as PredicateErased[] ?? []});
}

/**
 * Unsubscribes an event or multiple events from a callback function.
 * @param {EventId|EventId[]} event - The event(s) to unsubscribe from.
 * @param {function} f - The callback function to unsubscribe.
 */
export function unsubscribeEvent<E extends EventId<any>>(
	event: E | E[],
	f: ((data: E["_eventData"]) => void)
): void {
	if (Array.isArray(event)) {
		for (const e of event) {
			unsubscribeEvent(e, f);
		}

		return;
	}

	if (!events.has(event)) {
		return;
	}

	const list = events.get(event)!;

	const index = list.indexOf(f as any);
	if (index !== -1) {
		list.splice(index, 1);
	}
}

/**
 * Reloads the event handlers by iterating over the registered events and their associated callbacks.
 * Each callback is executed when the corresponding event is triggered, as long as all the predicates of the registration evaluate to true.
 * If a callback returns the string "remove", the registration is removed.
 * If any predicate returns the string "invalid", the registration is also removed.
 */
export function reloadEventHandlers() {
	// TODO: Handle this transparently
	for (const [event, callbacks] of events) {
		script.on_event(event as any, ev => {
			const registrationsToRemove: EventRegistration[] = [];

			for (const registration of callbacks) {
				const {callback, predicates} = registration;
				let valid = true;

				for (const predicate of predicates) {
					const result = predicate(ev);
					if (result === "invalid") {
						registrationsToRemove.push(registration);
					}

					if (result !== true) {
						valid = false;
						break;
					}
				}

				if (!valid) continue;

				const result = callback(ev);
				if (result === "remove") {
					registrationsToRemove.push(registration);
				}
			}

			for (const registration of registrationsToRemove) {
				const index = callbacks.indexOf(registration);
				if (index !== -1) {
					callbacks.splice(index, 1);
				}
			}
		});
	}
}

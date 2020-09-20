import {
	interpret,
	Machine,
	AnyEventObject,
	EventObject,
	Interpreter,
	MachineConfig,
	State,
	StateSchema,
} from 'xstate'

type H<Result> = (...args: any[]) => Result

type Render<Result> = (
	result: Result,
	container: Element | DocumentFragment
) => void

type Options<
	Result,
	TContext,
	TStateSchema extends StateSchema<any>,
	TEvent extends EventObject
> = {
	name: string
	machine: MachineConfig<TContext, TStateSchema, TEvent>
	render(
		h: H<Result>,
		state: State<TContext, TEvent, TStateSchema>,
		send: Interpreter<TContext, TStateSchema, TEvent>['send']
	): Result
	styles?: string
	created?: (
		service: Interpreter<TContext, TStateSchema, TEvent>,
		el: Element | DocumentFragment
	) => void
}

export function bind<Result>(h: H<Result>, render: Render<Result>) {
	// TODO: Figure out how to handle props/attributes
	return function defineComponent<
		TContext = any,
		TStateSchema extends StateSchema<any> = any,
		TEvent extends EventObject = AnyEventObject
	>({
		name,
		machine,
		render: renderTemplate,
		styles,
		created = () => {},
	}: Options<Result, TContext, TStateSchema, TEvent>) {
		const service = interpret(Machine(machine))

		customElements.define(
			name,
			class extends HTMLElement {
				constructor() {
					super()

					const shadow = this.attachShadow({ mode: 'open' })
					created(service, shadow)

					service.onTransition((state) => {
						if (state.changed !== false) {
							let template = renderTemplate(h, state, service.send)

							if (styles) {
								template = h`
									<style>${styles}</style>
									${template}
								`
							}

							render(template, shadow)
						}
					})
				}

				connectedCallback() {
					service.start()
				}

				disconnectedCallback() {
					service.stop()
				}
			}
		)
	}
}

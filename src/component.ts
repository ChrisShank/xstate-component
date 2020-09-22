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
import { inspect as inspector } from '@xstate/inspect'

// TODO: Could H not be a tagged template literal?
type H<Result> = (strings: TemplateStringsArray, ...values: any[]) => Result

type Render<Result> = (
	result: Result,
	container: Element | DocumentFragment
) => void

type Options<
	Prop extends string,
	Event extends string,
	Result,
	TContext,
	TStateSchema extends StateSchema<any>,
	TEvent extends EventObject
> = {
	name: string
	machine: (
		props: Record<Prop, any>,
		emit: (event: Event, ...args: any[]) => void
	) => MachineConfig<TContext, TStateSchema, TEvent>
	render(
		h: H<Result>,
		context: {
			props: Record<Prop, any>
			state: State<TContext, TEvent, TStateSchema>
			send: Interpreter<TContext, TStateSchema, TEvent>['send']
			emit: (event: Event, ...args: any[]) => void
		}
	): Result
	created?: (
		service: Interpreter<TContext, TStateSchema, TEvent>,
		el: Element | DocumentFragment
	) => void
	done?: (
		service: Interpreter<TContext, TStateSchema, TEvent>,
		el: Element | DocumentFragment
	) => void
	emits?: Event[]
	inspect?: boolean
	props?: Prop[]
	shadowRoot?: ShadowRootInit
	styles?: string
}

export function bind<Result>(h: H<Result>, render: Render<Result>) {
	// TODO: Figure out how to handle props/attributes
	return function defineComponent<
		Prop extends string = never,
		Event extends string = never,
		TContext = any,
		TStateSchema extends StateSchema<any> = any,
		TEvent extends EventObject = AnyEventObject
	>({
		created,
		done,
		emits = [],
		inspect = false,
		name,
		machine,
		props: propNames = [],
		render: renderTemplate,
		shadowRoot = { mode: 'open' },
		styles,
	}: Options<Prop, Event, Result, TContext, TStateSchema, TEvent>) {
		let isMounted = false
		const props = {} as Record<Prop, any>

		// TODO: let rollup only allow this during development
		if (inspect) {
			inspector({ iframe: false })
		}

		class XStateElement extends HTMLElement {
			static get observedAttributes() {
				return propNames
			}

			service: Interpreter<TContext, TStateSchema, TEvent>

			constructor() {
				super()

				this.attachShadow(shadowRoot)

				this.service = interpret(
					Machine(machine(props, this.emit.bind(this))),
					{ devTools: inspect }
				)

				if (created !== undefined) {
					created(this.service, this.shadowRoot!)
				}

				this.service
					.onTransition(this.render.bind(this))
					.onDone(this.done.bind(this))
			}

			emit(event: Event, ...args: any[]) {
				if (emits.includes(event)) {
					const e = new CustomEvent(event as string, {
						bubbles: false,
						cancelable: false,
						detail: args,
					})
					this.dispatchEvent(e)
				}
			}

			done() {
				if (done !== undefined) {
					done(this.service, this.shadowRoot!)
				}
			}

			render() {
				const state = this.service.state
				if (state && state.changed !== false) {
					let template = renderTemplate(h, {
						props,
						state,
						emit: this.emit.bind(this),
						send: this.service.send,
					})

					// TODO: Look into constructible stylesheets
					if (styles) {
						template = h`
						<style>${styles}</style>
						${template}
					`
					}

					render(template, this.shadowRoot!)
				}
			}

			connectedCallback() {
				isMounted = true
				this.service.start()
			}

			attributeChangedCallback(
				name: Prop,
				oldValue: string | null,
				newValue: string | null
			) {
				props[name] = newValue

				if (isMounted) {
					this.render()
				}
			}

			disconnectedCallback() {
				isMounted = false
				this.service.stop()
			}
		}

		// proxy props as Element properties
		for (const name of propNames) {
			Object.defineProperty(XStateElement.prototype, name, {
				get(this: XStateElement) {
					return props[name]
				},
				set(this: XStateElement, newValue) {
					props[name] = newValue
					this.render()
				},
				enumerable: false,
				configurable: true,
			})
		}

		customElements.define(name, XStateElement)
	}
}

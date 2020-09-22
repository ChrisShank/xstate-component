import { bind } from './component'
import { html, render } from 'lit-html'

const defineComponent = bind(html, render)

defineComponent({
	name: 'stop-light',
	inspect: true,
	props: ['initial'],
	emits: ['go', 'yield', 'stop'],
	machine: (props, emit) => ({
		initial: props.initial || 'green',
		states: {
			green: {
				after: {
					3000: 'yellow',
				},
			},
			yellow: {
				after: {
					3000: 'red',
				},
			},
			red: {
				after: {
					3000: 'green',
				},
			},
		},
	}),
	render: (h, { state, props, send, emit }) => h`
		<div class="light">
			<div class="bulb ${state.matches('red') ? 'red' : ''}"></div>
			<div class="bulb ${state.matches('yellow') ? 'yellow' : ''}"></div>
			<div class="bulb ${state.matches('green') ? 'green' : ''}"></div>
		</div>
	`,
	styles: `
		.light {
			border: 5px solid #000;
			height: 550px;
			width: 200px;
			float: left;
			background-color: #333;
			border-radius: 40px;
			margin: 30px 0;
			padding: 20px;
		}

		.bulb {
			border: 5px solid #000;
			height: 150px;
			width: 150px;
			background-color: #111;
			border-radius: 50%;
			margin: 25px auto;
			transition: background 500ms;
			box-shadow: 0 0 50px 5px rgba(0,0,0,0.8) inset;
		}

		.red {
			background: red;
		}

		.yellow {
			background: orange;
		}

		.green {
			background: green;
		}
	`,
})

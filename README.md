# @xstate/component (POC)

This is a small proof of concept project exploring what it's like to use XState as a primitive to manage a component's state and to compose logic throughout multiple components. Let's see how far Xstate can take us being its own reactivity system so we can reduce our applications size. This library tries to stay agnostic at the component level (i.e we are outputting a web component) and agnostic at the rendering level (i.e. currently you can bind any tagged template literal library such as `lit-html`, `uhtml`, ect.).

The challenge right now is trying to figure out how to integrate concepts like props, events, and lifecycle hooks into XState's model. For example, Im not sure if it makes sense to expose a `mounted` and `unMounted` hooks. The state machine should also have access to the initial props and be able to emit custom events.

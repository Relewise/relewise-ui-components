import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customsdfsdafsadfasdElement('my-element')
export class MyElement extends LitElement {
    render() {
        return html`
     <h1>Hello world!</h1> 
    `
    }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}

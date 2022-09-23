# Side Panel / Mobile Menu Thing [![npm][npm-image]][npm-url] [![File Size][size-image]][cdn-url]

[npm-image]: https://badgen.net/npm/v/side-panel-menu-thing
[npm-url]: https://www.npmjs.com/package/side-panel-menu-thing
[size-image]: https://badgen.net/badgesize/gzip/henrygd/side-panel-menu-thing/master/dist/side-panel-menu-thing.min.js
[cdn-url]: https://cdn.jsdelivr.net/npm/side-panel-menu-thing/dist/side-panel-menu-thing.min.js

![example](example.gif)

https://henrygd.me/side-panel-menu-thing

Touch responsive, easy to implement, fairly lightweight, and MIT licensed. Good option for mobile menus, general content reveals, or whatever else.

- **ES Module**: `dist/side-panel-menu-thing.mjs`
- **UMD**: `dist/side-panel-menu-thing.umd.js`
- **IIFE / CDN**: `dist/side-panel-menu-thing.min.js`
- **Svelte**: `src/side-panel-menu-thing.js`

## Install

```
$ npm install side-panel-menu-thing
```

Grab the few lines of CSS from [`dist/side-panel-menu-thing.css`](dist/side-panel-menu-thing.css) and add to your styles, or import from the package.

## Usage and options

```js
import sidePanel from 'side-panel-menu-thing'

// target and content required, others optional
const menu = sidePanel({
	// target container (where it's mounted and listens for touch)
	target: document.body,
	// element mounted in panel (will be removed if it exists in DOM)
	content: document.getElementById('content'),
	// width of panel
	width: 400,
	// open / close animation time
	duration: 450,
	// fixed to screen
	fixed: true,
	// open on left
	left: false,
	// whether to open on touch drag
	dragOpen: true,
	// prevent HTML scrolling when fixed
	preventScroll: true,
	// runs when the menu is opened (as soon as it's visible)
	onShow(container) {
		console.log('showing', container)
	},
	// runs when the menu is closed (as soon as it's hidden)
	onHide() {
		console.log('hidden')
	},
})

// options are accessible / changeable afterward
menu.width
// 400
menu.width = 500
// 500
```

## Methods

```js
// show the panel
menu.show()

// hide the panel
menu.hide()

// destroy
menu.$destroy()
```

## Disable drag opening on certain elements

If you have a fixed menu set to open on drag, but want disable on a specific element, add a `data-no-panel` attribute to the html.

```html
<div class="slider" data-no-panel>
	<div class="slide"></div>
	<div class="slide"></div>
</div>
```

## Usage with Svelte

This project uses Svelte internally, so you can save some bytes by importing the source files. This may happen automatically if your project picks up the svelte field in package.json, but to be sure you can use the import statement below.

```js
import sidePanel from 'side-panel-menu-thing/src/side-panel-menu-thing'
```

If you want a proper standalone component with a slot, let me know.

## License

MIT

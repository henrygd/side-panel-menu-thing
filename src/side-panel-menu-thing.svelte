<script>
	import { tweened } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
	import hideShowScroll from 'hide-show-scroll'

	export let target = null
	export let content = null
	export let width = 400
	export let duration = 450
	export let fixed = true
	export let left = false
	export let dragOpen = true
	export let onShow = null
	export let onHide = null

	content.parentElement.removeChild(content)

	// starting touch points
	let startX
	let startY

	// stores touch data on touchmove
	let touchEventData

	// container dom element
	let container

	// menu dom element
	let menu

	// dom element to restore focus to on close
	let focusTrigger

	// 100 is closed, 0 is open (this is the x transform in percent)
	const menuPos = tweened(100, {
		duration,
		easing: cubicOut,
	})

	// adjust overlay opacity automatically based on menu position
	$: overlayOpacity = (100 - $menuPos) / 100

	// whether the menu is open or in process of opening
	$: shown = $menuPos < 100

	// possible todo: allow duration passed through here w/ menuPos.set
	export const show = e => {
		$menuPos = 0
		// if event, store target as focusTrigger
		focusTrigger = e ? e.target : null
	}

	export const hide = () => {
		$menuPos = 100
	}

	// trap focus listener
	function trapFocus(e) {
		let isTabPressed = e.keyCode === 9
		if (!shown || !isTabPressed) {
			return
		}
		const containerNodes = container.querySelectorAll('*')
		const tabbable = Array.from(containerNodes).filter(n => n.tabIndex >= 0)
		if (tabbable.length) {
			e.preventDefault()
			let index = tabbable.indexOf(document.activeElement)
			index += tabbable.length + (e.shiftKey ? -1 : 1)
			index %= tabbable.length
			tabbable[index].focus()
		}
	}

	function isIgnoredElement(el) {
		while (el.parentNode) {
			if (el.hasAttribute('data-no-panel')) {
				return true
			}
			el = el.parentNode
		}
	}

	function onMount(node) {
		if (content) {
			node.appendChild(content)
		}
		target.addEventListener(
			'touchstart',
			e => {
				let isIgnored = isIgnoredElement(e.target)

				startX = e.changedTouches[0].pageX
				startY = e.changedTouches[0].pageY

				if (!shown && (isIgnored || !dragOpen)) {
					touchEventData = null
					return
				}

				let boundingClientRect = target.getBoundingClientRect()

				let touchEnabled = shown

				// allow drag open if touch is initiated within 30px of target edge
				if (
					(left && startX - boundingClientRect.left < 30) ||
					(!left && boundingClientRect.right - startX < 30)
				) {
					touchEnabled = true
				}

				touchEventData = touchEnabled
					? { start: $menuPos, time: Date.now() }
					: null
			},
			{ passive: true }
		)

		target.addEventListener(
			'touchmove',
			e => {
				if (!shown && !touchEventData) {
					return
				}
				let touchobj = e.changedTouches[0]
				let distX = touchobj.pageX - startX
				let distY = touchobj.pageY - startY

				if (touchEventData.go !== null) {
					touchEventData.go = Math.abs(distX) > Math.abs(distY) ? true : null
				}

				if (touchEventData.go) {
					const percentDragged = distX / menu.clientWidth
					const newMenuPos =
						touchEventData.start + percentDragged * (left ? -100 : 100)

					if (newMenuPos <= 100 && newMenuPos >= 0) {
						menuPos.set(newMenuPos, { duration: 0 })
					}
				}
			},
			{ passive: true }
		)

		target.addEventListener('touchend', e => {
			if (shown) {
				let { start, time } = touchEventData
				let swipeDuration = Date.now() - time
				let percentMoved = start - $menuPos
				// todo? set shorter open close duration bc we've alredy moved it a bit
				if (swipeDuration < 400 && Math.abs(percentMoved) > 5) {
					// quick swipe
					percentMoved > 0 ? show() : hide()
				} else {
					$menuPos > 70 ? hide() : show()
				}
			}
		})

		return {
			update: shown => {
				if (shown) {
					// stop background scrolling
					fixed && hideShowScroll.hide()
					// todo: something about this - focus is
					setTimeout(() => menu.focus(), 9)
					onShow && onShow()
				} else {
					// restore focus
					focusTrigger && focusTrigger.focus({ preventScroll: true })
					// allow background scrolling
					fixed && hideShowScroll.show()
					onHide && onHide()
				}
			},
		}
	}
</script>

<svelte:options accessors={true} immutable={true} />

<div
	class="spmt-wrap"
	class:novis={!shown}
	class:fixed
	bind:this={container}
	data-no-panel="true">
	<div class="spmt-overlay" on:click={hide} style="opacity: {overlayOpacity}" />
	<div
		class="spmt"
		class:left
		style="width: {width}px; transform: translateX({left ? $menuPos * -1 : $menuPos}%)"
		tabindex={shown ? '0' : false}
		bind:this={menu}
		use:onMount={shown}
		on:keydown={e => (e.keyCode === 27 ? hide() : trapFocus(e))} />
</div>

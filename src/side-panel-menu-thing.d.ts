export interface SidePanelOptions {
	/** target container (where it's mounted and listens for touch) */
	target: HTMLElement
	/** panel content (will be removed and added in the panel) */
	content?: HTMLElement
	/** width of panel */
	width?: number
	/** open / close animation time */
	duration?: number
	/** fixed to screen */
	fixed?: boolean
	/** open on left */
	left?: boolean
	/** whether to open on touch drag */
	dragOpen?: boolean
	/** prevent HTML scrolling when fixed */
	preventScroll?: boolean
	/** custom css class(es) added to wrap element (separate multiple with spaces) */
	wrapClass?: String
	/** runs when the menu is opened (as soon as it's visible) */
	onShow?(container?: HTMLElement): void
	/** runs when the menu is closed (as soon as it's hidden) */
	onHide?(): void
}

export interface SidePanelMenu extends SidePanelOptions {
	/** shows menu */
	show(): void
	/** hides menu */
	hide(): void
	/** destroys menu */
	$destroy(): void
}

/** Initializes SidePanel instance */
declare function SidePanel(options: SidePanelOptions): SidePanelMenu

export default SidePanel

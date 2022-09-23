import Panel from './side-panel-menu-thing.svelte'

export default (props) => {
	return new Panel({
		...props,
		props,
	})
}

import Panel from './side-panel-menu-thing.svelte'

export default (props) => {
	return new Panel({
		target: props.target,
		props,
	})
}

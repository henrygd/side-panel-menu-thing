function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function not_equal(a, b) {
    return a != a ? b == b : a !== b;
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

function is_date(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}

function get_interpolator(a, b) {
    if (a === b || a !== a)
        return () => a;
    const type = typeof a;
    if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        throw new Error('Cannot interpolate values of different type');
    }
    if (Array.isArray(a)) {
        const arr = b.map((bi, i) => {
            return get_interpolator(a[i], bi);
        });
        return t => arr.map(fn => fn(t));
    }
    if (type === 'object') {
        if (!a || !b)
            throw new Error('Object cannot be null');
        if (is_date(a) && is_date(b)) {
            a = a.getTime();
            b = b.getTime();
            const delta = b - a;
            return t => new Date(a + t * delta);
        }
        const keys = Object.keys(b);
        const interpolators = {};
        keys.forEach(key => {
            interpolators[key] = get_interpolator(a[key], b[key]);
        });
        return t => {
            const result = {};
            keys.forEach(key => {
                result[key] = interpolators[key](t);
            });
            return result;
        };
    }
    if (type === 'number') {
        const delta = b - a;
        return t => a + t * delta;
    }
    throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
    const store = writable(value);
    let task;
    let target_value = value;
    function set(new_value, opts) {
        if (value == null) {
            store.set(value = new_value);
            return Promise.resolve();
        }
        target_value = new_value;
        let previous_task = task;
        let started = false;
        let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
        if (duration === 0) {
            if (previous_task) {
                previous_task.abort();
                previous_task = null;
            }
            store.set(value = target_value);
            return Promise.resolve();
        }
        const start = now() + delay;
        let fn;
        task = loop(now => {
            if (now < start)
                return true;
            if (!started) {
                fn = interpolate(value, new_value);
                if (typeof duration === 'function')
                    duration = duration(value, new_value);
                started = true;
            }
            if (previous_task) {
                previous_task.abort();
                previous_task = null;
            }
            const elapsed = now - start;
            if (elapsed > duration) {
                store.set(value = new_value);
                return false;
            }
            // @ts-ignore
            store.set(value = fn(easing(elapsed / duration)));
            return true;
        });
        return task.promise;
    }
    return {
        set,
        update: (fn, opts) => set(fn(target_value, value), opts),
        subscribe: store.subscribe
    };
}

let e,l,{documentElement:o,body:t}=document,r=()=>{o.scrollHeight>o.clientHeight&&(e=e||getComputedStyle(o).overflowY,l=l||getComputedStyle(t).overflowY,o.style.overflowY="hidden",t.style.overflowY="scroll");},s=()=>{o.style.overflowY=e,t.style.overflowY=e;};

/* src/side-panel-menu-thing.svelte generated by Svelte v3.50.1 */

function create_fragment(ctx) {
	let div2;
	let div0;
	let t;
	let div1;
	let div1_tabindex_value;
	let onMount_action;
	let div2_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			t = space();
			div1 = element("div");
			attr(div0, "class", "spmt-overlay");
			set_style(div0, "opacity", /*overlayOpacity*/ ctx[9]);
			attr(div1, "class", "spmt");
			set_style(div1, "width", /*width*/ ctx[0] + "px");

			set_style(div1, "transform", "translateX(" + (/*left*/ ctx[2]
			? /*$menuPos*/ ctx[5] * -1
			: /*$menuPos*/ ctx[5]) + "%)");

			attr(div1, "tabindex", div1_tabindex_value = /*shown*/ ctx[8] ? '0' : false);
			toggle_class(div1, "left", /*left*/ ctx[2]);
			attr(div2, "class", div2_class_value = "spmt-wrap " + /*wrapClass*/ ctx[3]);
			attr(div2, "data-no-panel", "");
			toggle_class(div2, "novis", !/*shown*/ ctx[8]);
			toggle_class(div2, "fixed", /*fixed*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div2, t);
			append(div2, div1);
			/*div1_binding*/ ctx[21](div1);
			/*div2_binding*/ ctx[23](div2);

			if (!mounted) {
				dispose = [
					listen(div0, "click", /*hide*/ ctx[4]),
					action_destroyer(onMount_action = /*onMount*/ ctx[12].call(null, div1, /*shown*/ ctx[8])),
					listen(div1, "keydown", /*keydown_handler*/ ctx[22])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*overlayOpacity*/ 512) {
				set_style(div0, "opacity", /*overlayOpacity*/ ctx[9]);
			}

			if (dirty & /*width*/ 1) {
				set_style(div1, "width", /*width*/ ctx[0] + "px");
			}

			if (dirty & /*left, $menuPos*/ 36) {
				set_style(div1, "transform", "translateX(" + (/*left*/ ctx[2]
				? /*$menuPos*/ ctx[5] * -1
				: /*$menuPos*/ ctx[5]) + "%)");
			}

			if (dirty & /*shown*/ 256 && div1_tabindex_value !== (div1_tabindex_value = /*shown*/ ctx[8] ? '0' : false)) {
				attr(div1, "tabindex", div1_tabindex_value);
			}

			if (onMount_action && is_function(onMount_action.update) && dirty & /*shown*/ 256) onMount_action.update.call(null, /*shown*/ ctx[8]);

			if (dirty & /*left*/ 4) {
				toggle_class(div1, "left", /*left*/ ctx[2]);
			}

			if (dirty & /*wrapClass*/ 8 && div2_class_value !== (div2_class_value = "spmt-wrap " + /*wrapClass*/ ctx[3])) {
				attr(div2, "class", div2_class_value);
			}

			if (dirty & /*wrapClass, shown*/ 264) {
				toggle_class(div2, "novis", !/*shown*/ ctx[8]);
			}

			if (dirty & /*wrapClass, fixed*/ 10) {
				toggle_class(div2, "fixed", /*fixed*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div2);
			/*div1_binding*/ ctx[21](null);
			/*div2_binding*/ ctx[23](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let overlayOpacity;
	let shown;
	let $menuPos;
	let { target = null } = $$props;
	let { content = null } = $$props;
	let { width = 400 } = $$props;
	let { duration = 450 } = $$props;
	let { fixed = true } = $$props;
	let { left = false } = $$props;
	let { dragOpen = true } = $$props;
	let { onShow = null } = $$props;
	let { onHide = null } = $$props;
	let { preventScroll = true } = $$props;
	let { wrapClass = '' } = $$props;
	content.parentElement?.removeChild(content);

	// starting touch points
	let startX;

	let startY;

	// stores touch data on touchmove
	let touchEventData;

	// container dom element
	let container;

	// menu dom element
	let menu;

	// dom element to restore focus to on close
	let focusTrigger;

	// 100 is closed, 0 is open (this is the x transform in percent)
	const menuPos = tweened(100, { duration, easing: cubicOut });

	component_subscribe($$self, menuPos, value => $$invalidate(5, $menuPos = value));

	const show = e => {
		set_store_value(menuPos, $menuPos = 0, $menuPos);

		// if event, store target as focusTrigger
		focusTrigger = e ? e.target : null;
	};

	const hide = () => {
		set_store_value(menuPos, $menuPos = 100, $menuPos);
	};

	// trap focus listener
	function trapFocus(e) {
		let isTabPressed = e.keyCode === 9;

		if (!shown || !isTabPressed) {
			return;
		}

		const containerNodes = container.querySelectorAll('*');
		const tabbable = Array.from(containerNodes).filter(n => n.tabIndex >= 0);

		if (tabbable.length) {
			e.preventDefault();
			let index = tabbable.indexOf(document.activeElement);
			index += tabbable.length + (e.shiftKey ? -1 : 1);
			index %= tabbable.length;
			tabbable[index].focus();
		}
	}

	function onMount(node) {
		if (content) {
			node.appendChild(content);
		}

		target.addEventListener(
			'touchstart',
			e => {
				let isIgnored = e.target.closest('[data-no-panel]');
				startX = e.changedTouches[0].pageX;
				startY = e.changedTouches[0].pageY;

				if (!shown && (isIgnored || !dragOpen)) {
					touchEventData = null;
					return;
				}

				let boundingClientRect = target.getBoundingClientRect();
				let touchEnabled = shown;

				// allow drag open if touch is initiated within 30px of target edge
				if (left && startX - boundingClientRect.left < 30 || !left && boundingClientRect.right - startX < 30) {
					touchEnabled = true;
				}

				touchEventData = touchEnabled
				? { start: $menuPos, time: e.timeStamp }
				: null;
			},
			{ passive: true }
		);

		target.addEventListener(
			'touchmove',
			e => {
				if (!shown && !touchEventData) {
					return;
				}

				let touchobj = e.changedTouches[0];
				let distX = touchobj.pageX - startX;
				let distY = touchobj.pageY - startY;

				if (!touchEventData.go && e.timeStamp - touchEventData.time < 150) {
					touchEventData.go = Math.abs(distX) > Math.abs(distY) * 2;
				}

				if (touchEventData.go) {
					const percentDragged = distX / width;
					const newMenuPos = touchEventData.start + percentDragged * (left ? -100 : 100);

					if (newMenuPos <= 100 && newMenuPos >= 0) {
						menuPos.set(newMenuPos, { duration: 0 });
					}
				}
			},
			{ passive: true }
		);

		target.addEventListener('touchend', e => {
			if (shown) {
				let { start, time } = touchEventData;
				let swipeDuration = e.timeStamp - time;
				let percentMoved = start - $menuPos;

				// todo? set shorter open close duration bc we've alredy moved it a bit
				if (swipeDuration < 300 && Math.abs(percentMoved) > 5) {
					// quick swipe
					percentMoved > 0 ? show() : hide();
				} else {
					$menuPos > 70 ? hide() : show();
				}
			}
		});

		return {
			update: shown => {
				if (shown) {
					// stop background scrolling
					fixed && preventScroll && r();

					// todo: something about this - focus is
					setTimeout(() => menu.focus(), 99);

					onShow?.(container);
				} else {
					// restore focus
					focusTrigger?.focus({ preventScroll: true });

					// allow background scrolling
					fixed && preventScroll && s();

					onHide?.();
				}
			}
		};
	}

	function div1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			menu = $$value;
			$$invalidate(7, menu);
		});
	}

	const keydown_handler = e => e.keyCode === 27 ? hide() : trapFocus(e);

	function div2_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			container = $$value;
			$$invalidate(6, container);
		});
	}

	$$self.$$set = $$props => {
		if ('target' in $$props) $$invalidate(13, target = $$props.target);
		if ('content' in $$props) $$invalidate(14, content = $$props.content);
		if ('width' in $$props) $$invalidate(0, width = $$props.width);
		if ('duration' in $$props) $$invalidate(15, duration = $$props.duration);
		if ('fixed' in $$props) $$invalidate(1, fixed = $$props.fixed);
		if ('left' in $$props) $$invalidate(2, left = $$props.left);
		if ('dragOpen' in $$props) $$invalidate(16, dragOpen = $$props.dragOpen);
		if ('onShow' in $$props) $$invalidate(17, onShow = $$props.onShow);
		if ('onHide' in $$props) $$invalidate(18, onHide = $$props.onHide);
		if ('preventScroll' in $$props) $$invalidate(19, preventScroll = $$props.preventScroll);
		if ('wrapClass' in $$props) $$invalidate(3, wrapClass = $$props.wrapClass);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$menuPos*/ 32) {
			// adjust overlay opacity automatically based on menu position
			$$invalidate(9, overlayOpacity = (100 - $menuPos) / 100);
		}

		if ($$self.$$.dirty & /*$menuPos*/ 32) {
			// whether the menu is open or in process of opening
			$$invalidate(8, shown = $menuPos < 100);
		}
	};

	return [
		width,
		fixed,
		left,
		wrapClass,
		hide,
		$menuPos,
		container,
		menu,
		shown,
		overlayOpacity,
		menuPos,
		trapFocus,
		onMount,
		target,
		content,
		duration,
		dragOpen,
		onShow,
		onHide,
		preventScroll,
		show,
		div1_binding,
		keydown_handler,
		div2_binding
	];
}

class Side_panel_menu_thing extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, not_equal, {
			target: 13,
			content: 14,
			width: 0,
			duration: 15,
			fixed: 1,
			left: 2,
			dragOpen: 16,
			onShow: 17,
			onHide: 18,
			preventScroll: 19,
			wrapClass: 3,
			show: 20,
			hide: 4
		});
	}

	get target() {
		return this.$$.ctx[13];
	}

	set target(target) {
		this.$$set({ target });
		flush();
	}

	get content() {
		return this.$$.ctx[14];
	}

	set content(content) {
		this.$$set({ content });
		flush();
	}

	get width() {
		return this.$$.ctx[0];
	}

	set width(width) {
		this.$$set({ width });
		flush();
	}

	get duration() {
		return this.$$.ctx[15];
	}

	set duration(duration) {
		this.$$set({ duration });
		flush();
	}

	get fixed() {
		return this.$$.ctx[1];
	}

	set fixed(fixed) {
		this.$$set({ fixed });
		flush();
	}

	get left() {
		return this.$$.ctx[2];
	}

	set left(left) {
		this.$$set({ left });
		flush();
	}

	get dragOpen() {
		return this.$$.ctx[16];
	}

	set dragOpen(dragOpen) {
		this.$$set({ dragOpen });
		flush();
	}

	get onShow() {
		return this.$$.ctx[17];
	}

	set onShow(onShow) {
		this.$$set({ onShow });
		flush();
	}

	get onHide() {
		return this.$$.ctx[18];
	}

	set onHide(onHide) {
		this.$$set({ onHide });
		flush();
	}

	get preventScroll() {
		return this.$$.ctx[19];
	}

	set preventScroll(preventScroll) {
		this.$$set({ preventScroll });
		flush();
	}

	get wrapClass() {
		return this.$$.ctx[3];
	}

	set wrapClass(wrapClass) {
		this.$$set({ wrapClass });
		flush();
	}

	get show() {
		return this.$$.ctx[20];
	}

	get hide() {
		return this.$$.ctx[4];
	}
}

var sidePanelMenuThing = (props) => {
	return new Side_panel_menu_thing({
		...props,
		props,
	})
};

export { sidePanelMenuThing as default };

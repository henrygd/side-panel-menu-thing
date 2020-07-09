function noop() { }
var identity = function (x) { return x; };
function assign(tar, src) {
    // @ts-ignore
    for (var k in src)
        { tar[k] = src[k]; }
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
function subscribe(store) {
    var callbacks = [], len = arguments.length - 1;
    while ( len-- > 0 ) callbacks[ len ] = arguments[ len + 1 ];

    if (store == null) {
        return noop;
    }
    var unsub = store.subscribe.apply(store, callbacks);
    return unsub.unsubscribe ? function () { return unsub.unsubscribe(); } : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function set_store_value(store, ret, value) {
    if ( value === void 0 ) value = ret;

    store.set(value);
    return ret;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

var is_client = typeof window !== 'undefined';
var now = is_client
    ? function () { return window.performance.now(); }
    : function () { return Date.now(); };
var raf = is_client ? function (cb) { return requestAnimationFrame(cb); } : noop;

var tasks = new Set();
function run_tasks(now) {
    tasks.forEach(function (task) {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        { raf(run_tasks); }
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    var task;
    if (tasks.size === 0)
        { raf(run_tasks); }
    return {
        promise: new Promise(function (fulfill) {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort: function abort() {
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
    return function () { return node.removeEventListener(event, handler, options); };
}
function attr(node, attribute, value) {
    if (value == null)
        { node.removeAttribute(attribute); }
    else if (node.getAttribute(attribute) !== value)
        { node.setAttribute(attribute, value); }
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}

var current_component;
function set_current_component(component) {
    current_component = component;
}

var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = Promise.resolve();
var update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
var flushing = false;
var seen_callbacks = new Set();
function flush() {
    if (flushing)
        { return; }
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (var i = 0; i < dirty_components.length; i += 1) {
            var component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        dirty_components.length = 0;
        while (binding_callbacks.length)
            { binding_callbacks.pop()(); }
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (var i$1 = 0; i$1 < render_callbacks.length; i$1 += 1) {
            var callback = render_callbacks[i$1];
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
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        var dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
var outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor) {
    var ref = component.$$;
    var fragment = ref.fragment;
    var on_mount = ref.on_mount;
    var on_destroy = ref.on_destroy;
    var after_update = ref.after_update;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(function () {
        var new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push.apply(on_destroy, new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    var $$ = component.$$;
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
function init(component, options, instance, create_fragment, not_equal, props, dirty) {
    if ( dirty === void 0 ) dirty = [-1];

    var parent_component = current_component;
    set_current_component(component);
    var prop_values = options.props || {};
    var $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: props,
        update: noop,
        not_equal: not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: dirty
    };
    var ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, function (i, ret) {
            var rest = [], len = arguments.length - 2;
            while ( len-- > 0 ) rest[ len ] = arguments[ len + 2 ];

            var value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
                    { $$.bound[i](value); }
                if (ready)
                    { make_dirty(component, i); }
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
            var nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            { transition_in(component.$$.fragment); }
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
var SvelteComponent = function SvelteComponent () {};

SvelteComponent.prototype.$destroy = function $destroy () {
    destroy_component(this, 1);
    this.$destroy = noop;
};
SvelteComponent.prototype.$on = function $on (type, callback) {
    var callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
    callbacks.push(callback);
    return function () {
        var index = callbacks.indexOf(callback);
        if (index !== -1)
            { callbacks.splice(index, 1); }
    };
};
SvelteComponent.prototype.$set = function $set () {
    // overridden by instance, if it has props
};

var subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start) {
    if ( start === void 0 ) start = noop;

    var stop;
    var subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                var run_queue = !subscriber_queue.length;
                for (var i = 0; i < subscribers.length; i += 1) {
                    var s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (var i$1 = 0; i$1 < subscriber_queue.length; i$1 += 2) {
                        subscriber_queue[i$1][0](subscriber_queue[i$1 + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate) {
        if ( invalidate === void 0 ) invalidate = noop;

        var subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return function () {
            var index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set: set, update: update, subscribe: subscribe };
}

function cubicOut(t) {
    var f = t - 1.0;
    return f * f * f + 1.0;
}

function is_date(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}

function get_interpolator(a, b) {
    if (a === b || a !== a)
        { return function () { return a; }; }
    var type = typeof a;
    if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        throw new Error('Cannot interpolate values of different type');
    }
    if (Array.isArray(a)) {
        var arr = b.map(function (bi, i) {
            return get_interpolator(a[i], bi);
        });
        return function (t) { return arr.map(function (fn) { return fn(t); }); };
    }
    if (type === 'object') {
        if (!a || !b)
            { throw new Error('Object cannot be null'); }
        if (is_date(a) && is_date(b)) {
            a = a.getTime();
            b = b.getTime();
            var delta = b - a;
            return function (t) { return new Date(a + t * delta); };
        }
        var keys = Object.keys(b);
        var interpolators = {};
        keys.forEach(function (key) {
            interpolators[key] = get_interpolator(a[key], b[key]);
        });
        return function (t) {
            var result = {};
            keys.forEach(function (key) {
                result[key] = interpolators[key](t);
            });
            return result;
        };
    }
    if (type === 'number') {
        var delta$1 = b - a;
        return function (t) { return a + t * delta$1; };
    }
    throw new Error(("Cannot interpolate " + type + " values"));
}
function tweened(value, defaults) {
    if ( defaults === void 0 ) defaults = {};

    var store = writable(value);
    var task;
    var target_value = value;
    function set(new_value, opts) {
        if (value == null) {
            store.set(value = new_value);
            return Promise.resolve();
        }
        target_value = new_value;
        var previous_task = task;
        var started = false;
        var ref = assign(assign({}, defaults), opts);
        var delay = ref.delay; if ( delay === void 0 ) delay = 0;
        var duration = ref.duration; if ( duration === void 0 ) duration = 400;
        var easing = ref.easing; if ( easing === void 0 ) easing = identity;
        var interpolate = ref.interpolate; if ( interpolate === void 0 ) interpolate = get_interpolator;
        if (duration === 0) {
            store.set(target_value);
            return Promise.resolve();
        }
        var start = now() + delay;
        var fn;
        task = loop(function (now) {
            if (now < start)
                { return true; }
            if (!started) {
                fn = interpolate(value, new_value);
                if (typeof duration === 'function')
                    { duration = duration(value, new_value); }
                started = true;
            }
            if (previous_task) {
                previous_task.abort();
                previous_task = null;
            }
            var elapsed = now - start;
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
        set: set,
        update: function (fn, opts) { return set(fn(target_value, value), opts); },
        subscribe: store.subscribe
    };
}

var html = document.documentElement;
var scrollbarWidth;
var hidden;

var hide = function () {
	if (hidden) {
		return
	}
	scrollbarWidth = window.innerWidth - html.clientWidth;
	html.style.overflow = 'hidden';
	scrollbarWidth && (html.style.paddingRight = scrollbarWidth + "px");
	hidden = true;
};

var show = function () {
	html.style.overflow = 'auto';
	scrollbarWidth && (html.style.paddingRight = '0');
	hidden = false;
};

var hideShowScroll = { hide: hide, show: show };

/* src/side-panel-menu-thing.svelte generated by Svelte v3.22.2 */

function create_fragment(ctx) {
	var div2;
	var div0;
	var t;
	var div1;
	var div1_tabindex_value;
	var onMount_action;
	var dispose;

	return {
		c: function c() {
			div2 = element("div");
			div0 = element("div");
			t = space();
			div1 = element("div");
			attr(div0, "class", "spmt-overlay");
			set_style(div0, "opacity", /*overlayOpacity*/ ctx[6]);
			attr(div1, "class", "spmt");
			set_style(div1, "width", /*width*/ ctx[0] + "px");

			set_style(div1, "transform", "translateX(" + (/*left*/ ctx[2]
			? /*$menuPos*/ ctx[7] * -1
			: /*$menuPos*/ ctx[7]) + "%)");

			attr(div1, "tabindex", div1_tabindex_value = /*shown*/ ctx[8] ? "0" : false);
			toggle_class(div1, "left", /*left*/ ctx[2]);
			attr(div2, "class", "spmt-wrap");
			attr(div2, "data-no-panel", "true");
			toggle_class(div2, "novis", !/*shown*/ ctx[8]);
			toggle_class(div2, "fixed", /*fixed*/ ctx[1]);
		},
		m: function m(target, anchor, remount) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div2, t);
			append(div2, div1);
			/*div1_binding*/ ctx[24](div1);
			/*div2_binding*/ ctx[26](div2);
			if (remount) { run_all(dispose); }

			dispose = [
				listen(div0, "click", /*hide*/ ctx[3]),
				action_destroyer(onMount_action = /*onMount*/ ctx[11].call(null, div1, /*shown*/ ctx[8])),
				listen(div1, "keydown", /*keydown_handler*/ ctx[25])
			];
		},
		p: function p(ctx, ref) {
			var dirty = ref[0];

			if (dirty & /*overlayOpacity*/ 64) {
				set_style(div0, "opacity", /*overlayOpacity*/ ctx[6]);
			}

			if (dirty & /*width*/ 1) {
				set_style(div1, "width", /*width*/ ctx[0] + "px");
			}

			if (dirty & /*left, $menuPos*/ 132) {
				set_style(div1, "transform", "translateX(" + (/*left*/ ctx[2]
				? /*$menuPos*/ ctx[7] * -1
				: /*$menuPos*/ ctx[7]) + "%)");
			}

			if (dirty & /*shown*/ 256 && div1_tabindex_value !== (div1_tabindex_value = /*shown*/ ctx[8] ? "0" : false)) {
				attr(div1, "tabindex", div1_tabindex_value);
			}

			if (onMount_action && is_function(onMount_action.update) && dirty & /*shown*/ 256) { onMount_action.update.call(null, /*shown*/ ctx[8]); }

			if (dirty & /*left*/ 4) {
				toggle_class(div1, "left", /*left*/ ctx[2]);
			}

			if (dirty & /*shown*/ 256) {
				toggle_class(div2, "novis", !/*shown*/ ctx[8]);
			}

			if (dirty & /*fixed*/ 2) {
				toggle_class(div2, "fixed", /*fixed*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d: function d(detaching) {
			if (detaching) { detach(div2); }
			/*div1_binding*/ ctx[24](null);
			/*div2_binding*/ ctx[26](null);
			run_all(dispose);
		}
	};
}

function isIgnoredElement(el) {
	while (el.parentNode) {
		if (el.hasAttribute("data-no-panel")) {
			return true;
		}

		el = el.parentNode;
	}
}

function instance($$self, $$props, $$invalidate) {
	var $menuPos;
	var target = $$props.target; if ( target === void 0 ) target = null;
	var content = $$props.content; if ( content === void 0 ) content = null;
	var width = $$props.width; if ( width === void 0 ) width = 400;
	var duration = $$props.duration; if ( duration === void 0 ) duration = 450;
	var fixed = $$props.fixed; if ( fixed === void 0 ) fixed = true;
	var left = $$props.left; if ( left === void 0 ) left = false;
	var dragOpen = $$props.dragOpen; if ( dragOpen === void 0 ) dragOpen = true;
	var onShow = $$props.onShow; if ( onShow === void 0 ) onShow = null;
	var onHide = $$props.onHide; if ( onHide === void 0 ) onHide = null;
	var preventScroll = $$props.preventScroll; if ( preventScroll === void 0 ) preventScroll = true;
	content.parentElement.removeChild(content);

	// starting touch points
	var startX;

	var startY;

	// stores touch data on touchmove
	var touchEventData;

	// container dom element
	var container;

	// menu dom element
	var menu;

	// dom element to restore focus to on close
	var focusTrigger;

	// 100 is closed, 0 is open (this is the x transform in percent)
	var menuPos = tweened(100, { duration: duration, easing: cubicOut });

	component_subscribe($$self, menuPos, function (value) { return $$invalidate(7, $menuPos = value); });

	var show = function (e) {
		set_store_value(menuPos, $menuPos = 0);

		// if event, store target as focusTrigger
		focusTrigger = e ? e.target : null;
	};

	var hide = function () {
		set_store_value(menuPos, $menuPos = 100);
	};

	// trap focus listener
	function trapFocus(e) {
		var isTabPressed = e.keyCode === 9;

		if (!shown || !isTabPressed) {
			return;
		}

		var containerNodes = container.querySelectorAll("*");
		var tabbable = Array.from(containerNodes).filter(function (n) { return n.tabIndex >= 0; });

		if (tabbable.length) {
			e.preventDefault();
			var index = tabbable.indexOf(document.activeElement);
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
			"touchstart",
			function (e) {
				var isIgnored = isIgnoredElement(e.target);
				startX = e.changedTouches[0].pageX;
				startY = e.changedTouches[0].pageY;

				if (!shown && (isIgnored || !dragOpen)) {
					touchEventData = null;
					return;
				}

				var boundingClientRect = target.getBoundingClientRect();
				var touchEnabled = shown;

				// allow drag open if touch is initiated within 30px of target edge
				if (left && startX - boundingClientRect.left < 30 || !left && boundingClientRect.right - startX < 30) {
					touchEnabled = true;
				}

				touchEventData = touchEnabled
				? { start: $menuPos, time: Date.now() }
				: null;
			},
			{ passive: true }
		);

		target.addEventListener(
			"touchmove",
			function (e) {
				if (!shown && !touchEventData) {
					return;
				}

				var touchobj = e.changedTouches[0];
				var distX = touchobj.pageX - startX;
				var distY = touchobj.pageY - startY;

				if (touchEventData.go !== null) {
					touchEventData.go = Math.abs(distX) > Math.abs(distY) ? true : null;
				}

				if (touchEventData.go) {
					var percentDragged = distX / menu.clientWidth;
					var newMenuPos = touchEventData.start + percentDragged * (left ? -100 : 100);

					if (newMenuPos <= 100 && newMenuPos >= 0) {
						menuPos.set(newMenuPos, { duration: 1 });
					}
				}
			},
			{ passive: true }
		);

		target.addEventListener("touchend", function (e) {
			if (shown) {
				var start = touchEventData.start;
				var time = touchEventData.time;
				var swipeDuration = Date.now() - time;
				var percentMoved = start - $menuPos;

				// todo? set shorter open close duration bc we've alredy moved it a bit
				if (swipeDuration < 400 && Math.abs(percentMoved) > 5) {
					// quick swipe
					percentMoved > 0 ? show() : hide();
				} else {
					$menuPos > 70 ? hide() : show();
				}
			}
		});

		return {
			update: function (shown) {
				if (shown) {
					// stop background scrolling
					fixed && preventScroll && hideShowScroll.hide();

					// todo: something about this - focus is
					setTimeout(function () { return menu.focus(); }, 99);

					onShow && onShow();
				} else {
					// restore focus
					focusTrigger && focusTrigger.focus({ preventScroll: true });

					// allow background scrolling
					fixed && preventScroll && hideShowScroll.show();

					onHide && onHide();
				}
			}
		};
	}

	function div1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](function () {
			$$invalidate(5, menu = $$value);
		});
	}

	var keydown_handler = function (e) { return e.keyCode === 27 ? hide() : trapFocus(e); };

	function div2_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](function () {
			$$invalidate(4, container = $$value);
		});
	}

	$$self.$set = function ($$props) {
		if ("target" in $$props) { $$invalidate(12, target = $$props.target); }
		if ("content" in $$props) { $$invalidate(13, content = $$props.content); }
		if ("width" in $$props) { $$invalidate(0, width = $$props.width); }
		if ("duration" in $$props) { $$invalidate(14, duration = $$props.duration); }
		if ("fixed" in $$props) { $$invalidate(1, fixed = $$props.fixed); }
		if ("left" in $$props) { $$invalidate(2, left = $$props.left); }
		if ("dragOpen" in $$props) { $$invalidate(15, dragOpen = $$props.dragOpen); }
		if ("onShow" in $$props) { $$invalidate(16, onShow = $$props.onShow); }
		if ("onHide" in $$props) { $$invalidate(17, onHide = $$props.onHide); }
		if ("preventScroll" in $$props) { $$invalidate(18, preventScroll = $$props.preventScroll); }
	};

	var overlayOpacity;
	var shown;

	$$self.$$.update = function () {
		if ($$self.$$.dirty & /*$menuPos*/ 128) {
			// adjust overlay opacity automatically based on menu position
			 $$invalidate(6, overlayOpacity = (100 - $menuPos) / 100);
		}

		if ($$self.$$.dirty & /*$menuPos*/ 128) {
			// whether the menu is open or in process of opening
			 $$invalidate(8, shown = $menuPos < 100);
		}
	};

	return [
		width,
		fixed,
		left,
		hide,
		container,
		menu,
		overlayOpacity,
		$menuPos,
		shown,
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
		startX,
		startY,
		touchEventData,
		focusTrigger,
		div1_binding,
		keydown_handler,
		div2_binding
	];
}

var Side_panel_menu_thing = /*@__PURE__*/(function (SvelteComponent) {
	function Side_panel_menu_thing(options) {
		SvelteComponent.call(this);

		init(this, options, instance, create_fragment, not_equal, {
			target: 12,
			content: 13,
			width: 0,
			duration: 14,
			fixed: 1,
			left: 2,
			dragOpen: 15,
			onShow: 16,
			onHide: 17,
			preventScroll: 18,
			show: 19,
			hide: 3
		});
	}

	if ( SvelteComponent ) Side_panel_menu_thing.__proto__ = SvelteComponent;
	Side_panel_menu_thing.prototype = Object.create( SvelteComponent && SvelteComponent.prototype );
	Side_panel_menu_thing.prototype.constructor = Side_panel_menu_thing;

	var prototypeAccessors = { target: { configurable: true },content: { configurable: true },width: { configurable: true },duration: { configurable: true },fixed: { configurable: true },left: { configurable: true },dragOpen: { configurable: true },onShow: { configurable: true },onHide: { configurable: true },preventScroll: { configurable: true },show: { configurable: true },hide: { configurable: true } };

	prototypeAccessors.target.get = function () {
		return this.$$.ctx[12];
	};

	prototypeAccessors.target.set = function (target) {
		this.$set({ target: target });
		flush();
	};

	prototypeAccessors.content.get = function () {
		return this.$$.ctx[13];
	};

	prototypeAccessors.content.set = function (content) {
		this.$set({ content: content });
		flush();
	};

	prototypeAccessors.width.get = function () {
		return this.$$.ctx[0];
	};

	prototypeAccessors.width.set = function (width) {
		this.$set({ width: width });
		flush();
	};

	prototypeAccessors.duration.get = function () {
		return this.$$.ctx[14];
	};

	prototypeAccessors.duration.set = function (duration) {
		this.$set({ duration: duration });
		flush();
	};

	prototypeAccessors.fixed.get = function () {
		return this.$$.ctx[1];
	};

	prototypeAccessors.fixed.set = function (fixed) {
		this.$set({ fixed: fixed });
		flush();
	};

	prototypeAccessors.left.get = function () {
		return this.$$.ctx[2];
	};

	prototypeAccessors.left.set = function (left) {
		this.$set({ left: left });
		flush();
	};

	prototypeAccessors.dragOpen.get = function () {
		return this.$$.ctx[15];
	};

	prototypeAccessors.dragOpen.set = function (dragOpen) {
		this.$set({ dragOpen: dragOpen });
		flush();
	};

	prototypeAccessors.onShow.get = function () {
		return this.$$.ctx[16];
	};

	prototypeAccessors.onShow.set = function (onShow) {
		this.$set({ onShow: onShow });
		flush();
	};

	prototypeAccessors.onHide.get = function () {
		return this.$$.ctx[17];
	};

	prototypeAccessors.onHide.set = function (onHide) {
		this.$set({ onHide: onHide });
		flush();
	};

	prototypeAccessors.preventScroll.get = function () {
		return this.$$.ctx[18];
	};

	prototypeAccessors.preventScroll.set = function (preventScroll) {
		this.$set({ preventScroll: preventScroll });
		flush();
	};

	prototypeAccessors.show.get = function () {
		return this.$$.ctx[19];
	};

	prototypeAccessors.hide.get = function () {
		return this.$$.ctx[3];
	};

	Object.defineProperties( Side_panel_menu_thing.prototype, prototypeAccessors );

	return Side_panel_menu_thing;
}(SvelteComponent));

function sidePanelMenuThing (props) {
	return new Side_panel_menu_thing({
		target: props.target,
		props: props,
	})
}

export default sidePanelMenuThing;

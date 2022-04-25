
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.47.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[17] = list;
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (50:8) {#each forms as form,index}
    function create_each_block(ctx) {
    	let div3;
    	let div0;
    	let input;
    	let t0;
    	let div1;
    	let p;
    	let t1_value = /*form*/ ctx[16].count + "";
    	let t1;
    	let t2;
    	let div2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let button3;
    	let mounted;
    	let dispose;

    	function keyup_handler() {
    		return /*keyup_handler*/ ctx[9](/*index*/ ctx[18], /*form*/ ctx[16]);
    	}

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[10].call(input, /*each_value*/ ctx[17], /*index*/ ctx[18]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*form*/ ctx[16]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[12](/*form*/ ctx[16]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[13](/*form*/ ctx[16]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[14](/*index*/ ctx[18], /*form*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "0";
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = "x";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "input svelte-kbiauv");
    			add_location(input, file, 52, 20, 1282);
    			set_style(div0, "float", "left");
    			add_location(div0, file, 51, 16, 1237);
    			attr_dev(p, "class", "number svelte-kbiauv");
    			add_location(p, file, 54, 47, 1455);
    			set_style(div1, "text-align", "center");
    			add_location(div1, file, 54, 16, 1424);
    			set_style(button0, "background", "#F56565");
    			add_location(button0, file, 56, 20, 1552);
    			set_style(button1, "background", "#4299E1");
    			add_location(button1, file, 57, 20, 1647);
    			set_style(button2, "background", "#ECC94B");
    			add_location(button2, file, 58, 20, 1743);
    			set_style(button3, "border-color", "transparent");
    			add_location(button3, file, 59, 20, 1838);
    			attr_dev(div2, "class", "func svelte-kbiauv");
    			add_location(div2, file, 55, 16, 1513);
    			attr_dev(div3, "class", "form svelte-kbiauv");
    			add_location(div3, file, 50, 12, 1202);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*form*/ ctx[16].text);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t4);
    			append_dev(div2, button1);
    			append_dev(div2, t6);
    			append_dev(div2, button2);
    			append_dev(div2, t8);
    			append_dev(div2, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", keyup_handler, false, false, false),
    					listen_dev(input, "input", input_input_handler),
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false),
    					listen_dev(button2, "click", click_handler_2, false, false, false),
    					listen_dev(button3, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*forms*/ 4 && input.value !== /*form*/ ctx[16].text) {
    				set_input_value(input, /*form*/ ctx[16].text);
    			}

    			if (dirty & /*forms*/ 4 && t1_value !== (t1_value = /*form*/ ctx[16].count + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(50:8) {#each forms as form,index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let p0;
    	let t1;
    	let t2;
    	let input;
    	let t3;
    	let p1;
    	let t4;
    	let t5;
    	let t6;
    	let p2;
    	let t7;
    	let t8;
    	let mounted;
    	let dispose;
    	let each_value = /*forms*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			p0 = element("p");
    			p0.textContent = "Multiple Counter";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			input = element("input");
    			t3 = space();
    			p1 = element("p");
    			t4 = text("title list:");
    			t5 = text(/*texts*/ ctx[1]);
    			t6 = space();
    			p2 = element("p");
    			t7 = text("sum of count:");
    			t8 = text(/*sum*/ ctx[0]);
    			set_style(p0, "font-size", "4em");
    			attr_dev(p0, "class", "subject svelte-kbiauv");
    			add_location(p0, file, 48, 4, 1092);
    			attr_dev(input, "type", "button");
    			input.value = "new counter";
    			attr_dev(input, "class", "addButton svelte-kbiauv");
    			add_location(input, file, 64, 4, 1997);
    			set_style(p1, "margin", "0");
    			add_location(p1, file, 65, 4, 2085);
    			set_style(p2, "margin", "0");
    			add_location(p2, file, 66, 4, 2132);
    			attr_dev(main, "class", "svelte-kbiauv");
    			add_location(main, file, 47, 0, 1081);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, p0);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t2);
    			append_dev(main, input);
    			append_dev(main, t3);
    			append_dev(main, p1);
    			append_dev(p1, t4);
    			append_dev(p1, t5);
    			append_dev(main, t6);
    			append_dev(main, p2);
    			append_dev(p2, t7);
    			append_dev(p2, t8);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*increase*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*decrease, forms, zero, minus, plus, onChangeInput*/ 380) {
    				each_value = /*forms*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*texts*/ 2) set_data_dev(t5, /*texts*/ ctx[1]);
    			if (dirty & /*sum*/ 1) set_data_dev(t8, /*sum*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let sum = 0;
    	let texts = [];

    	const plus = form => {
    		form.count += 1;
    		$$invalidate(2, forms);
    		$$invalidate(0, sum = forms.reduce((pre, cur) => pre + cur.count, 0));
    	};

    	const minus = form => {
    		if (form.count > 0) form.count -= 1;
    		$$invalidate(2, forms);
    		$$invalidate(0, sum = forms.reduce((pre, cur) => pre + cur.count, 0));
    	};

    	const zero = form => {
    		form.count = 0;
    		$$invalidate(2, forms);
    		$$invalidate(0, sum = forms.reduce((pre, cur) => pre + cur.count, 0));
    	};

    	let text = 'new';
    	let forms = [{ text: "new", count: 0 }];

    	const onChangeInput = (index, form) => {
    		$$invalidate(1, texts[index] = form.text, texts);
    		$$invalidate(1, texts);
    	};

    	function increase() {
    		forms.push({ text: "new", count: 0 });
    		$$invalidate(2, forms);
    		texts.push(text);
    		$$invalidate(1, texts);
    	}

    	const decrease = (index, form) => {
    		$$invalidate(2, forms = forms.filter((_, i) => i !== index));
    		form.count = 0;
    		$$invalidate(2, forms);
    		$$invalidate(0, sum = forms.reduce((pre, cur) => pre + cur.count, 0));
    		$$invalidate(1, texts = texts.filter((_, i) => i !== index));
    	};

    	onMount(() => {
    		texts.push(text);
    		$$invalidate(1, texts);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const keyup_handler = (index, form) => onChangeInput(index, form);

    	function input_input_handler(each_value, index) {
    		each_value[index].text = this.value;
    		$$invalidate(2, forms);
    	}

    	const click_handler = form => plus(form);
    	const click_handler_1 = form => minus(form);
    	const click_handler_2 = form => zero(form);
    	const click_handler_3 = (index, form) => decrease(index, form);

    	$$self.$capture_state = () => ({
    		onMount,
    		sum,
    		texts,
    		plus,
    		minus,
    		zero,
    		text,
    		forms,
    		onChangeInput,
    		increase,
    		decrease
    	});

    	$$self.$inject_state = $$props => {
    		if ('sum' in $$props) $$invalidate(0, sum = $$props.sum);
    		if ('texts' in $$props) $$invalidate(1, texts = $$props.texts);
    		if ('text' in $$props) text = $$props.text;
    		if ('forms' in $$props) $$invalidate(2, forms = $$props.forms);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sum,
    		texts,
    		forms,
    		plus,
    		minus,
    		zero,
    		onChangeInput,
    		increase,
    		decrease,
    		keyup_handler,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

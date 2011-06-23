


var SKIN = {
	globals: {},
	templates: {},
	templates_txt: {},
	gc : function() {
		// this isn't really necessary right now.
		// I do believe on a semi regular basis (maybe once every 5 minutes or so) I think we should try and do as much cleaning as possible
		for(var key in SKIN.globals) {
			var v = SKIN.globals[key];
			for(var i = 0; i < v.length; i++) {
				if(!LIB.inDom(v[i])) {
					SKIN.globals[key].splice(i, 1);
				}
				
				if(!v.length) {
					delete SKIN.globals[key];
				}
			}
		}
	},
	global : function(k, e, v) {
		if(!e) {
			e = cE('span');
		}
		
		//console.log("global: "+k);
		if(typeof SKIN.globals[k] === 'undefined') {
			SKIN.globals[k] = [e];
		} else {
			SKIN.globals[k].push(e);
		}
		
		if(v) {
			SKIN.set_global(k, v);
		}
		
		return e;
	},
	global_exists : function(k) {
		var els = SKIN.globals[k],
			i,	e;
		
		if(els && (i = els.length - 1) >= 0) {
			do {
				if(LIB.inDom(els[i])) {
					return els;
				}
			} while(i--);
		}
		
		return false;
	},
	set_global : function(k, v, force) {
		var els = SKIN.globals[k],
			i,	e;
		
		if(els && (i = els.length - 1) >= 0) {
			console.log("set global "+k, v);
			do {
				e = els[i];
				if(force || LIB.inDom(e) || true) {
					if(typeof v === 'undefined') {
						LIB.hide(e);
					} else {
						LIB.emptyNode(e);
						aC(e, typeof v === 'function' ? v(e) : v);
						LIB.show(e);
					}
				} else {
					console.log("removing global "+k, e);
					console.trace();
					SKIN.globals[k].splice(i, 1);
				}
			} while(i--);
		} else {
			console.error("global variable '"+k+"' does not exist");
		}
	},
	get_template : function(tpl, txt) {
		typeof txt === 'undefined' && (txt = SKIN.templates_txt[tpl]);
		var fn = null;
		
		function arg_vars(str) {
			str = ('"'+str.replace(/\{\{\{\{(.*?)\}\}\}\}/g, function(nothing, variable) {
				return '",'+variable+',"';
			})+'"').replace(/\{\{(.*?)\}\}/g, function(nothing, variable) {
				// debug for kenny
				if(DEBUG) {
					L[variable].indexOf("/>") !== -1 && LIB.trace("it appears you have html in the language item: "+variable);
				}
				
				return '",L.'+variable+',"';
			});
			
			while(str.substr(0, 1) === ',') {
				str = str.substr(1);
			}
			
			while(str.substr(-1) === ',') {
				str = str.substr(0, str.length-1);
			}
			
			return str;
		}
		
		function concat_vars(str) {
			str = ('"'+str.replace(/\{\{\{\{(.*?)\}\}\}\}/g, function(nothing, variable) {
				return '"+'+variable+'+"';
			})+'"').replace(/\{\{(.*?)\}\}/g, function(nothing, variable) {
				// debug for kenny
				if(DEBUG) {
					L[variable].indexOf("/>") !== -1 && LIB.trace("it appears you have html in the language item: "+variable);
				}
				
				return '"+L.'+variable+'+"';
			});
			
			while(str.substr(0, 3) === '""+') {
				str = str.substr(3);
			}
			
			while(str.substr(str.length-3) === '+""') {
				str = str.substr(0, str.length-3);
			}
			
			return str;
		}
		
		function concat_scope(scope) {
			var code = "";
			for(var i = 0; i < scope.length; i++) {
				var last_s = scope[i-1] ? scope[i-1]+"" : "";
				var s = scope[i];
				var c1 = s.charAt(0);
				var c2 = last_s.length ? last_s[0].substr(-1) : "";
				code += ((
						!last_s.length ||
						((c1 !== ';' || c1 !== '}') && (c2 === ';' || c2 === '}')) ||
						((c1 === ';' || c1 === '}') && (c2 !== ';' || c2 !== '}'))
					) ? "" : ";") + s;
			}
			
			return code;
		}
		
		function print_scope(code_blocks) {
			var i = 0,
				len = code_blocks.length,
				scope = [],
				node, inner;
			
			for(; i < len; i++) {
				node = code_blocks[i];
				
				if(node.nodeName.toLowerCase() === "code") {
					inner = LIB.trim(node.innerHTML);
					scope.push(cE("x", {innerHTML: inner}).firstChild.data);
				} else if(len === 1) {
					return "function(){return " + print_node(node) + "}()";
				} else {
					scope.push("o.push("+print_node(node)+")");
				}
			}
			
			// do the return lengths
			return !len ? "null" :
					"function(){var o=[];" + concat_scope(scope.concat("return o}()"));
		}
		
		function print_node(node) {
			var node_type = node.nodeName.toLowerCase();
			
			if(node_type === "code") {
				console.trace();
				//return "function(){"+(cE("x", {innerHTML: node.innerHTML}).firstChild.data)+"}";
			} else if(node_type === "#text") {
				return arg_vars(node.nodeValue);
			} else {
				var i = 0, a, attr, n,
					attrs = [],
					child_funcs = [],
					attributes = node.attributes,
					children = node.childNodes;
					
				for(; i < attributes.length; i++) {
					a = attributes[i];
					attr = a.nodeName.toLowerCase();
					
					if(attr === 'class') {
						attr = 'c';
					} else if(attr === 'for') {
						attr = 'f';
					}
					
					if(attr.substr(0, 2) === "on" && a.nodeValue) {
						// for now we'll assume this is an event
						//TODO: if there is no reference to 'd' then we don't need a scope
						// perhaps we can search for it by doing a search for 'd.'
						// but then, what if someone does something like myfunc(d) or myfunc("lala", d)
						// so maybe we could search for 'd.' or 'd)' or 'd,' (that'd probably take care of about 99% of the cases)
						// since it's ridiculous, we're just going to always do a scope... in modern engines, it probably doesn't cost much
						attrs.push(attr+":function(d){return function(e){"+a.nodeValue+"}}(d)");
					} else {
						attrs.push(attr+":"+concat_vars(a.nodeValue));
					}
				}
				
				for(i = 0; i < children.length; i++) {
					n = children[i];
					if(n.nodeName.toLowerCase() === "code") {
						a = i;
						i = children.length;
						while(children[--i].nodeName.toLowerCase() !== "code") {}
						var scope = [];
						do {
							scope.push(children[a]);
						} while(a++ !== i);
						
						child_funcs.push(print_scope(scope));
					} else {
						child_funcs.push(print_node(n));
					}
				}
				
				if(child_funcs.length) {
					child_funcs = ','+child_funcs.join(',');
				}
				
				node_type = node_type === "div" ? 1 :
					node_type === "span" ? 2 :
					node_type === "tr" ? 3 :
					node_type === "td" ? 4 :
					node_type === "p" ? 5 :
					node_type === "a" ? 6 :
					node_type === "form" ? 7 :
					node_type === "ul" ? 8 :
					node_type === "li" ? 9 :
					node_type === "table" ? 10 :
					node_type === "tbody" ? 11 :
					node_type === "h1" ? 12 :
					node_type === "h2" ? 13 :
						"'"+node_type+"'";
				
				attrs = attrs.length ? ",{"+attrs.join(',')+"}" : ",0";
				return "cE("+node_type+attrs+child_funcs+")";
			}
		}
		
		//TODO: perhaps I want to change this to {{variable}} instead of {{{{variable}}}}
		if(typeof txt !== 'undefined') {
			delete SKIN.templates_txt[tpl];
			
			// --------------
			
			txt = LIB.trim(LIB.str_replace_array(LIB.trim(txt), ["\n", "\t", "  "], ["", "", " "]));
			txt = LIB.trim(txt).replace(/\<\?(.*?)\?\>/g, function(nothing, variable) {
				while(variable.substr(-1, 1) === ';') {
					variable = variable.substr(0, variable.length-1);
				}
				
				var v = cE("div", 0, variable).innerHTML;
				if(v.charAt(0) === '=') {
					return "{{{{"+v.substr(1)+"}}}}";
				} else {
					return "<code>"+v+"</code>";
				}
			});
			
			// this is a cheap hack to not load images with the url "{{{{d.img_url}}}}" when the template loads.
			// this can easily be solved by simply namespacing that shit :)
			// <template:img src="{{{{d.img_url}}}}" />
			// prefix all elements with the namespace "template:"
			//txt = LIB.str_replace(txt, "<img ", "<imgz ");
			var div = cE("div", {html: txt}),
				code_blocks = div.childNodes,
				top_level = [],
				i = 0, n;
			
			for(; i < code_blocks.length; i++) {
				n = code_blocks[i];
				
				if(n.nodeName.toLowerCase() === "code") {
					a = i;
					i = code_blocks.length;
					while(code_blocks[--i].nodeName.toLowerCase() !== "code") {}
					var scope = [];
					do {
						scope.push(code_blocks[a]);
					} while(a++ !== i);
					
					top_level.push(print_scope(scope));
				} else {
					top_level.push(print_node(n));
				}
			}
			
			// temporary until I namespace the templates
			//txt = LIB.str_replace(txt, '"imgz"', '"img"');
			txt = LIB.str_replace(top_level.join(','), ',""', '');
			if(top_level.length > 1) {
				txt = "["+txt+"]";
			}
			
			//console.log("loading template: "+tpl+" fn:: "+txt);
			txt = "return "+txt+';';
			try {
				fn = new Function("t", "d", "L", "o", txt);
			} catch(e) {
				console.error(e.toString()+" :: "+txt);
				fn = function() {return e.toString()+" :: "+txt;};
			}
			
			SKIN.templates[tpl] = fn;
			//console.log(tpl, " :: ", fn.toString());
		} else {
			fn = SKIN.templates[tpl];
		}
		
		return fn;
	},
	data_template : function(template_id, cmd, params, opts) {
		if(typeof opts !== 'object') opts = {};
		
		var id = SERVER.cmd(cmd, params, function(template_id) {
			return function(msg) {
				var els = document.getElementsByClassName("cmd_"+template_id),
					err = msg.error,
					data = msg.ret,
					id = msg.id,
					common = msg.common,
					i = 0, e;
				
				for(; i < els.length; i++) {
					e = els[i];
					
					if(e.i === id) {
						/*if(data._id && !e._id) {
							e._id = data._id;
						}*/
						
						if(err) {
							SKIN.template(template_id, {"$error": err}, e, common);
						} else {
							SKIN.template(template_id, data, e, common);
						}
					}
				}
			};
		}(template_id), opts.app);
		
		if(opts.add) {
			SKIN.subscribe(opts.add, template_id, id, function(data, e) {
				//console.log("add event", template_id, e, data, e);
				if(e.is_empty) {
					e.is_empty = 0;
					e.innerHTML = "";
				}
				
				aC(e, SKIN.template(template_id, data));
			});
		}
		
		if(opts.remove) {
			SKIN.subscribe(opts.remove, template_id, id, function(id, e) {
				//console.log("remove event", template_id, id, e);
				remove_element(e, id);
			});
		}
		
		if(opts.update) {
			SKIN.subscribe(opts.update, template_id, id, function(data, e) {
				//console.log("update event", template_id, data, e);
				SKIN.template(template_id, data, e);
			});
		}
		
		return SKIN.global("cmd_"+template_id, cE("div", {i: id, empty: 1}, "Loading..."));
	},
	template : function(template_id, data, element, common) {
		var template_func, template, output, error, func_ret, fn_t,
			i, d;
		
		if(typeof data !== 'object') {
			data = {};
		}
		
		if(element) {
			if(element.empty) {
				element.is_empty = 0;
				LIB.emptyNode(element);
			}
			
			if(data.length === 0) {
				element.is_empty = 1;
			}
		}
		
		//console.trace();
		if(typeof(error = data["$error"]) !== 'undefined') {
			data = Mixin(data, common);
			output = cE("error", 0, error);
		} else {
			if(data.length === 0 && (typeof(fn_t = SKIN.get_template("empty_"+template_id)) === 'function' || typeof(fn_t = SKIN.get_template("empty")) === 'function')) {
				output = fn_t("empty", data, L);
			} else if(data.length) {
				output = [];
				//TODO add paging? - lol
				for(i = 0; i < data.length; i++) {
					d = Mixin(data[i], common);
					func_ret = SKIN.template(template_id, d);
					if(typeof(func_ret) !== 'undefined') {
						output.push(func_ret);
					}
				}
			} else if(typeof(fn_t = SKIN.get_template(template_id)) === 'function') {
				output = fn_t(template_id, data, L);
			} else {
				console.trace()
				output = cE("error", 0, "template '"+template_id+"' does not exist");
			}
		}
		
		if(typeof data._id !== 'undefined' && typeof output._id === 'undefined') {
			output._id = data._id;
		}
		
		if(element && output) {
			var nodes = element.childNodes;
			if(typeof output._id === 'undefined') {
				// replace entire
				LIB.emptyNode(element);
				aC(element, output);
			} else {
				// individual replace / insert
				replace_element(element, output, 1);
			}
		}
		
		return output; //typeof output !== 'undefined' ? new String(output).toString() : "";
	},
	gallery : function(opts) {
		var template_id = opts.template || 'gallery',
			page_offset = opts.page_offset || 0,
			page_size = opts.page_size || 10,
			page_total = opts.page_total || 1,
			render_func = opts.render,
			fetch_func = opts.fetch,
			element = SKIN.global("gallery."+template_id, cE("div", {empty: 1}, "Loading...")),
			render_callback = function(template_id) {
				var lib = {
					fetch: fetch_func,
					render: render_func,
					page_offset: page_offset,
					page_size: page_size,
					page_total: page_total,
					page: function(p) {
						lib.page_offset = p < 0 ? 0 : p > lib.page_total ? lib.page_total : p;
						lib.fetch(lib.page_offset, lib.page_size, lib.render);
					},
					pager_start: function() {
						lib.page_offset = 0;
						lib.fetch(lib.page_offset, lib.page_size, lib.render);
					},
					pager_back: function() {
						lib.page_offset -= lib.page_size;
						if(lib.page_offset < 0) lib.page_offset = 0;
						lib.fetch(lib.page_offset, lib.page_size, lib.render);
					},
					pager_forward: function() {
						lib.page_offset += lib.page_size;
						if(lib.page_offset < 0) lib.page_offset = 0;
						lib.fetch(lib.page_offset, lib.page_size, lib.render);
					},
					pager_end: function() {
						lib.page_offset = lib.page_total - (lib.page_total % lib.page_size);
						lib.fetch(lib.page_offset, lib.page_size, lib.render);
					}
				};
				
				if(typeof opts.controller === 'function') {
					opts.controller(lib);
				}
				
				// render_callback
				return function(page_offset, page_size, data) {
					console.log("render_callback", "gallery."+template_id, data);
					SKIN.set_global("gallery."+template_id, SKIN.template(template_id, data, null, lib), true);
					render_func(page_offset, page_size, data);
				};
			}(template_id);
		
		setTimeout(function() {
			fetch_func(page_offset, page_size, render_callback);
		}, 0);
		
		return element;
	},
	subscribe : function(event_id, template_id, element_id, callback) {
		SERVER.events[event_id] = function(event_id, template_id, element_id, callback) {
			return function(msg) {
				var els = document.getElementsByClassName("cmd_"+template_id),
					err = msg.error,
					data = msg.data,
					len = els.length,
					i = 0, e;
				
				if(len) {
					for(; i < len; i++) {
						e = els[i];
						
						if(e.i === element_id) {
							if(err) {
								callback({"$error": err}, e);
							} else {
								callback(data, e);
							}
						}
					}
				} else {
					delete SERVER.events[event_id];
				}
			};
		}(event_id, template_id, element_id, callback);
	},
	reloadCurrentPanel : function() {
		STATEMANAGER.hash = null;
	},
	Textbox : function(opts) {
		if(typeof opts !== 'object') {
			opts = {};
		}
		
		var _default_text = opts.default_text,
			_active_class = opts.active_class,
			_inactive_class = opts.inactive_class,
			_value = opts.value;
		
		if(_default_text) {
			delete opts.default_text;
		} else {
			_default_text = "Type here...";
		}
		
		if(_active_class) {
			delete opts.active_class;
		} else {
			_active_class = "form-active";
		}
		
		if(_inactive_class) {
			delete opts.inactive_class;
		} else {
			_inactive_class = "form-active";
		}
		
		if(!opts.type) {
			opts.type = "text";
		}
		
		if(!opts.value) {
			opts.value = _default_text;
		}
		
		opts.c = _value ? _active_class : _inactive_class;
		
		// I know that if onfocus is not set, this is a waste of memory... don't care right now.
		opts.onfocus = function(onfocus) {
			return function() {
				onfocus && onfocus();
				if(this.value == _default_text) {
					this.className = _active_class;
					this.value = '';
				}
			};
		}(opts.onfocus);
		
		opts.onblur = function(onblur) {
			onblur && onblur();
			return function() {
				if(!this.value) {
					this.className = _inactive_class;
					this.value = _default_text;
				}
			};
		}(opts.onblur);
		
		return cE('input', opts);
	}
};

//---------------------------------------
// move these to real events

var RENDER = {
	
	error : function(element, data) {
		data = data || {};
		console.log(element, data);
		if(data["$error"]) {
			element.appendChild(cE('error', {}, data["$error"]));
			return false;
		}
		
		return true;
	}
};

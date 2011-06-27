
// sider can be implemented by calling document.getElementsByClassName('expand') and calling click() on each one
// TODO: create a lib function for a slider bar (que trolazo!!)
// expanding events can be done by replacing the expander function with some extra logic to look up in an array what function to call
// same can be done with colors - colors can be looked up too (based on text value)

// "nigga'lippin that bitch" defined as, "swiped that shit and then slobbered all over her" #racist

// copy this design for a test: http://thelackoforiginality.tumblr.com/

function telescopic(txt, expander) {
	var first = txt.indexOf('['),
		last = txt.indexOf(']'),
		lindent, rindent, divider,
		phrase = [];
	
	if(typeof expander !== 'function') {
		expander = function(original, new_txt) {
			return [
				cE('span', {c: 'expand', onclick: function() {
					//LIB.cleanNode(this);
					LIB.removeClass(this.nextSibling, 'contract');
					LIB.hide(this);
					//aC(this, cE('span', 0, new_txt));
				}}, original),
				cE('span', {c: 'contract'}, new_txt)
			];
		};
	}
	
	function gen_span(left, middle, right) {
		var divider = left.indexOf('|');
		if(divider !== -1) {
			return expander(left.substr(0, divider), gen_span(left.substr(divider+1), middle, right));
		} else if((divider = middle.indexOf('|')) !== -1) {
			return [left, expander(middle.substr(0, divider), telescopic(middle.substr(divider+1)), expander), telescopic(right, expander)];
		} else {
			return [left, middle, right];
		}
	}
	
	if(first !== -1 && last !== -1) {
		lindent = first;
		// we have an expression
		while((lindent = txt.indexOf('[', lindent+1)) !== -1 && lindent < last) {
			first = lindent;
		}
		
		lindent = first;
		rindent = last;
		
		while(lindent && (lindent = txt.lastIndexOf('[', lindent-1)) !== -1 && (rindent = txt.indexOf(']', rindent+1)) !== -1 && lindent < rindent) {
			first = lindent;
			last = rindent;
		}
		
		return gen_span(txt.substr(0, first), txt.slice(first+1, last), txt.substr(last+1));
	} else if(first === -1 && last === -1) {
		return txt;
	} else {
		return cE('error', 0, "found an unmatched '[' or ']' in your telescopic text")
	}
}

//TODO: set a loading dialog if the posts is empty and not the end of the array
//TODO: disable / enable the appropriate buttons
//TODO: add dates to the post
// add this: http://threewordphrase.com/youare.htm (it's hard though, because it's not tumblr or has an api)

TUMBLR = {
	user: 'thelackoforiginality',
	type: 'photo',
	posts: {},
	total: {},
	data_callback: null,
	block_size: 20,
	gallery: null,
	gallery_control : function(gallery) {
		console.log("TUMBLR.gallery_control", gallery);
		TUMBLR.gallery = gallery;
	},
	load : function(panel, params) {
		console.log("TUMBLR.load - ", params);
		var type = params[0] || TUMBLR.type,
			user = params[1] || TUMBLR.user,
			reset = false;
		
		if(type === 'chat') {
			type = 'conversation';
		} else if(type === 'text') {
			type = 'regular';
		} else if(!type) {
			type = 'all';
		}
		
		if(type && type !== TUMBLR.type) {
			TUMBLR.type = type;
			reset = true;
		}
		
		if(user && user !== TUMBLR.user) {
			TUMBLR.user = params[1];
			reset = true;
		}
		
		if(reset || !TUMBLR.posts[type]) {
			TUMBLR.posts[type] = [];
			//TUMBLR.total[type] = -1;
		}
		
		console.log("TUMBLR.load", type, user, reset);
		if(SKIN.global_exists("gallery.tumblr_gallery")) {
			TUMBLR.gallery.page_offset = 0;
			TUMBLR.fetch(reset ? 0 : TUMBLR.gallery.page_offset, TUMBLR.gallery.page_size, TUMBLR.gallery.render);
		} else {
			SKIN.template("tumblr", {args: params}, $_('content'));
		}
	},
	render : function(page_offset, page_size, posts) {
		console.log("TUMBLR.render", page_offset, page_size, posts);
		if(posts) {
			SKIN.set_global('tumblr.cur', page_offset+1);
			SKIN.set_global('tumblr.posts', SKIN.template('tumblr_entry', posts));
		} else {
			// no posts
		}
	},
	fetch : function(page_offset, page_size, data_callback, force) {
		var type = TUMBLR.type,
			total = TUMBLR.total[type],
			block_size = TUMBLR.block_size,
			block_offset = page_offset,
			posts = TUMBLR.posts[type] ? TUMBLR.posts[type].slice(page_offset, page_offset + page_size) : [],
			i = posts.length-1;
		
		console.log("TUMBLR.fetch", type, page_offset, page_size, posts.length, data_callback);
		// remove null values
		if(i >= 0) {
			do {
				if(!posts[i]) {
					posts.splice(i, 1);
				}
			} while(i--);
		}
		
		if(posts.length === page_size) {
			data_callback(page_offset, page_size, posts);
		} else {
			//TODO: I think there's something that goes here
		}
		
		if(!force) {
			// preload next block
			if(typeof TUMBLR.total[type] === 'undefined') {
				page_offset = 0;
				total = 1;
			} else {
				block_offset = page_offset - (page_offset % block_size);
				posts = TUMBLR.posts[type].slice(page_offset, page_offset + block_size);
				i = posts.length-1;
				if(i >= 0) {
					do {
						if(!posts[i]) {
							posts.splice(i, 1);
						}
					} while(i--);
				}
			}
			
			if(posts.length === page_size && (page_offset % block_size) / block_size > 0.5) {
				block_offset += block_size;
			}
			
			//console.log("TUMBLR.fetch", posts.length, page_offset, block_offset, block_size, total);
			if(posts.length !== block_size && page_offset < total) {
				TUMBLR.get(block_offset, block_size, function(page_offset, block_offset) {
					return function(data) {
						console.log("TUMBLR.get(callback)", TUMBLR.gallery.page_offset, page_offset, "|", block_offset);
						if(TUMBLR.gallery.page_offset === page_offset) {
							TUMBLR.fetch(page_offset, page_size, data_callback, true);
						}
					};
				}(page_offset, block_offset));
			}
		} else {
			//TODO: we attempted to fetch the data but it was not available for some reason. show an error
		}
	},
	get : function(offset, page_size, data_callback) {
		var block_size = TUMBLR.block_size,
			type = TUMBLR.type,
			total = TUMBLR.total[type] || -1,
			s;
		
		console.log("TUMBLR.get", offset, total, TUMBLR.data_callback);
		if(TUMBLR.data_callback === null && (total < 0 || offset < total)) {
			if(data_callback) {
				TUMBLR.data_callback = data_callback;
			}
		
			//TODO: set the scripts with an id and don't rerequest if it's already requested
			//TODO: handle onerror events
			//TODO: perhaps look into trying a requesting iframe, to not polute the namespace so much
			var d = document.getElementsByTagName('script')[0],
				type = TUMBLR.type,
			s = cE('script', {
				type: 'text/javascript',
				async: true,
				id: 's_'+TUMBLR.type + offset,
				src: 'http://'+TUMBLR.user+'.tumblr.com/api/read/json?callback=TUMBLR.fetchback&num='+block_size+(type !== 'all' ? '&type='+type : '')+'&start='+offset,
			});
			
			d.parentNode.insertBefore(s, d);
			
			//TODO: onerror, show a message saying there was an error and a retry will be made in x seconds...
			/*LIB.addEvent('error', function() {
			
			}, s);*/
		}
	},
	fetchback : function(d) {
		var posts = d.posts,
			type = d["posts-type"] || 'all',
			ttotal = TUMBLR.total[type],
			offset = d["posts-start"]*1,
			total = d["posts-total"]*1,
			callback = TUMBLR.data_callback,
			end = posts.length + d["posts-start"],
			e = $_('s_' + d["posts-type"] + d["posts-start"]),
			i = offset, j = 0;
		
		console.log("TUMBLR.fetchback " + 's_'+type+offset, offset);
		if(e) {
			e.parentNode.removeChild(e);
		}
		
		//TODO: check to see if this number has changed
		if(ttotal === -1 || typeof ttotal === 'undefined') {
			TUMBLR.posts[type] = posts;
			TUMBLR.gallery.total(total);
			TUMBLR.total[type] = total;
		} else {
			console.log("totals", TUMBLR.total[type], d["posts-total"]);
			while(total < d["posts-total"]) {
				TUMBLR.posts[type].unshift(null);
				//TUMBLR.total++;
				offset++;
				i++;
			}
		
			//console.log("posts:", offset, posts.length, TUMBLR.posts.length);
			//TUMBLR.posts.splice.apply(TUMBLR.posts, [offset, 0].concat(posts));
			if(offset === TUMBLR.posts[type].length) {
				TUMBLR.posts[type] = TUMBLR.posts[type].concat(posts);
			} else {
				for(; i < end; i++) {
					TUMBLR.posts[type][i] = i >= offset ? posts[j++] : null;
				}
			}
		}
		
		if(callback) {
			callback(d);
			TUMBLR.data_callback = null;
		}
		
		SKIN.set_global('tumblr.title', d.tumblelog.title);
		SKIN.set_global('tumblr.total', total);
		SKIN.set_global('tumblr.'+type+'.total', total);
		//SKIN.set_global('tumblr.about', telescopic("greetings! [my name is|they call me on earth] [kenny|!![kenneth|kenneth edward bentley, by birth]..]. thank you"));
		// TODO, delete the script element from the dom on the callback
	}
}

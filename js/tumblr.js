
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
	user: 'thelackoforiginality', //cheaper-than-therapy, gingerphobia, thelackoforiginality, myreto
	type: 'photo',
	posts: [],
	total: -1,
	data_callback: null,
	callback_offset: -1,
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
		
		if(type && type !== TUMBLR.type) {
			TUMBLR.type = params[0];
			reset = true;
		}
		
		if(user && user !== TUMBLR.user) {
			TUMBLR.user = params[1];
			reset = true;
		}
		
		if(reset) {
			TUMBLR.posts = [];
			TUMBLR.total = -1;
			TUMBLR.callback_offset = -1;
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
		var total = TUMBLR.total,
			block_size = TUMBLR.block_size,
			block_offset = page_offset,
			posts = TUMBLR.posts.slice(page_offset, page_offset + page_size),
			i = posts.length-1;
		
		console.log("TUMBLR.fetch", page_offset, page_size, posts.length, data_callback);
		
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
			if(TUMBLR.total === -1) {
				page_offset = 0;
				total = 1;
			} else {
				block_offset = page_offset - (page_offset % block_size);
				posts = TUMBLR.posts.slice(page_offset, page_offset + block_size);
				i = posts.length-1;
				if(i >= 0) {
					do {
						if(!posts[i]) {
							posts.splice(i, 1);
						}
					} while(i--);
				}
			}
			
			if(posts.length === block_size && (page_offset % block_size) / block_size > 0.5) {
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
	get : function(page_offset, page_size, data_callback) {
		var block_size = TUMBLR.block_size,
			total = TUMBLR.total,
			offset = page_offset - (page_offset % block_size),
			s;
		
		console.log("TUMBLR.get", TUMBLR.callback_offset, offset, TUMBLR.total)
		if(TUMBLR.callback_offset === -1 && (total < 0 || offset < total)) {
			TUMBLR.callback_offset = offset;
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
				id: 's_'+TUMBLR.type + page_offset,
				src: 'http://'+TUMBLR.user+'.tumblr.com/api/read/json?callback=TUMBLR.fetchback&num='+block_size+(type !== 'all' ? '&type='+TUMBLR.type : '')+'&start='+TUMBLR.callback_offset,
			});
			
			d.parentNode.insertBefore(s, d);
			
			//TODO: onerror, show a message saying there was an error and a retry will be made in x seconds...
			/*LIB.addEvent('error', function() {
			
			}, s);*/
		}
	},
	fetchback : function(d) {
		var posts = d.posts,
			offset = TUMBLR.callback_offset,
			end = posts.length + d["posts-start"],
			e = $_('s_' + d["posts-type"] + d["posts-start"]),
			i = offset, j = 0;
		
		console.log("TUMBLR.fetchback " + 's_'+d["posts-type"]+d["posts-start"], TUMBLR.callback_offset);
		if(e) {
			e.parentNode.removeChild(e);
		}
		
		TUMBLR.callback_offset = -1;
		//TODO: check to see if this number has changed
		if(TUMBLR.total === -1) {
			TUMBLR.posts = posts;
			TUMBLR.gallery.total(d["posts-total"]*1);
			TUMBLR.total = d["posts-total"]*1;
		} else {
			console.log("totals", TUMBLR.total, d["posts-total"])
			while(TUMBLR.total < d["posts-total"]) {
				TUMBLR.posts.unshift(null);
				TUMBLR.total++;
				offset++;
				i++;
			}
		
			//console.log("posts:", offset, posts.length, TUMBLR.posts.length);
			//TUMBLR.posts.splice.apply(TUMBLR.posts, [offset, 0].concat(posts));
			if(offset === TUMBLR.posts.length) {
				TUMBLR.posts = TUMBLR.posts.concat(posts);
			} else {
				for(; i < end; i++) {
					TUMBLR.posts[i] = i >= offset ? posts[j++] : null;
				}
			}
		}
		
		if(TUMBLR.data_callback) {
			TUMBLR.data_callback(d);
		}
		
		SKIN.set_global('tumblr.title', d.tumblelog.title);
		SKIN.set_global('tumblr.total', d["posts-total"]);
		//SKIN.set_global('tumblr.about', telescopic("greetings! [my name is|they call me on earth] [kenny|!![kenneth|kenneth edward bentley, by birth]..]. thank you"));
		// TODO, delete the script element from the dom on the callback
	}
}

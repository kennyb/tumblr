
// sider can be implemented by calling document.getElementsByClassName('expand') and calling click() on each one
// TODO: create a lib function for a slider bar (que trolazo!!)
// expanding events can be done by replacing the expander function with some extra logic to look up in an array what function to call
// same can be done with colors - colors can be looked up too (based on text value)

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

TUMBLR = {
	user: 'thelackoforiginality', //cheaper-than-therapy, gingerphobia, thelackoforiginality, myreto
	type: 'photo',
	posts: [],
	total: -1,
	render_callback: null,
	callback_offset: -1,
	block_size: 2,
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
			//SKIN.renderPanel('tumblr');
			//SKIN.setWindowTitle("tumblr test");
			//MENU.selectItem($('sm'+type));
			//SKIN.resize();
		}
		
		if(SKIN.global_exists("gallery.tumblr_gallery")) {
			TUMBLR.fetch(reset ? 0 : TUMBLR.gallery.page_offset, TUMBLR.gallery.page_size, TUMBLR.gallery.render);
		} else {
			SKIN.template("tumblr", {args: params}, $_('content'));
		}
		
		/*
		// --------
		// inside template
		// --------
		
		var params = d.args || [],
			type = params[0] || 'photo',
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

		console.log("pasando por aqui");
		if(reset) {
			TUMBLR.posts = [];
			TUMBLR.total = -1;
			//SKIN.renderPanel('tumblr');
			//SKIN.setWindowTitle("tumblr test");
		}
		
		
		*/
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
		var posts = TUMBLR.posts.slice(page_offset, page_offset + page_size);
		console.log("TUMBLR.fetch", page_offset, page_size, posts.length, data_callback);
		
		if(posts.length === page_size) {
			//TODO: check to see if it's null or not, and if it isn't null, then show it, otherwise get a block
			data_callback(page_offset, page_size, posts);
		} else if(!force) {
			// preload
			if(page_offset+page_size+2 > TUMBLR.posts.length) {
				console.log("GET1", page_offset, page_size);
				TUMBLR.get(page_offset, page_size, function(data) {
					console.log("TUMBLR.get", data);
					TUMBLR.fetch(page_offset, page_size, data_callback, true);
				});
			}
		}
	},
	get : function(page_offset, page_size, render_callback) {
		var block_size = TUMBLR.block_size,
			total = TUMBLR.total,
			offset = page_offset - (page_offset % block_size);//TUMBLR.posts.length;
		
		console.log("TUMBLR.get", TUMBLR.callback_offset, offset, TUMBLR.total)
		if(TUMBLR.callback_offset === -1 && (total < 0 || offset + block_size < total)) {
			TUMBLR.callback_offset = offset;
			if(render_callback) {
				TUMBLR.render_callback = render_callback;
			}
		
			console.log("GET2", offset);
			//console.trace();
			//var s = LOADER.renderScript('http://'+TUMBLR.user+'.tumblr.com/api/read/json?callback=TUMBLR.data&num='+block_size+'&type='+TUMBLR.type+'&start='+TUMBLR.callback_offset);
			if(false && DEBUG) {
				console.log("LLLLLL");
				TUMBLR.fetchback({"tumblelog":{"title":"Three Word Phrase","description":"<a href=\"http:\/\/threewordphrase.tumblr.com\"><img src=\"http:\/\/threewordphrase.com\/header.gif\"><\/a>","name":"threewordphrase","timezone":"US\/Eastern","cname":false,"feeds":[]},"posts-start":0,"posts-total":49,"posts-type":"photo","posts":[{"id":"6611528437","url":"http:\/\/threewordphrase.tumblr.com\/post\/6611528437","url-with-slug":"http:\/\/threewordphrase.tumblr.com\/post\/6611528437","type":"photo","date-gmt":"2011-06-17 04:13:27 GMT","date":"Fri, 17 Jun 2011 00:13:27","bookmarklet":0,"mobile":0,"feed-item":"","from-feed-id":0,"unix-timestamp":1308284007,"format":"html","reblog-key":"z4yiDCqJ","slug":"","photo-caption":"","photo-link-url":"http:\/\/www.threewordphrase.com\/debate.htm","width":"800","height":"792","photo-url-1280":"http:\/\/threewordphrase.tumblr.com\/photo\/1280\/6611528437\/1\/tumblr_lmx2eeJ3tf1qhhhac","photo-url-500":"http:\/\/24.media.tumblr.com\/tumblr_lmx2eeJ3tf1qhhhaco1_500.gif","photo-url-400":"http:\/\/27.media.tumblr.com\/tumblr_lmx2eeJ3tf1qhhhaco1_400.gif","photo-url-250":"http:\/\/25.media.tumblr.com\/tumblr_lmx2eeJ3tf1qhhhaco1_250.gif","photo-url-100":"http:\/\/26.media.tumblr.com\/tumblr_lmx2eeJ3tf1qhhhaco1_100.gif","photo-url-75":"http:\/\/29.media.tumblr.com\/tumblr_lmx2eeJ3tf1qhhhaco1_75sq.gif","photos":[],"tags":["three word phrase","debate","president bird","issues","kisses"]},{"id":"6595165685","url":"http:\/\/threewordphrase.tumblr.com\/post\/6595165685","url-with-slug":"http:\/\/threewordphrase.tumblr.com\/post\/6595165685\/after-the-riots-in-vancouver-this-feels-sort-of","type":"photo","date-gmt":"2011-06-16 19:25:10 GMT","date":"Thu, 16 Jun 2011 15:25:10","bookmarklet":0,"mobile":0,"feed-item":"","from-feed-id":0,"unix-timestamp":1308252310,"format":"html","reblog-key":"JHRpTGT9","slug":"after-the-riots-in-vancouver-this-feels-sort-of","photo-caption":"<p>after the riots in vancouver this feels sort of appropriate today<\/p>","photo-link-url":"http:\/\/threewordphrase.com\/allupin.htm","width":"650","height":"243","photo-url-1280":"http:\/\/threewordphrase.tumblr.com\/photo\/1280\/6595165685\/1\/tumblr_lmwdxy95s11qhhhac","photo-url-500":"http:\/\/27.media.tumblr.com\/tumblr_lmwdxy95s11qhhhaco1_500.gif","photo-url-400":"http:\/\/30.media.tumblr.com\/tumblr_lmwdxy95s11qhhhaco1_400.gif","photo-url-250":"http:\/\/26.media.tumblr.com\/tumblr_lmwdxy95s11qhhhaco1_250.gif","photo-url-100":"http:\/\/26.media.tumblr.com\/tumblr_lmwdxy95s11qhhhaco1_100.gif","photo-url-75":"http:\/\/25.media.tumblr.com\/tumblr_lmwdxy95s11qhhhaco1_75sq.gif","photos":[],"tags":["canada","noooo"]}]});
			} else {
				var s = cE('script'),
					d = document.getElementsByTagName('script')[0];
				s.type = 'text/javascript';
				s.async = true;
				s.src = 'http://'+TUMBLR.user+'.tumblr.com/api/read/json?callback=TUMBLR.fetchback&num='+block_size+'&type='+TUMBLR.type+'&start='+TUMBLR.callback_offset;
				d.parentNode.insertBefore(s, d);
				//TODO: onerror, show a message saying there was an error and a retry will be made in x seconds...
				/*LIB.addEvent('error', function() {
				
				}, s);*/
			}
		}
	},
	fetchback : function(d) {
		var posts = d.posts,
			offset = TUMBLR.callback_offset,
			end = posts.length + offset,
			i = offset, j = 0;
		
		console.log("TUMBLR.fetchback");
		TUMBLR.callback_offset = -1;
		//TODO: check to see if this number has changed
		if(TUMBLR.total === -1) {
			TUMBLR.posts = posts;
			TUMBLR.total = d["posts-total"]*1;
		} else {
			console.log("totals", TUMBLR.total, d["posts-total"])
			while(TUMBLR.total < d["posts-total"]) {
				TUMBLR.posts.unshift(null);
				TUMBLR.total++;
				offset++;
			}
		
			//console.log("posts:", offset, posts.length, TUMBLR.posts.length);
			if(offset === TUMBLR.posts.length) {
				TUMBLR.posts = TUMBLR.posts.concat(posts);
			}
			
			//TODO: mix the posts, and if there's an overlap, then grab them from the front
			//TUMBLR.posts.splice.apply(TUMBLR.posts, [offset, 0].concat(posts));
			/*console.log("data", offset, end);
 			for(; i < end; i++) {
				TUMBLR.posts[i] = i >= offset ? posts[j++] : null;
			}
			*/
		}
		
		//console.log("posts:", posts.length, TUMBLR.posts.length);
		if(TUMBLR.render_callback) {
			TUMBLR.render_callback(d);
		}
		
		SKIN.set_global('tumblr.title', d.tumblelog.title);
		SKIN.set_global('tumblr.total', d["posts-total"]);
		//SKIN.set_global('tumblr.about', telescopic("greetings! [my name is|they call me on earth] [kenny|!![kenneth|kenneth edward bentley, by birth]..]. thank you"));
		// TODO, delete the script element from the dom on the callback
	}
}

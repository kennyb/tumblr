HN = {
	login: false,
	profile: {
		'kenny': ""
	},
	load : function(d) {
		
	},
	profile : function(id, d) {
		//SKIN.get_template()
		var fn = SKIN.templates["profile."+id];
		if(typeof fn !== 'function') {
			fn = SKIN.get_template("profile."+id, "anonymous - all your thoughts are belong to us");
		}
		
		return fn("profile", d, L);
	}
};

TYWOWD = {
	data: [{
		_id: "1234",
		txt: "not lie to me",
		voteup: 2,
		votedown: 1,
		d_created: new Date()
	},{
		_id: "1234567",
		txt: "wash my clothes for me",
		voteup: 1,
		votedown: 0,
		d_created: new Date()
	},{
		_id: "123456",
		txt: "say what they're really thinking. I can take it",
		voteup: 1,
		votedown: 0,
		d_created: new Date()
	},{
		_id: "12345",
		txt: "not tell me what to do",
		voteup: 1,
		votedown: 0,
		d_created: new Date()
	}],
	gallery_control : function(gallery) {
		TYWOWD.gallery = gallery;
	},
	add : function(txt) {
		console.log(TYWOWD.data);
		var o = {
			_id: "id",
			txt: txt,
			voteup: 0,
			votedown: 0,
			d_created: new Date()
		};
		TYWOWD.data.push(o);
		TYWOWD.gallery.add(o);
	},
	del : function(id) {
		TYWOWD.data.forEach(function(v, k) {
			if(id == v._id) {
				TYWOWD.data.splice(k, 1);
			}
		});
		TYWOWD.gallery.fetch(1);
	},
	voteup : function(id, down) {
		TYWOWD.data.forEach(function(v, k, a) {
			if(v._id === id) {
				console.log(k,v, v._id, id);
				if(down) {
					v.votedown++;
				} else {
					v.voteup++;
				}
			}
		});
		TYWOWD.gallery.fetch(1);
	},
	fetch : function(start, end, render_func, force, append) {
		//debugger;
		console.log("TYWOWD.fetch", start, end, force, append);
		render_func(TYWOWD.data.slice(start, end), append);
	},
	render : function(posts, append) {
		console.log("TYWOWD.render", posts, append);
		if(posts) {
			//SKIN.set_global('tywowd.start', TUMBLR.gallery.start_offset+1);
			//SKIN.set_global('tywowd.end', TUMBLR.gallery.end_offset+1);
			SKIN.set_global('tywowd.posts', SKIN.template('hamsternipples.tywowd.entry', posts), 0, append);
		} else {
			// no posts
		}
	},
}
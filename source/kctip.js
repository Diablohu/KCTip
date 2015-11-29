/*

Current status

* Tip layout done
* Tip content NYI
* Browser compatibility NYI

 */


(function(){
	"use strict";
	
	let _isMoving = false
		,_x, _y
	
	/* style */
		let style = document.createElement('style')
		style.innerHTML = '[[STYLE]]'
		document.head.appendChild( style )


	/* prevent touch triggering mouseenter */
		let _preventMouseover = false
			,_isTouch = false
		
		function touchstartPreventMouseover(e){
				_preventMouseover = true
				_isTouch = true
			}
		document.addEventListener("touchstart", touchstartPreventMouseover)
		document.addEventListener("pointerenter", function pointerenterPreventMouseover(e){
				if( e.pointerType == 'touch' )
					touchstartPreventMouseover()
				else{
					_preventMouseover = false
					_isTouch = false
				}
			})
		//document.addEventListener("mouseenter", function mouseoverPreventMouseover(e){
		document.addEventListener("mouseover", function mouseoverPreventMouseover(e){
				if( _isTouch ){
					_isTouch = false
					_preventMouseover = true
				}else{
					_preventMouseover = false
				}
			})
		//document.addEventListener("mouseleave", function mouseleavePreventMouseover(e){
		//	})


	let KCTip = {
		//is_init:			false,
		//is_showing:		false,
		pos:				'bottom',
		//pos:				'mouse',
		//w:				0,
		//h:				0,
		size_indicator:		8,
	
		// 文本滤镜，可任意加入滤镜函数
		filters: [],
	
		// 隐藏tip延迟时间，毫秒
		countdown_fade:			250,
		
		// 结果缓存
		cache: {},
	
		// curLoading: 			null,
	
		// 初始化tip
		init: function(){
			if(this.is_init)
				return this
			
			this.body = document.createElement('div')
			this.body.classList.add('kctip')
			this.body.setAttribute('id', 'kctip')
			let evts = ['transitionend','webkitTransitionEnd','mozTransitionEnd']
			evts.forEach(function(evt){
				this.body.addEventListener(evt, function(e) {
					let style = window.getComputedStyle ? getComputedStyle(e.target, null) : e.target.currentStyle;
					if( e.currentTarget == e.target && e.propertyName == 'opacity' && style.opacity == 0 ){
						KCTip.hideAfter()
					}
				})
			}, this)
			document.body.appendChild( this.body )
			
			this.container = document.createElement('div')
			this.container.classList.add('wrapper')
			this.body.appendChild( this.container )
	
			// 虚化背景
				if( 'backdrop-filter' in document.documentElement.style || '-webkit-backdrop-filter' in document.documentElement.style ){
					this.body.addClass('mod-blur-backdrop')
				}
	
			this.is_init=true
		},
	
		// 显示
		// cont:	HTML内容
		// el:		触发tip的DOM，通常为鼠标指向位置
		// pos:		tip位置
		show: function( el, cont, pos ){
			if( _preventMouseover || !el )
				return false
	
			clearTimeout(this.timeout_fade)
	
			el = el || document.body;
			this.el = el
	
			pos = pos || el.getAttribute('kctip-position') || this.pos
	
			cont = this.content(cont)
	
			this.init();
	
			if( !this.body.classList.contains('show') ){
				this.body.classList.add('show')
			}
	
			this.position( cont, pos );
	
			this.is_showing=true;
		},
	
		// 计算tip位置
		position:function(cont, pos){
			this.body.style.top = ''
			this.body.style.left = ''

			if( cont.nodeType && cont.nodeType == 1 ){
				this.container.appendChild(cont)
			}else{
				this.container.innerHTML = cont
			}

			this.w = this.body.offsetWidth
			this.h = this.body.offsetHeight
	
			let coords = this['pos_'+pos]( this.w , this.h );
			if(coords){
				this.move(coords.x, coords.y)
			}
		},
	
		// 隐藏tip
		// is_instant：瞬间隐藏，没有延迟
		hide:function( is_instant ){
			if( !this.is_init || !this.is_showing )
				return false
	
			//this.el_pending = null
			
			function h(){
				KCTip.body.classList.remove('on')
				KCTip.el.removeEventListener(KCTipMouseMoveHandler)
				KCTip.el = null
				KCTip.is_showing = false
				KCTip.pos = 'bottom'
			}
			
			if( this.pos == 'mouse' ){
				requestAnimationFrame(h)
			}else{
				this.timeout_fade = setTimeout(h, is_instant ? 0 : this.countdown_fade)
			}
		},
		
		// 完全隐藏
		hideAfter: function(){
			this.body.classList.remove('show')
			this.body.style.top = ''
			this.body.style.left = ''
			this.body.removeAttribute('kctip-indicator-pos')
			this.body.removeAttribute('kctip-indicator-offset-x')
			this.body.removeAttribute('kctip-indicator-offset-y')
			delete this.curLoading
			_x = null
			_y = null
		},
		
		// 格式化tip内容
		content: function( cont, el ){
			el = el || this.el
			
			let t, i
			
			if( !cont ){
				cont = el.getAttribute('href')
				let matches = /\/([a-z]+)\/([0-9]+)/gi.exec(cont)
				if( matches && matches.length > 1 ){
					t = matches[1]
					i = matches[2]
				}
			}
			
			if( t && i ){
				if( !this.cache[t] )
					this.cache[t] = {}

				if( this.cache[t][i] )
					return this.cache[t][i]
				
				this.curLoading = t + '::' + i
				if( !this.cache.loading ){
					this.cache.loading = document.createElement('div')
					this.cache.loading.classList.add('loading')
				}
				this.load(t, i)
				return this.cache.loading
			}
	
			return cont
		},
		
		// 读取内容
		load: function(t, i){
			this.cache.loading.innerHTML = '载入中...'
			
			let script = document.createElement('script')
			script.src = 'http://fleet.diablohu.com/!/tip/'+t+'/'+i+'.js'
			script.addEventListener('error', function(e) {
				KCTip.cache.loading.innerHTML = '发生错误...'
			})
			
			document.head.appendChild( script )
		},
	
		// 移动tip到 x,y
		move: function(x,y){
			this.body.style.top = y + 'px'
			this.body.style.left = x + 'px'
			this.body.classList.add('on')
		},
	
		// 获取小箭头尺寸
		get_indicator_size: function(){
			return this.size_indicator;
		},
	
		// tip位置函数
		pos_mouse: function(w,h){
			this.el.addEventListener('mousemove', KCTipMouseMoveHandler)
		},
		pos_bottom: function(w,h){
			let o	= offset(this.el)
				,x	= o.left + ( this.el.offsetWidth - this.body.offsetWidth )/2
				,y	= o.top + this.el.offsetHeight + this.get_indicator_size()
	
			this.body.setAttribute('kctip-indicator-pos', 'top' )
	
			return this.checkpos(x,y,w,h)
		},
		pos_top: function(w,h){
			let o	= offset(this.el)
				,x	= o.left + ( this.el.offsetWidth - this.body.offsetWidth )/2
				,y	= o.top - h - this.get_indicator_size()
	
			this.body.setAttribute('kctip-indicator-pos', 'bottom' )
	
			return this.checkpos(x,y,w,h)
		},
		pos_left: function(w,h){
			let o	= offset(this.el)
				,x	= o.left - w - this.get_indicator_size()
				,y	= o.top + ( this.el.offsetHeight - this.body.offsetHeight )/2
	
			this.body.setAttribute('kctip-indicator-pos', 'right' )
	
			return this.checkpos(x,y,w,h)
		},
		pos_right: function(w,h){
			let o	= offset(this.el)
				,x	= o.left + this.el.offsetWidth + this.get_indicator_size()
				,y	= o.top + ( this.el.offsetHeight - this.body.offsetHeight )/2
	
			this.body.setAttribute('kctip-indicator-pos', 'left' )
	
			return this.checkpos(x,y,w,h)
		},
		checkpos: function(x,y,w,h){
			let o 		= offset(this.el)
				,nx 	= x
				,ny 	= y
				,pos 	= {x:nx,y:ny}
	
				,clientWidth = document.documentElement.clientWidth
				,clientHeight = document.documentElement.clientHeight
				,scrollLeft	= window.pageXOffset || document.documentElement.scrollLeft
				,scrollTop 	= window.pageYOffset || document.documentElement.scrollTop
			
			w = w || this.w
			h = h || this.h
	
			// 超出X轴右边界
			if ((x + w) > clientWidth + scrollLeft ){
				if( w > o.left ){
					pos = {
						'x': clientWidth + scrollLeft - w - 2,
						'y': y
					}
				}else{
					//nx = o.left - w;
					pos = this['pos_left']( w , h )
				}
			}
	
			// 超出X轴左边界
			else if (x < 0)
				//nx = 15;
				pos = this['pos_right']( w , h )
	
			// 超出Y轴下边界
			if ( (y + h) > (scrollTop + clientHeight) )
				//ny = this.pos == 'bottom' ? ( o.top - this.el.outerHeight() ) : ( $(window).scrollTop() + $(window).height() - h );
				pos = this['pos_top']( w , h )
	
			// Node on top of viewport scroll
			//else if ((o.top - 100) < $(window).scrollTop())
			//	ny = o.top + this.el.outerHeight();
	
			// Less than y viewport scrolled
			//else if (y < $(window).scrollTop())
			//	ny = $(window).scrollTop() + 10;
	
			// Less than y viewport
			//else if (y < 0)
			//	ny = 15;
	
			// 超出Y轴上边界
			else if ( y < scrollTop )
				//ny = this.pos == 'bottom' ? ( o.top - this.el.outerHeight() ) : ( $(window).scrollTop() + $(window).height() - h );
				pos = this['pos_bottom']( w , h )
	
			this.body.setAttribute('kctip-indicator-offset-x', (x - nx)+'px' )
			this.body.setAttribute('kctip-indicator-offset-y', (y - ny)+'px' )

			return pos
		},
		
		trigger_by_el: function(el){
			this.show(el)
		}
	}
	

	/* check element matches query selector */
		function elmatches(elm, selector) {
			var matches = (elm.document || elm.ownerDocument).querySelectorAll(selector),
				i = matches.length;
			while (--i >= 0 && matches.item(i) !== elm) ;
			return i > -1;
		}
	
	
	/* plain js */
	/* https://plainjs.com/ */
		function offset(el) {
			let rect = el.getBoundingClientRect(),
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
			scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
		}


	function KCTipMouseMoveHandler(e){
		_x = e.clientX
		_y = e.clientY
		if( !_isMoving ){
			requestAnimationFrame(KCTipMouseMove);
		}
		_isMoving = true
	}
	function KCTipMouseMove(){
		_isMoving = false
		let clientWidth = document.documentElement.clientWidth
			,clientHeight = document.documentElement.clientHeight
			,scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
			,scrollTop = window.pageYOffset || document.documentElement.scrollTop
			,x = _x + 10 + scrollLeft
			,y = _y + 25 + scrollTop
	
		// 超出X轴右边界
			if ((x + KCTip.w + 10) > clientWidth + scrollLeft )
				x = clientWidth + scrollLeft - KCTip.w - 10
	
		// 超出Y轴下边界
			if ((y + KCTip.h + 10) > clientHeight + scrollTop )
				y = clientHeight + scrollTop - KCTip.h - 10

		return KCTip.move(x,y)
	}


	/* delegate event */
		let querySelector = '[href^="http://fleet.diablohu.com/"], [kctip]'
			,eventTipshow = document.createEvent('Event')
			,eventTiphide = document.createEvent('Event')
		eventTipshow.initEvent('tipshow', true, true);
		eventTiphide.initEvent('tiphide', true, true);
		document.addEventListener("mouseover", function mouseoverKCTip(e) {
				if( !_preventMouseover ){
					for (var target=e.target; target && target!=this; target=target.parentNode) {
						if( elmatches(target, querySelector) ){
							return KCTip.show(target);
							break;
						}
					}
				}
			}, false);
		document.addEventListener("mouseout", function mouseoutKCTip(e) {
				for (var target=e.target; target && target!=this; target=target.parentNode) {
					if( elmatches(target, querySelector) ){
						return KCTip.hide();
						break;
					}
				}
			}, false);
		document.addEventListener("click", function clickKCTip(e) {
				for (var target=e.target; target && target!=this; target=target.parentNode) {
					if( elmatches(target, querySelector) ){
						return KCTip.hide(true);
						break;
					}
				}
			}, false);
		document.addEventListener("tipshow", function tipshowKCTip(e) {
				for (var target=e.target; target && target!=this; target=target.parentNode) {
					if( elmatches(target, querySelector) ){
						return KCTip.trigger_by_el(target);
						break;
					}
				}
			}, false);
		document.addEventListener("tiphide", function tiphideKCTip(e) {
				for (var target=e.target; target && target!=this; target=target.parentNode) {
					if( elmatches(target, querySelector) ){
						return KCTip.hide();
						break;
					}
				}
			}, false);
	
	return KCTip;
})();

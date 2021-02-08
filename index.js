class miniVue {
	constructor(options) {
		this.$options = options;
		this.$data = options.data;
    this.$el = options.el;
    // observer
    this.observer(this.$data);
    // compiler
    new miniCompiler(options.el, this);
    // lifecycle
		if (options.created) {
			options.created.call(this);
		}
	}
  
  // observer 监听数据变化
	observer(data) {
		if(!data || typeof data !== 'object'){
			return;
		}
		Object.keys(data).forEach(key => {
      this.observerSet(key, data, data[key]);
      // 把 data 挂载到 this 上
			this.proxyData(key);
		});
	}
	
	observerSet(key, obj, value){
    // 递归
		this.observer(value);
    const dep = new Dep();

		Object.defineProperty(obj, key, {
      // get 中收集依赖
			get() {
				Dep.target && dep.addDep(Dep.target);
				return value;
      },
      // set 中通知依赖更新
			set(newValue) {
				if (newValue === value) {
				  return;
				}
				value = newValue;
				// 通知变化
				dep.notify();
			}
		});
	}
	
	proxyData(key) {
		Object.defineProperty(this, key, {
			get() {
				return this.$data[key];
			},
			set(newVal) {
				this.$data[key] = newVal;
			}
		});
	}
	
}

// 依赖收集器
class Dep {
	constructor() {
		this.deps = [];
	}
	
	addDep(dep) {
		this.deps.push(dep);
	}
	
	notify() {
		this.deps.forEach(dep => {
			dep.update();
		})
	}
}

// 连接 observer 和 compiler
class Watcher {
	constructor(vm, key, initVal, cb){
		this.vm = vm;
		this.key = key;
		this.cb = cb;
		this.initVal = initVal;
		Dep.target = this;
		this.vm[this.key];
		Dep.target = null;
	}
	
	update() {
		this.cb.call(this.vm, this.vm[this.key], this.initVal);
	}
}

class miniCompiler{
	constructor(el, vm){
		this.$el = document.querySelector(el);
		
		this.$vm = vm;
		if (this.$el) {
			this.$fragment = this.getNodeChirdren( this.$el );
			this.compile( this.$fragment);
			this.$el.appendChild(this.$fragment);
		}
	}
	
	getNodeChirdren(el){
		const frag = document.createDocumentFragment();
		
		let child;
		while( (child = el.firstChild )){
			frag.appendChild( child );
		}
		return frag;
	}
	
	compile( el ){
		const childNodes = el.childNodes;
		Array.from(childNodes).forEach( node => {
			if( node.nodeType == 1 ) {//1为元素节点
				const nodeAttrs = node.attributes;
				Array.from(nodeAttrs).forEach( attr => {
					const attrName = attr.name;//属性名称
					const attrVal = attr.value;//属性值
					if( attrName.slice(0,2) === 'v-' ){
						var tagName = attrName.substring(2);
						switch( tagName ){
							case "model":
								this.zDir_model( node, attrVal );
							break;
							case "html":
								this.zDir_html( node, attrVal );
							break;
						}
					}
					if( attrName.slice(0,1) === '@'  ){
						var tagName = attrName.substring(1);
						this.zDir_click( node, attrVal );
					}
				})
			} else if( node.nodeType == 2 ){//2为属性节点
				console.log("nodeType=====22");
			} else if( node.nodeType == 3 ){//3为文本节点
				this.compileText( node );
			}
			
			// 递归子节点
			if (node.childNodes && node.childNodes.length > 0) {
				this.compile(node);
			}
		})
	}
	
	zDir_click(node, attrVal){
		var fn = this.$vm.$options.methods[attrVal];
		node.addEventListener( 'click', fn.bind(this.$vm));
	}
	
	zDir_model( node, value ){
		const vm = this.$vm;
		this.updaterAll( 'model', node, node.value );
		node.addEventListener("input", e => {
		  vm[value] = e.target.value;
		});
	}
	
	zDir_html( node, value ){
		this.updaterHtml( node, this.$vm[value] );
	}
	
	updaterHtml( node, value ){
		node.innerHTML = value;
	}
	
	compileText( node ){
		if( typeof( node.textContent ) !== 'string' ) {
			return "";
		}
		const reg = /({{(.*)}})/;
		const reg2 = /[^/{/}]+/;
		const key = String((node.textContent).match(reg)).match(reg2);//获取监听的key
		this.updaterAll( 'text', node, key );
	}
	
	updaterAll( type, node, key ) {
		switch( type ){
			case 'text':
				if( key ){
					const updater = this.updateText;
					const initVal = node.textContent;//记录原文本第一次的数据
					updater( node, this.$vm[key], initVal);
					new Watcher( this.$vm, key, initVal, function( value, initVal ){
						updater( node, value, initVal  );
					});
				}
				break;
			case 'model':
				const updater = this.updateModel;
				new Watcher( this.$vm, key, null, function( value, initVal ){
					updater( node, value );
				});
				break;
		}
	}

	updateModel( node, value ){
		node.value = value;
	}
	
	updateText( node, value, initVal ){
		var reg = /{{(.*)}}/ig;
		var replaceStr = String( initVal.match(reg) );
		var result = initVal.replace(replaceStr, value );
		node.textContent = result;
	}
	
}
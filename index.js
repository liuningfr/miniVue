class miniVue {
  constructor(options) {
    this.$options = options;
		this.$data = options.data;
    this.$el = options.el;

    this.observer(this.$data);
    new miniCompile(options.el, this);
    this.name = 'liuning';
  }

  // Observer
  observer(data) {
    if(!data || typeof(data) !== 'object'){
			return;
    }

    Object.keys(data).forEach(key => {
      this.observerSet(key, data, data[key]);
      // 把 data 下的数据挂载到 this 下
			this.proxyData(key);
		});
  }

  observerSet(key, data, value) {
    // 深层递归
    this.observer(value)
    const dep = new Dep();

    Object.defineProperty(data, key, {
      get() {
        Dep.target && dep.addDep(Dep.target);
        return value;
      },
      set(newValue) {
        if (newValue === value) {
				  return;
        }
        value = newValue;
        // 通知变化
        dep.notify();
      },
    });
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key];
      },
      set(newValue){
        this.$data[key] = newValue;
      }
    });
  }
}

class Dep {
  constructor() {
    this.deps = [];
  }
  // 添加依赖
  addDep(dep) {
    this.deps.push(dep);
  }
  // 通知变化
  notify(){
    this.deps.forEach(dep => {
      dep.update();
    })
  }
}

class Watcher{
	constructor(vm, key, initVal, cb) {
		this.vm = vm;
		this.key = key;
    this.cb = cb;
    this.initVal = initVal;
    Dep.target = this;
    // 触发 get
		this.vm[this.key];
		Dep.target = null;
	}
  
  // 更新视图
	update(){
		this.cb.call(this.vm, this.vm[this.key], this.initVal);
	}
}

class miniCompile {
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;

    if (this.$el) {
      this.$fragment = this.getNodeChirdren(this.$el);
			this.compile(this.$fragment);
			this.$el.appendChild(this.$fragment);
		}
  }

  getNodeChirdren(el){
		const frag = document.createDocumentFragment();
		
    let child;
		while(child = el.firstChild){
			frag.appendChild(child);
    }

		return frag;
  }
  
  compile(el) {
    const childNodes = el.childNodes;

    Array.from(childNodes).forEach(node => {
      if (node.nodeType === 1) {
        const nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach(attr => {
          const attrName = attr.name;
					const attrVal = attr.value;
          if ( attrName === 'v-model' ){
						this.handleModel(node, attrVal);
					}
        });
      } else if ( node.nodeType == 3 ) {
        this.compileText(node);
      }
    });
  }

  handleModel(node, value){
    const vm = this.$vm;

    new Watcher(this.$vm, node.value, null, (value) => {
      node.value = value;
    });

		node.addEventListener('input', e => {
		  vm[value] = e.target.value;
		});
  }
  
  compileText(node){
		if( typeof node.textContent !== 'string') {
			return '';
		}
		const reg = /({{(.*)}})/;
		const reg2 = /[^/{/}]+/;
    const key = String((node.textContent).match(reg)).match(reg2);
  
		if(key){
      const updater = this.updateText;
      const initVal = node.textContent;
      updater(node, this.$vm[key], initVal);
  
      new Watcher(this.$vm, key, (value, initVal) => {
        updater(node, value, initVal);
      });
    }
  }
  
  updateText( node, value, initVal ){
		var reg = /{{(.*)}}/ig;
		var replaceStr = String( initVal.match(reg) );
		var result = initVal.replace(replaceStr, value );
		node.textContent = result;
	}
}
class miniVue {
  constructor(options) {
    this.$options = options;
		this.$data = options.data;
    this.$el = options.el;

    this.observer(this.$data);
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
    Object.defineProperty(data, key, {
      get() {
        return value;
      },
      set(newValue) {
        if (newValue === value) {
				  return;
        }
        value = newValue;
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
  
  addDep(dep) {
    this.deps.push(dep);
  }
  
  notify(){
    this.deps.forEach(dep => {
      dep.update();
    })
  }
}
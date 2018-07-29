export default () => {
  return {
    onModel(model) {
      // do something
      if (!model.services) return;

      const reducers = {
        'created': 'onCreated',
        'patched': 'onPatched',
        'updated': 'onUpdated',
        'removed': 'onRemoved'
      };

      Object
        .keys(reducers)
        .forEach(eventName => {
          model.services.socket.on(eventName, data => {
            const reducerName = reducers[eventName];
            this.dispatch[model.name][reducerName](data);
          });
        })

    }
  }
}
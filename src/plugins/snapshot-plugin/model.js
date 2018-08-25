import Immutable from 'seamless-immutable';

const defaultState = {
  loading: true,
  synced: false,
  services: {}
};

const snapshots = {
  name: 'snapshots',
  state: new Immutable(defaultState),
  reducers: {
    addSnapshot(state, { name }) {
      return state.setIn(['services', name], {
        loading: true,
        synced: false,
        error: null
      });
    },

    setsynced(state, { name }) {
      const updatedState = state.setIn(['services', name], {
        loading: false,
        synced: true,
        error: null
      })

      const isAllSynced = Object.keys(updatedState.services).every(key => updatedState.services[key].synced);
      const isSomeLoading = Object.keys(updatedState.services).some(key => updatedState.services[key].loading);

      return updatedState.merge({
        synced: isAllSynced,
        loading: isSomeLoading
      });
    },
    
    setErrorOnSync(state, { name, error }) {
      const updatedState = state.setIn(['services', name], {
        loading: false,
        synced: false,
        error
      });

      const isSomeLoading = Object.keys(updatedState.services).some(key => updatedState.services[key].loading);

      return updatedState.merge({
        loading: isSomeLoading
      });
    }
  }
};

export default snapshots;

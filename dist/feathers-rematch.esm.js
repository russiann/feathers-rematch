import get from 'lodash/get';
import Immutable from 'seamless-immutable';
import Realtime from 'feathers-offline-realtime';

const translator = {
  'pending':  { loading: true,  saving: false, finished: false, error: false },
  'saving':   { loading: true,  saving: true,  finished: false, error: false },
  'finished': { loading: false, saving: false, finished: true,  error: false },
  'error':    { loading: false, saving: false, finished: true,  error: true },
};

const createStatusObject = (status) => translator[status];

const request = (state, { namespace, request, method, status }) => {
  const response = {
    [method]: {
      request,
      status: createStatusObject(status)
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

const response = (state, { namespace, result, method }) => {
  const response = {
    [method]: {
      result,
      status: createStatusObject('finished')
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

const error = (state, { namespace, error, method }) => {
  const response = {
    [method]: {
      error,
      status: createStatusObject('error')
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

const store = (state, { records, connected, last, publications }) => {
  return state
    .set('store', records)
    .set('publications', publications)
    .setIn(['meta', 'last'], last)
    .setIn(['meta', 'connected'], connected);
};

const isPaginatedResult = (result) => {
  if (!result) return false;
  const keys = Object.keys(result);
  return (
    keys.includes('limit') &&
    keys.includes('total')
  );
};

const updateRootFindResult = (state, payload, iteratee) => {
  const result = state.find.result;
  if (!result) return state;
  return isPaginatedResult(result)
    ? state.setIn(
      ['find', 'result', 'data'],
      iteratee(result.data, payload)
    )
    : state.setIn(
      ['find', 'result'],
      iteratee(result, payload)
    );
};

const updateNamespacesFindResults = (state, payload, iteratee) => {

  if (!state.namespaces) {
    return state;
  }

  const namespaces = Object.keys(state.namespaces);
  
  return namespaces
    .reduce((state, namespace) => {
      const result = get(state, `namespaces.${namespace}.find.result`);
      if (!result) return state;
      if (isPaginatedResult(result)) {
        return state.setIn(
          ['namespaces', namespace, 'find', 'result', 'data'],
          iteratee(result.data, payload)
        );
      } else {
        return state.setIn(
          ['namespaces', namespace, 'find', 'result'],
          iteratee(result, payload)
        );
      }
    }, state);
};

const onCreated = (state, payload) => {

  const updateResult = (list, item) => {
    const items = Array.isArray(list) ? list : [];
    return [].concat(items, item);
  };

  const tempState = updateRootFindResult(state, payload, updateResult);
  return updateNamespacesFindResults(tempState, payload, updateResult);
};

const onPatched = (state, payload) => {

  const updateResult = (list, patchedItem) => {
    const items = Array.isArray(list) ? list : [];
    return items.map(item =>
      (item._id === patchedItem._id)
        ? patchedItem
        : item
    );
  };

  const tempState = updateRootFindResult(state, payload, updateResult);
  return updateNamespacesFindResults(tempState, payload, updateResult);
};

const onPatched$1 = (state, payload) => {

  const updateResult = (list, patchedItem) => {
    const items = Array.isArray(list) ? list : [];
    return items.map(item =>
      (item._id === patchedItem._id)
        ? patchedItem
        : item
    );
  };

  const tempState = updateRootFindResult(state, payload, updateResult);
  return updateNamespacesFindResults(tempState, payload, updateResult);
};

const onRemoved = (state, payload) => {

  const updateResult = (list, patchedItem) => {
    const items = Array.isArray(list) ? list : [];
    return items.filter(item =>
      !(item._id === patchedItem._id)
    );
  };

  const tempState = updateRootFindResult(state, payload, updateResult);
  return updateNamespacesFindResults(tempState, payload, updateResult);
};

// core

const find = (dispatch, modelName, rest) =>
  async ({ params, namespace } = {}, rootState) => {
    const request = { params };
    dispatch[modelName].request({ method: 'find', namespace, request, status: 'pending' });

    try {
      const result = await rest.find(params);
      dispatch[modelName].response({ method: 'find', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'find', namespace, error });
      return error;
    }
  };

const get$1 = (dispatch, modelName, rest) =>
  async ({ id, params, namespace } = {}, rootState) => {
    const request = { id, params };
    dispatch[modelName].request({ method: 'get', namespace, request, status: 'pending' });

    try {
      const result = await rest.get(id, params);
      dispatch[modelName].response({ method: 'get', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'get', namespace, error });
      return error;
    }
  };

const create = (dispatch, modelName, rest) =>
  async ({ data, params, namespace } = {}, rootState) => {
    const request = { data };
    dispatch[modelName].request({ method: 'create', namespace, request, status: 'saving' });

    try {
      const result = await rest.create(data, params);
      dispatch[modelName].response({ method: 'create', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'create', namespace, error });
      return error;
    }
  };

const update = (dispatch, modelName, rest) =>
  async ({ id, data, params, namespace } = {}, rootState) => {
    const request = { id, data, params };
    dispatch[modelName].request({ method: 'update', namespace, request, status: 'saving' });

    try {
      const result = await rest.update(id, data, params);
      dispatch[modelName].response({ method: 'update', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'update', namespace, error });
      return error;
    }
  };

const patch = (dispatch, modelName, rest) =>
  async ({ id, data, params, namespace } = {}, rootState) => {
    const request = { id, data, params };
    dispatch[modelName].request({ method: 'patch', namespace, request, status: 'saving' });

    try {
      const result = await rest.patch(id, data, params);
      dispatch[modelName].response({ method: 'patch', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'patch', namespace, error });
      return error;
    }
  };

const remove = (dispatch, modelName, rest) =>
  async ({ id, params, namespace } = {}, rootState) => {
    const request = { id, params };
    dispatch[modelName].request({ method: 'remove', namespace, request, status: 'saving' });

    try {
      const result = await rest.remove(id, params);
      dispatch[modelName].response({ method: 'remove', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'remove', namespace, error });
      return error;
    }
  };

const defaultState = {
  find: {},
  get: {},
  create: {},
  update: {},
  patch: {},
  remove: {},
  publications: {},
  store: [],
  meta: {
    connected: false,
    last: null
  }
};

var createModel = ({ modelName, rest, socket, snapshot, clients, transport }) => {

  const model = {
    state: new Immutable(defaultState),
    services: { rest, socket },
    clients,
    transport,
    snapshot,
    reducers: {
      request,
      response,
      error,
      onCreated,
      onUpdated: onPatched$1,
      onPatched,
      onRemoved,
      store,
    },
    effects: (dispatch) => ({
      find:   find(dispatch, modelName, model.services[transport]),
      get:    get$1(dispatch, modelName, model.services[transport]),
      create: create(dispatch, modelName, model.services[transport]),
      update: update(dispatch, modelName, model.services[transport]),
      patch:  patch(dispatch, modelName, model.services[transport]),
      remove: remove(dispatch, modelName, model.services[transport])
    })
  };

  return model;
};

var realtimePlugin = () => {
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
        });

    }
  }
};

var snapshotPlugin = () => {
  return {
    onModel(model) {

      if (!model.snapshot) return;
      if (!model.services.socket && !model.clients.socket) {
        throw new Error('Snapshot Plugin: A socket client must be provided on initialization!')
      }

      const serviceRealtime = new Realtime(model.services.socket, model.snapshot);

      serviceRealtime.on('events', (records, last) => {
        let publications = {};

        if (model.snapshot.publications) {
          publications = Object
            .keys(model.snapshot.publications)
            .reduce((state, publicationName) => Object.assign(state, {
              [publicationName]: records.filter(model.snapshot.publications[publicationName])
            }), {});
        }

        this.dispatch[model.name].store({
          connected: serviceRealtime.connected,
          last, 
          records,
          publications
        });
      });

      const sync = (authData) => {
        const { verifier } = model.snapshot;
        if (verifier && !verifier(authData)) return false;
        
        serviceRealtime
          .connect()
          .then(() => {
            console.debug('%c' + `[${model.name}] snapshot syncronized.`.toUpperCase(), 'color: #2196F3');
          })
          .catch(err => {
            console.debug('%c' + `[${model.name}] snapshot failed.`.toUpperCase(), 'color: #ff0000');
            console.error(err);
          });
      };

      if (model.snapshot.authenticated) {
        // if transport is socket
        if (model.transport === 'socket') {
          return model.clients.socket.on('authenticated', sync);
        }
        // if transport is rest
        model.clients.rest.on('authenticated', ({ accessToken }) => {
          model.clients.socket.authenticate({ strategy: 'jwt', accessToken }).then(sync);
        });
      } else {
        sync();
      }

    }
  }
};

var authPlugin = ({ socket }) => {
  return {
    onStoreCreated(store) {
      
      const accessToken = localStorage["feathers-jwt"];
      if (!accessToken) return;

      const auth = { strategy: 'jwt', accessToken };

      const initAuthentication = () =>
        store.dispatch.authentication.authenticate(auth)
          .then(authData => console.debug('authOnInit: authenticated', authData))
          .catch(err => console.error('authOnInit: authentication failed', err));

      socket
        ? socket.io.engine.on('upgrade', initAuthentication)
        : initAuthentication();

    }
  }
};

const defaultState$1 = {
  error: null,
  loading: null,
  signedIn: false,
  user: null,
  token: null
};

var createAuthModel = ({ rest, socket, transport = 'socket' }) => {

  const model = {
    state: new Immutable(defaultState$1),
    clients: { rest, socket },
    reducers: {
      finished(state, { accessToken, user}) {
        return state.merge({
          loading: false,
          signedIn: true,
          token: accessToken,
          user
        });
      },
      loading(state) {
        return state.merge({loading: true});
      },
      error(state, payload) {
        return state.merge({
          loading: false,
          error: payload
        });
      },
    },
    effects: (dispatch) => ({
      async authenticate(payload) {
        const client = model.clients[transport];

        dispatch.authentication.loading();
        try {
          const authData = await client.authenticate(payload);  
          dispatch.authentication.finished(authData);
          return authData;
        } catch (error) {
          dispatch.authentication.error(error);
        }
      },
      async logout(payload, rootState) {
        return await socket.logout(payload);
      },
    })
  };

  return model;
};

const init = ({ restClient, socketClient, transport, socket, services, authentication }) => {

  const models = services.reduce((obj, service) => {
    
    const config = {
      modelName: service.name,
      rest: restClient.service(service.path),
      socket: socketClient.service(service.path),
      snapshot: service.snapshot,
      clients: { socket: socketClient, rest: restClient },
      transport
    };

    const model = createModel(config);

    return Object.assign(obj, {
      [service.name]: model
    })
  }, {});

  /**
  |--------------------------------------------------
  | Authentication
  |--------------------------------------------------
  */

  if (authentication) {
    models['authentication'] = createAuthModel({
      socket: socketClient,
      rest: restClient,
      transport: authentication.transport
    });
  }
  return { models };
};

export { init, realtimePlugin as realtime, snapshotPlugin as snapshot, authPlugin as auth };

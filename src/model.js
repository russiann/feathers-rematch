import Immutable from 'seamless-immutable';
import { request, response, error, store, onCreated, onPatched, onRemoved, onUpdated } from './reducers/index.js';
import { find, get, create, update, patch, remove } from './effects/index.js';

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

export default ({ modelName, rest, socket, snapshot, clients, transport }) => {

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
      onUpdated,
      onPatched,
      onRemoved,
      store,
    },
    effects: (dispatch) => ({
      find:   find(dispatch, modelName, model.services[transport]),
      get:    get(dispatch, modelName, model.services[transport]),
      create: create(dispatch, modelName, model.services[transport]),
      update: update(dispatch, modelName, model.services[transport]),
      patch:  patch(dispatch, modelName, model.services[transport]),
      remove: remove(dispatch, modelName, model.services[transport])
    })
  };

  return model;
};

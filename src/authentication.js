import Immutable from 'seamless-immutable';

const defaultState = {
  error: null,
  loading: null,
  signedIn: false,
  user: null,
  token: null
};

export default ({ rest, socket, transport = 'socket' }) => {

  const model = {
    state: new Immutable(defaultState),
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

export default ({ socket }) => {
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
}
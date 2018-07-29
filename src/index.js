import createModel from './model';
import realtime from './plugins/realtime-plugin';
import snapshot from './plugins/snapshot-plugin';
import auth from './plugins/auth-plugin';
import createAuthModel from './authentication';

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
  };

  return { models };
};

export { init, realtime, snapshot, auth };

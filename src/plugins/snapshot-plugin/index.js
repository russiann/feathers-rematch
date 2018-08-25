import Realtime from 'feathers-offline-realtime';
import model from './model';

export const snapshotModel = model;

export const snapshotPlugin = () => {
  return {
    onModel(model) {

      if (!model.snapshot) return;
      if (!model.services.socket && !model.clients.socket) {
        return console.error('Snapshot Plugin: A socket client must be provided on initialization!');
      }

      const serviceRealtime = new Realtime(model.services.socket, model.snapshot);

      serviceRealtime.on('events', (records, last) => {
        let publications = {};

        if (model.snapshot.publications) {
          publications = Object
            .keys(model.snapshot.publications)
            .reduce((state, publicationName) => Object.assign(state, {
              [publicationName]: records.filter(model.snapshot.publications[publicationName])
            }), {})
        }

        this.dispatch[model.name].store({
          connected: serviceRealtime.connected,
          last, 
          records,
          publications
        });
      });

      const sync = (authData) => {
        console.log('addSnapshot')
        this.dispatch.snapshots.addSnapshot({ name: model.name });
        const { verifier } = model.snapshot;
        if (verifier && !verifier(authData)) return false;
        
        serviceRealtime
          .connect()
          .then(() => {
            this.dispatch.snapshots.setsynced({ name: model.name });
            console.debug('%c' + `[${model.name}] snapshot syncronized.`.toUpperCase(), 'color: #2196F3');
          })
          .catch(error => {
            this.dispatch.snapshots.setErrorOnSync({ name: model.name, error });
            console.debug('%c' + `[${model.name}] snapshot failed.`.toUpperCase(), 'color: #ff0000');
            console.error(error);
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
        setTimeout(() => {
          sync();
          
        }, 1);
      }

    }
  }
}
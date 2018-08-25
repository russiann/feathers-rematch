# Feathers Rematch
> Integrate Feathers with Rematch


## Installation

#### yarn
```sh
yarn add feathers-rematch
```
#### npm
```sh
npm install feathers-rematch --save
```

## Usage

On server:

```js
app.use('/users', ...);
app.use('/messages', ...);
```
On client

```js
// services.config.js
const services = [
  {
    name: 'users',
    path: '/users'
  },
  {
    name: 'messages',
    path: '/messages'
  },
];

export default services;
```

```js
// feathers.config.js
import feathers from '@feathersjs/feathers';
import rest from '@feathersjs/rest-client';
import axios from 'axios';
import { init } from 'feathers-rematch';
import services from './services.config';

const endpoint = 'http://localhost:3030';

const restClient = feathers()
  .configure(rest(endpoint).axios(axios))

const { models } = init({
  transport: 'rest',
  restClient,
  services
});

export { models };
```

```js
// store.config.js
import { init } from '@rematch/core'
import { models as feathersModels} from './feathers.config';

const store = init({
  models: {
    ...feathersModels
  }
});


store.dispatch.messages.find({ params: {}})
store.dispatch.messages.get({ id: 1, params: {} })
store.dispatch.messages.create({ data: {} })
store.dispatch.messages.put({ params: {} })
store.dispatch.messages.patch({ params: {} })
store.dispatch.messages.remove({ params: {}})

```

## Real-Time
TO DO

## Snapshots
TO DO

## Contributing
TO DO

1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

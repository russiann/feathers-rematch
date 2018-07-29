import get from 'lodash/get';
import isPaginatedResult from '../is-paginated-result';

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

export default updateNamespacesFindResults;

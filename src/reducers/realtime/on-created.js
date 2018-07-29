import updateRootFindResult from '../../helpers/realtime/update-root-find-result';
import updateNamespacesFindResults from '../../helpers/realtime/update-namespaces-find-results';

const onCreated = (state, payload) => {

  const updateResult = (list, item) => {
    const items = Array.isArray(list) ? list : [];
    return [...items, item];
  };

  const tempState = updateRootFindResult(state, payload, updateResult);
  return updateNamespacesFindResults(tempState, payload, updateResult);
};

export default onCreated;

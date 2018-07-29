import updateRootFindResult from '../../helpers/realtime/update-root-find-result';
import updateNamespacesFindResults from '../../helpers/realtime/update-namespaces-find-results';

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

export default onRemoved;

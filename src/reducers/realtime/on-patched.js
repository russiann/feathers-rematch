import updateRootFindResult from '../../helpers/realtime/update-root-find-result';
import updateNamespacesFindResults from '../../helpers/realtime/update-namespaces-find-results';

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

export default onPatched;

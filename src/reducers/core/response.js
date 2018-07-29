import createStatusObject from '../../helpers/create-status-object';

const response = (state, { namespace, result, method }) => {
  const response = {
    [method]: {
      result,
      status: createStatusObject('finished')
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

export default response;
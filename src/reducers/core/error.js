import createStatusObject from '../../helpers/create-status-object';

const error = (state, { namespace, error, method }) => {
  const response = {
    [method]: {
      error,
      status: createStatusObject('error')
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

export default error;

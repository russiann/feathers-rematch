import createStatusObject from '../../helpers/create-status-object';

const request = (state, { namespace, request, method, status }) => {
  const response = {
    [method]: {
      request,
      status: createStatusObject(status)
    }
  };
  return namespace
    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
    : state.merge(response, { deep: true });
};

export default request;
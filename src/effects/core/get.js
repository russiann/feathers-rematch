const get = (dispatch, modelName, rest) =>
  async ({ id, params, namespace } = {}, rootState) => {
    const request = { id, params };
    dispatch[modelName].request({ method: 'get', namespace, request, status: 'pending' });

    try {
      const result = await rest.get(id, params);
      dispatch[modelName].response({ method: 'get', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'get', namespace, error });
      return error;
    }
  };

export default get;

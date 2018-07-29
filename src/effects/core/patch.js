const patch = (dispatch, modelName, rest) =>
  async ({ id, data, params, namespace } = {}, rootState) => {
    const request = { id, data, params };
    dispatch[modelName].request({ method: 'patch', namespace, request, status: 'saving' });

    try {
      const result = await rest.patch(id, data, params);
      dispatch[modelName].response({ method: 'patch', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'patch', namespace, error });
      return error;
    }
  };

export default patch;

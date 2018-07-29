const update = (dispatch, modelName, rest) =>
  async ({ id, data, params, namespace } = {}, rootState) => {
    const request = { id, data, params };
    dispatch[modelName].request({ method: 'update', namespace, request, status: 'saving' });

    try {
      const result = await rest.update(id, data, params);
      dispatch[modelName].response({ method: 'update', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'update', namespace, error });
      return error;
    }
  };

export default update;

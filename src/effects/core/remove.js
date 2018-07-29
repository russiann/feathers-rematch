const remove = (dispatch, modelName, rest) =>
  async ({ id, params, namespace } = {}, rootState) => {
    const request = { id, params };
    dispatch[modelName].request({ method: 'remove', namespace, request, status: 'saving' });

    try {
      const result = await rest.remove(id, params);
      dispatch[modelName].response({ method: 'remove', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'remove', namespace, error });
      return error;
    }
  };

export default remove;

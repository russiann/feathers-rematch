const create = (dispatch, modelName, rest) =>
  async ({ data, params, namespace } = {}, rootState) => {
    const request = { data };
    dispatch[modelName].request({ method: 'create', namespace, request, status: 'saving' });

    try {
      const result = await rest.create(data, params);
      dispatch[modelName].response({ method: 'create', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'create', namespace, error });
      return error;
    }
  };

export default create;

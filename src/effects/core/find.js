const find = (dispatch, modelName, rest) =>
  async ({ params, namespace } = {}, rootState) => {
    const request = { params };
    dispatch[modelName].request({ method: 'find', namespace, request, status: 'pending' });

    try {
      const result = await rest.find(params);
      dispatch[modelName].response({ method: 'find', namespace, result });
      return result;
    } catch (error) {
      dispatch[modelName].error({ method: 'find', namespace, error });
      return error;
    }
  };

export default find;

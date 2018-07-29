import isPaginatedResult from '../is-paginated-result';

const updateRootFindResult = (state, payload, iteratee) => {
  const result = state.find.result;
  if (!result) return state;
  return isPaginatedResult(result)
    ? state.setIn(
      ['find', 'result', 'data'],
      iteratee(result.data, payload)
    )
    : state.setIn(
      ['find', 'result'],
      iteratee(result, payload)
    );
};

export default updateRootFindResult;

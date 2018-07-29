const store = (state, { records, connected, last, publications }) => {
  return state
    .set('store', records)
    .set('publications', publications)
    .setIn(['meta', 'last'], last)
    .setIn(['meta', 'connected'], connected);
};

export default store;

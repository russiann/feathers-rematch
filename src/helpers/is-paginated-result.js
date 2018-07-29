const isPaginatedResult = (result) => {
  if (!result) return false;
  const keys = Object.keys(result);
  return (
    keys.includes('limit') &&
    keys.includes('total')
  );
};

export default isPaginatedResult;

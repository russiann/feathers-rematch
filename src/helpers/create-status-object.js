const translator = {
  'pending':  { loading: true,  saving: false, finished: false, error: false },
  'saving':   { loading: true,  saving: true,  finished: false, error: false },
  'finished': { loading: false, saving: false, finished: true,  error: false },
  'error':    { loading: false, saving: false, finished: true,  error: true },
};

const createStatusObject = (status) => translator[status];

export default createStatusObject;
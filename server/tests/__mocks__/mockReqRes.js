function mockRequest({ body = {}, params = {}, headers = {}, user = {} } = {}) {
  return {
    body,
    params,
    headers,
    user,
  };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

module.exports = {
  mockRequest,
  mockResponse,
};
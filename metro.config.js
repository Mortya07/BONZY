const { getDefaultConfig } = require("expo/metro-config");
const { createStaffApi } = require("./server/staff.cjs");
const config = getDefaultConfig(__dirname);
const enhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const fallback = enhance ? enhance(middleware, server) : middleware;
  const api = createStaffApi(process.env.BONZY_STAFF_DB);
  return (req, res, next) => api(req, res, () => fallback(req, res, next));
};
module.exports = config;

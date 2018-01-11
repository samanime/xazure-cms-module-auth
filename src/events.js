import { findModule } from 'xazure-cms-utils';
import User from './models/User';
import { Schema } from "mongoose";

export const MODEL_USER = 'User';

export default ({ config: { modules, security: { paths } }, module: { path }, eventManager, mongoose }) => ({
  init: async previous => {
    const { name, model } = await eventManager.apply('createModel', { model: Object.assign({}, User), name: MODEL_USER });
    mongoose.model(name, new Schema(model, {
      toObject: {
        transform: (doc, ret) => {
          delete ret.__v;
        }
      }
    }));
  },
  getUser: Object.assign(
    async previous => {
      const args = await previous;
      const { userId, user, req: { session: { userId: _id } = {} } = {} } = args;
      const mongoUser = await (_id ? mongoose.model(MODEL_USER).findOne({ _id: userId || _id })
        : Promise.resolve(null));

      return Object.assign(args,
        { user: (mongoUser || user) && Object.assign(mongoUser || {}, user, mongoUser ? mongoUser.toObject() : {}) });
    }, { priority: 0 }),
  getUsers: Object.assign(
    async previous => {
      const args = await previous;
      const { role } = args;
      const users = await mongoose.model(MODEL_USER).find(Object.assign({}, role && { roles: role }));
      return Object.assign(args, { users });
    }, { priority: 0 }),
  getAdminNavItems: Object.assign(async previous => {
    const args = await previous;
    const { navItems = [], req } = args;

    return Object.assign(args, { navItems: navItems.concat(
        findModule(modules, 'admin') && { display: 'Logout', url: `${path}/logout`.replace(/\/+/g, '/') }
    )});
  }, { priority: 9999 }),
  allowed: async previous => {
      const args = await previous;
      const { req, allowed: defaultAllowed } = args;
      const { url, method } = req;
      const { user } = await eventManager.apply('getUser', { req });
      const path = paths.find(({path, methods}) =>
        new RegExp(`^${path}`).test(url) && (!methods || methods.includes(method)));
      const { denyAll, allowAll, requiredRoles = [] } = path || {};

      let allowed = defaultAllowed;

      if (!path || denyAll || (!user && requiredRoles.length > 0)) {
        allowed = false;
      } else if (allowAll || (user && user.roles.find(role => requiredRoles.includes(role)))) {
        allowed = true;
      }

      return Promise.resolve(Object.assign(args, { allowed }));
    }
});
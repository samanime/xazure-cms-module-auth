import { Router } from 'express';
import { join } from 'path';
import { MODEL_USER } from './events';

export default ({ module: { normalApiPath }, a, mongoose }) =>
  Router()
    .get('/login', (req, res) => res.sendFile(join(__dirname, 'public/index.html')))
    .get('/logout', (req, res) => {
      req.session.userId = null;
      res.redirect('/')
    })
    .post('/login', (req, res) => {
      mongoose.model(MODEL_USER).findOne({ username: req.body.username, password: req.body.password })
        .then(user => {
          if (user) {
            req.session.userId = user._id;
            res.redirect(req.body.redirect);
          } else {
            res.redirect('back');
          }
        });
    })
    .get('/register', (req, res) => res.sendFile(join(__dirname, 'public/register.html')))
    .post('/register', (req, res) => {
      new mongoose.model(MODEL_USER)({
        email: req.body.email,
        password: req.body.password,
        salt: null,
        roles: ['admin']
      }).save();
      res.redirect('/');
    })
    .get(`${normalApiPath}/user/:id?`, async (req, res) => {
      const userId = req.params.id || req.session.userId;
      const user = userId && (await a('getUser', { userId: req.session.userId, req })).user;
      user ? res.send(user) : res.status(404).end();
    })
    .get(`${normalApiPath}/users/:role?`, async (req, res) => {
      res.send((await a('getUsers', { role: req.params.role })).users);
    });
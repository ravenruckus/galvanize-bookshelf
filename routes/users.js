// 'use strict';
//
// const bcrypt = require('bcrypt-as-promised');
// const express = require('express');
// const knex = require('../knex');
// const { camelizeKeys, decamelizeKeys } = require('humps');
//
//
// // eslint-disable-next-line new-cap
// const router = express.Router();
//
// router.post('/users', (req, res, next) => {
//   // const { email, password } = req.body;
//
//   // if (!email || !email.trim()){
//   //   return next(boom.create(400, 'Email must not be blank'));
//   // }
//   //
//   // if (!password || password.length < 8) {
//   //   return next(boom.create(
//   //     400,
//   //     'Password must be at least 8 characters long'
//   //   ));
//   // }
// //if inside a handler for then and return a promise then can chain a then on the outside and catch.
// //return gets you to the next then and throw gets you to the next catch
//   // knex('users')
//   //   .where('email', email)
//   //   .first()
//   //   .then(user) => {
//   //     if (user) {
//   //       throw boom.create(400, 'Email already exists');
//   //     }
//   //     return bcrypt.hash(password, 12);
//   //   })
//
//   bcrypt.hash(req.body.password, 12)
//     .then((hashed_password) => {
//       return knex('users')
//         .insert({
//           first_name: req.body.firstName,
//           last_name: req.body.lastName,
//           email: req.body.email,
//           hashed_password: hashed_password
//         }, '*');
//     })
//     .then((users) => {
//       const user = camelizeKeys(users[0]);
//       delete user.hashedPassword;
//       res.send(user);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });
//
// module.exports = router;
'use strict';

const bcrypt = require('bcrypt-as-promised');
const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/users', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }

  if (!password || password.length < 8) {
    return next(boom.create(
      400,
      'Password must be at least 8 characters long'
    ));
  }

  knex('users')
    .where('email', email)
    .first()
    .then((user) => {
      if (user) {
        throw boom.create(400, 'Email already exists');
      }

      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      const { firstName, lastName } = req.body;
      const insertUser = { firstName, lastName, email, hashedPassword };

      return knex('users').insert(decamelizeKeys(insertUser), '*');
    })
    .then((rows) => {
      const user = camelizeKeys(rows[0]);

      const claim = { userId: user.id };
      const token = jwt.sign(claim, process.env.JWT_KEY, {
        expiresIn: '7 days'
      });

      res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000),
        secure: router.get('env') === 'production'
      });

      delete user.hashedPassword;

      res.send(user);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;

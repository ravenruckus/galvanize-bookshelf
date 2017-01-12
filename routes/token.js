'use strict';

const boom = require('boom');
const bcrypt = require('bcrypt-as-promised');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/token', (req, res) => {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, _payload) => {
    if (err) {
      return res.send(false);
    }

    res.send(true);
  });
});

router.post('/token', (req, res, next) => {
  let user;

  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }
  if (!password || !password.trim()) {
    return next(boom.create(400, 'Password must not be blank'));
  }

  knex('users')
    .where('email', email)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(400, 'Bad email or password');
      }

      user = camelizeKeys(row);

      return bcrypt.compare(password, user.hashedPassword);
    })
    .then(() => {
      const claim = { userId: user.id };
      const token = jwt.sign(claim, process.env.JWT_KEY, {
        expiresIn: '7 days' // Adds exp field to the payload
      });

      res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        secure: router.get('env') === 'production' // set from the NODE_ENV coms from express
      });

      delete user.hashedPassword;

      res.send(user);
    })

    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(400, 'Bad email or password');
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/token', (req, res) => {
  res.clearCookie('token');
  res.end();
});

module.exports = router;

// 'use strict';
//
// const bcrypt = require('bcrypt-as-promised');
// const boom = require('boom');
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const knex = require('../knex');
// const { camelizeKeys } = require('humps');
//
// // eslint-disable-next-line new-cap
// const router = express.Router();
//
// router.get('/token', (req, res) => {
//   jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, _payload) => {
//     if (err) {
//       return res.send(false);
//     }
//
//     res.send(true);
//   });
// });
//
// router.post('/token', (req, res, next) => {
//   const { email, password } = req.body;
//
//   if (!email || !email.trim()) {
//     return next(boom.create(400, 'Email must not be blank'));
//   }
//
//   if (!password || password.length < 8) {
//     return next(boom.create(400, 'Password must not be blank'));
//   }
//
//   let user;
//
//   knex('users')
//     .where('email', email)
//     .first()
//     .then((row) => {
//       if (!row) {
//         throw boom.create(400, 'Bad email or password');
//       }
//
//       user = camelizeKeys(row);
//
//       return bcrypt.compare(password, user.hashedPassword);
//     })
//     .then(() => {
//       const claim = { userId: user.id };
//       const token = jwt.sign(claim, process.env.JWT_KEY, {
//         expiresIn: '7 days'
//       });
//
//       res.cookie('token', token, {
//         httpOnly: true,
//         expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),  // 7 days
//         secure: router.get('env') === 'production'
//       });
//
//       delete user.hashedPassword;
//
//       res.send(user);
//     })
//     .catch(bcrypt.MISMATCH_ERROR, () => {
//       throw boom.create(400, 'Bad email or password');
//     })
//     .catch((err) => {
//       next(err);
//     });
// });
//
// router.delete('/token', (req, res) => {
//   res.clearCookie('token');
//   res.end();
// });
//
// module.exports = router;

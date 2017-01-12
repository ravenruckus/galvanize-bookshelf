// 'use strict';
//
// const boom = require('boom');
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const knex = require('../knex');
// const { camelizeKeys } = require('humps');
//
// // eslint-disable-next-line new-cap
// const router = express.Router();
//
// const authorize = function(req, res, next) {
//   jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, payload) => {
//     if (err) {
//       return next(boom.create(401, 'Unauthorized'));
//     }
//
//     req.claim = payload;
//
//     next();
//   });
// };
//
// router.get('/favorites', authorize, (req, res, next) => {
//   knex('favorites')
//     .innerJoin('books', 'books.id', 'favorites.book_id')
//     .where('favorites.user_id', req.claim.userId)
//     .orderBy('books.title', 'ASC')
//     .then((rows) => {
//       const favorites = camelizeKeys(rows);
//
//       res.send(favorites);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });
//
// router.get('/favorites/check', authorize, (req, res, next) => {
//   const bookId = Number.parseInt(req.query.bookId);
//
//   If (!Number.isInteger(bookId)) {
//     return next(boom.create(400, 'Book ID must be an integer'));
//   }
//
//   knex('books')
//     .innerJoin('favorites', 'favorites.book_id', 'book.id')
//     .where ({
//       .'favorites.book_id': bookId,
//       .'favorites.user_id': req.claim.userId
//     })
//     .first()
//     .then((row) => {
//       if (row) {
//         return res.send(true);
//       }
//
//       res.send(false);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });
//
// router.post('/favorites', authorize, (req, res, next) => {
//   const bookId = Number.pasreInt(req.body.bookId);
//
//   if (!Number.isInteger(bookId) {
//     return next
//   }
//   knex('books')
//     .where('id', bookId)
//     .fist()
//     .then((book) => {
//       if (!book) {
//         throw boom.create(404, 'Book not found');
//       }
//
//       const insertFavorite = { bookId, userId: req.claim.userId };
//
//       return knex('favorites')
//         .insert(decamelizeKeys(isnertFavorites), '*');
//     })
//     .then((rows) => {
//       const favorite = camelizeKeys(row[0]);
//
//       res.send(favorites);
//     })
//     .catch((err) => {
//       res.send(favortie);
//     })
//     .catch((err) => {
//       next(err);
//     });
// });

'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, playload) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.claim = playload; // { userId: ... }

    next();
  });
};

router.get('/favorites', authorize, (req, res, next) => {
  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', req.claim.userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favs = camelizeKeys(rows);

      res.send(favs);
    })
    .catch((err) => {
      next(err);
    });
});

//'/favorites/check?bookId=1'
router.get('/favorites/check', authorize, (req, res, next) => {
  const bookId = Number.parseInt(req.query.bookId);

  if (!Number.isInteger(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('books')
    .innerJoin('favorites', 'favorites.book_id', 'books.id')
    .where({
      'favorites.book_id': bookId,
      'favorites.user_id': req.claim.userId
    })
    .first()
    .then((row) => {
      if (row) {
        return res.send(true);
      }

      res.send(false);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites', authorize, (req, res, next) => {
  const bookId = Number.parseInt(req.body.bookId);

  if (!Number.isInteger(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('books')
    .where('id', bookId)
    .first()
    .then((book) => {
      if (!book) {
        throw boom.create(404, 'Book not found');
      }

      const insertFavorite = { bookId, userId: req.claim.userId };

      return knex('favorites')
        .insert(decamelizeKeys(insertFavorite), '*');
    })
    .then((rows) => {
      const favorite = camelizeKeys(rows[0]);

      res.send(favorite);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/favorites', authorize, (req, res, next) => {
  const bookId = Number.parseInt(req.body.bookId);

  if (!Number.isInteger(bookId)) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  // eslint-disable-next-line camelcase
  const clause = { book_id: bookId, user_id: req.claim.userId };

  let favorite;

  knex('favorites')
    .where(clause)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Favorite not found');
      }

      favorite = camelizeKeys(row);

      return knex('favorites')
        .del()
        .where('id', favorite.id);
    })
    .then(() => {
      delete favorite.id;

      res.send(favorite);
    })
    .catch((err) => {
      next(err);
    });
});


module.exports = router;

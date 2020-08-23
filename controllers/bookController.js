const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const validator = require('express-validator');
const async = require('async');

exports.index = (req, res, next) => {
  async.parallel({
    book_count: callback => {
      Book.countDocuments({}, callback);
    },
    book_instance_count: callback => {
      BookInstance.countDocuments({}, callback);
    },
    book_instance_available_count: callback => {
      BookInstance.countDocuments({status: 'Available'}, callback);
    },
    author_count: callback => {
      Author.countDocuments({}, callback);
    },
    genre_count: callback => {
      Genre.countDocuments({}, callback);
    }
  }, (err, results) => {
    res.render('index', {title: 'Express Library Home', error: err, data: results});
  });
};

// Display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, 'title author')
    .populate('author')
    .exec((err, list_books) => {
      if (err) return next(err);
      res.render('book_list', {title: 'Book List', book_list: list_books});
    });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel({
    book: callback => {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instance: callback => {
      BookInstance.find({'book': req.params.id})
      .exec(callback);
    }
  }, (err, results) => {
    if (err) return next(err);
    if (results.book === null) {
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    res.render('book_detail', {title: results.book.title, book: results.book, book_instances: results.book_instance});
  });
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  async.parallel({
    authors: callback => {Author.find(callback);},
    genres: callback => {Genre.find(callback);}
  }, (err, results) => {
    if (err) return next(err);
    res.render('book_form', {title: 'Add Book', authors: results.authors, genres: results.genres});
  });
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert genre to array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  }, 

  // Validate fields
  validator.body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
  validator.body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
  validator.body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
  validator.body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

  // Sanitize fields using wildcard
  validator.sanitizeBody('*').escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    //Extract validation errors from req
    const errors = validator.validationResult(req);

    // Create book object with clean data
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });

    if (!errors.isEmpty()) {
      // Errors exist. Rerender with sanitized values and error messages
      // Get all authors and genres
      async.parallel({
        authors: callback => {Author.find(callback);},
        genres: callback => {Genre.find(callback);}
      }, (err, results) => {
        if (err) return next(err);

        // Mark selected genres as checked
        for (let i = 0; i < results.genres.length; ++i) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked = 'true';
          }
        }
        res.render('book_form', {title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array()});
      });
      return;
    }
    else {
      // Data from form is valid
      book.save(err => {
        if (err) return next(err);
        res.redirect(book.url);
      });
    }
  }
];

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  // Get books, authors, and genres for form
  async.parallel({
    book: callback => {Book.findById(req.params.id).populate('author').populate('genre').exec(callback)},
    authors: callback => {Author.find(callback)},
    genres: callback => {Genre.find(callback)}
  }, (err, results) => {
    if (err) return next(err);
    if (results.book == null) {
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    // Success
    // Mark selected genres as checked
    for (let all_g_iter = 0; all_g_iter < results.genres.length; ++all_g_iter) {
      for (let book_g_iter = 0; book_g_iter < results.book.genre.length; ++book_g_iter) {
        if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
          results.genres[all_g_iter].checked = 'true';
        }
      }
    }
    res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
  });
};

// Handle book update on POST.
exports.book_update_post = [
  //Convert genre to array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate fields.
  validator.body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
  validator.body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
  validator.body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
  validator.body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

  // Sanitize fields.
  validator.sanitizeBody('title').escape(),
  validator.sanitizeBody('author').escape(),
  validator.sanitizeBody('summary').escape(),
  validator.sanitizeBody('isbn').escape(),
  validator.sanitizeBody('genre.*').escape(),

  // Process request
  (req, res, next) => {
    const errors = validator.validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
      _id:req.params.id //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      async.parallel({
        authors: callback => {Author.find(callback)},
        genres: callback => {Genre.find(callback)}
      }, (err, results) => {
        if (err) return next(err);
        // Mark selected genres as checked
        for (let i = 0; i < results.genres.length; ++i) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked = 'true';
          }
        }
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
      });
      return;
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, (err, thisBook) => {
        if (err) return next(err);
        res.redirect(thisBook.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
  async.parallel({
    book: callback => {Book.findById(req.params.id).populate('author').populate('genre').exec(callback)},
    book_instances: callback => {BookInstance.find({'book': req.params.id}).exec(callback)}
  }, (err, results) => {
    if (err) return next(err);
    if (results.book == null) res.redirect('/catalog/books');
    res.render('book_delete', {title: 'Delete Book', book: results.book, book_instances: results.book_instances});
  });
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  async.parallel({
    book: callback => {Book.findById(req.body.id).populate('author').populate('genre').exec(callback)},
    book_instances: callback => {BookInstance.find({'book': req.body.id}).exec(callback)}
  }, (err, results) => {
    if (err) return next(err);
    if (results.book_instances.length > 0) {
      res.render('book_delete', {title: 'Delete Book', book: results.book, book_instances: results.book_instances});
      return;
    } else {
      Book.findByIdAndRemove(req.body.id, err => {
        if (err) return next(err);
        res.redirect('/catalog/books');
      });
    }
  });
};

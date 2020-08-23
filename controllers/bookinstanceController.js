const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const validator = require('express-validator');
const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) return next(err);
      res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) return next(err);
      if (bookinstance == null) {
        const err = new Error('Book copy not found.');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', {title: 'Copy: '+ bookinstance.book.title, bookinstance: bookinstance});
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, 'title')
    .exec((err, books) => {
      if (err) return next(err);
      res.render('bookinstance_form', {title: 'Add Book Instance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields.
  validator.body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  validator.body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').trim().escape(),
  validator.sanitizeBody('due_back').toDate(),

  // Process req after validation/sanitization
  (req, res, next) => {
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) return next(err);
          res.render('bookinstance_form', {title: 'Add Book Instance', book_list: books, selected_book: bookinstance.book_id, errors: errors.array(), bookinstance: bookinstance});
        });
        return;
    } else {
      // form data valid
      bookinstance.save(err => {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) return next(err);
      if (bookinstance == null) res.redirect('/catalog/bookinstances');
      res.render('bookinstance_delete', {title: 'Delete Book Instance', bookinstance: bookinstance});
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndRemove(req.body.id, err => {
    if (err) return next(err);
    res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel({
    bookinstance: callback => {BookInstance.findById(req.params.id).populate('book').exec(callback)},
    books: callback => {Book.find(callback)} 
  }, (err, results) => {
    if (err) return next(err);
    if (results.bookinstance == null) {
      const err = new Error('Book instance not found');
      err.status = 404;
      return next(err);
    }
    res.render('bookinstance_form', {title: 'Update Book Instance', book_list: results.books, selected_book: results.bookinstance.book._id, bookinstance:results.bookinstance});
  });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate
  validator.body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
  validator.body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize
  validator.sanitizeBody('book').escape(),
  validator.sanitizeBody('imprint').escape(),
  validator.sanitizeBody('status').escape(),
  validator.sanitizeBody('due_back').toDate(),

  // Handle
  (req, res, next) => {
    const errors = validator.validationResult(req);
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) return next(err);
          res.render('bookinstance_form', {title: 'Update Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
        });
        return;
    } else {
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thisBookInstance) => {
        res.redirect(thisBookInstance.url);
      });
    }
  }
];
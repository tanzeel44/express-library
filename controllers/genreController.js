const Genre = require('../models/genre');
const Book = require('../models/book');

const validator = require('express-validator');
const async = require('async');

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
	Genre.find()
		.populate('genre')
		.sort([['name', 'ascending']])
		.exec((err, list_genre) => {
			if (err) return next(err);
			res.render('genre_list', {title: 'Genre List', genre_list: list_genre});
		})
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
	async.parallel({
		genre: callback => {
			Genre.findById(req.params.id)
				.exec(callback);
		},
		genre_books: callback => {
			Book.find({'genre': req.params.id})
				.exec(callback);
		}
	}, (err, results) => {
		if (err) return next(err);
		if (results.genre == null) {
			const err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}
		res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
	});
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
	res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
	// Confirm that name field isn't empty
	validator.body('name', 'Genre name required!').trim().isLength({min: 1}),

	// Sanitize the name field
	validator.sanitizeBody('name').escape(),

	//Process request after validation and sanitization
	(req, res, next) => {
		// Extract validation errors from a request
		const errors = validator.validationResult(req);

		// Create a genre object with sanitized data
		const genre = new Genre(
			{name: req.body.name}
		);

		if (!errors.isEmpty()) {
			// Errors exist
			res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
			return;
		} else {
			// No errors
			Genre.findOne({name: req.body.name})
				.exec((err, found_genre) => {
					if (err) return next(err);
					if (found_genre) res.redirect(found_genre.url); // If genre with same name exists, redirect to it's page
					else {
						genre.save(err => {
							if (err) return next(err);
							res.redirect(genre.url);
						});
					}
				});
		}
	}
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
	async.parallel({
		genre: callback => {Genre.findById(req.params.id).exec(callback)},
		genre_books: callback => {Book.find({'genre': req.params.id}).exec(callback)}
	}, (err, results) => {
		if (err) return next(err);
		if (results.genre == null) res.redirect('/catalog/genres');
		res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
	});
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
	async.parallel({
		genre: callback => {Genre.findById(req.body.genreid).exec(callback)},
		genre_books: callback => {Book.find({'genre': req.body.genreid}).exec(callback)}
	}, (err, results) => {
		if (err) return next(err);
		if (results.genre_books.length > 0) {
			res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
			return;
		} else {
			Genre.findByIdAndRemove(req.body.genreid, err => {
				if (err) return next(err);
				res.redirect('/catalog/genres');
			});
		}
	});	
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
	Genre.findById(req.params.id, (err, genre) => {
		if (err) return next(err);
		if (genre == null) {
			const err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}
		res.render('genre_form', {title: 'Update Genre', genre: genre});
	});
};

// Handle Genre update on POST.
exports.genre_update_post = [
	validator.body('name', 'Genre name required').isLength({min: 1}).trim(),

	validator.sanitizeBody('name').escape(),

	(req, res, next) => {
		const errors = validator.validationResult(req);
		const genre = new Genre({
			name: req.body.name,
			_id: req.params.id
		});

		if (!errors.isEmpty) {
			res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
			return;
		} else {
			Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thisGenre) => {
				if (err) return next(err);
				res.redirect(thisGenre.url);
			}); 
		}
	}
];
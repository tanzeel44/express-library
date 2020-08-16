const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: {type: String, required: true, maxlength: 100},
  family_name: {type: String, require: true, maxlength: 100},
  date_of_birth: {type: Date},
  date_of_death: {type: Date},
});

// Virtual for author's full name (can get/set, but don't persist)
AuthorSchema
  .virtual('name')
  .get(() => {
    const fullname = '';
    if (this.first_name && this.family_name) {
      fullname = this.family_name + ', ' + this.first_name;
    }
    if (!this.first_name || !this.family_name) {
      fullname = '';
    }
    return fullname;
  });

// Virtual for author's lifespan
AuthorSchema
  .virtual('lifespan')
  .get(() => (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString());

// Virtual for author's URL
AuthorSchema
  .virtual('url')
  .get(() => `/catalog/author/${this._id}`);

module.exports = mongoose.model('Author', AuthorSchema);
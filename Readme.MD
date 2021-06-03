A project simulating a rudimentary inventory management system at a library.

The project is made using Express.js, with Pug as a templating engine, Bootstrap for styling, and MongoDB for persistent storage. 

The application supports all CRUD operations. 

Multiple instances of the same book can be created and stored separately, while each book is stored as a unique entity. Books cannot be deleted if instances of them exist. 

The total number of copies, and data on authors and genres is associated with each book instance. The status of each copy, e.g. whether it's in stock or on loan, is saved with each copy's entry.

Book entries can be viewed, created, edited, and deleted using the navigation menu on the left of the screen. 
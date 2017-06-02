const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const fs = require('file-system');
var morgan = require('morgan');


app.use(express.static('public'))
app.use(morgan('dev'));

var upload = multer({
  dest: 'uploads/', inMemory: true,
  putSingleFilesInArray: true
})

var port_number = process.env.PORT || 443;

function Image(image, name) {
  this.name = name;
  this.image = image;
}
var db;
//var mdbp = process.env.mdbp || 'C0ns0l4t10n';
var configDB = require('./config/database.js');

MongoClient.connect(configDB.url, (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(port_number, () => {
    console.log('listening on ' + port_number);
  })
})


function base64EncodeImage(imagePath) {
  return new Buffer(fs.readFileSync(imagePath)).toString("base64");
}

function saveImage(image, collectionName) {
  try {
    if (collectionName == undefined) throw "collection name is required";

    db.collection(collectionName).save(image, (err, result) => {
      if (err) return console.log(err);
      console.log("saved");
    });

  } catch (err) {
    throw err;
  }
}

app.get('/', function (req, res) {
  console.log("file request");
  res.sendFile(__dirname + '/public/index.html');
})

app.get('/public/:path', function (req, res) {
  console.log(path);
})

app.get('/api/collections', function (req, res) {

  var collectionsToReturn = [];
  return db.listCollections().toArray(function (err, collections) {
    // collInfos is an array of collection info objects that look like:
    // { name: 'test', options: {} }
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].name != "system.indexes") {
        collectionsToReturn.push(collections[i].name);
      }
    }
    res.send(collectionsToReturn);
  });
})

app.get('/api/images/:collectionName', function (req, res) {
  if (req.params.collectionName == undefined) throw "collection name required";
  try {
    let collectionName = req.params.collectionName;
    console.log("retrieving from " + collectionName);
    let cursor = db.collection(collectionName).find();
    let images = [];
    // Execute the each command, triggers for each document
    return cursor.each(function (err, item) {
      console.log(item);
      if (item != null) {
        images.push(item);
      }
      // If the item is null then the cursor is exhausted/empty and closed
      if (item == null) {        
        console.log("closing db");
        //db.close(); // you may not want to close the DB if you have more code....
        res.send(images);
      }
    });
  } catch (err) {
    throw err;
  }
})

app.post('/api/images', upload.any(), function (req, res) {
  try {
    for (var i = 0; i < req.files.length; i++) {
      var imageToSave = base64EncodeImage(req.files[i].path);
      var image = new Image(imageToSave, "images");
      saveImage(image, "images");
      res.redirect('/');
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
})

app.post("/api/image", upload.single('image'), function (req, res) {
  try {
    var base64image = base64EncodeImage(req.file.path);
    console.log(base64image);
    var image = new Image(req.body.name, base64image);

    saveImage(image, "images");
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
})



//upload images
//create thumbnails of images
//create images/:collectinName mongodb
//prompt if want image on front page
//return image ids
//for each image id
//create thumbnails/:collectionName mongodb 
//include image id in thumbnail object
//on collection/page load, get thumbnails for that collection
//on image selection, load main image

//eventually delete files in upload folder


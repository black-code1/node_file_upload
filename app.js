const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const multer = require('multer')
const methodOverride = require('method-override')

const app = express()

mongoose.connect("mongodb://localhost:27017/images", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})

const imageScheme = new mongoose.Schema({
  imgUrl : String
})

let Picture = mongoose.model('Picture', imageScheme)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(methodOverride('_method'))

app.get('/upload', (req, res) => {
  res.render('upload')
})


app.get('/', (req, res) => {
  Picture.find({})
         .then(images => {
                          res.render('index', {images : images})
                          })
})

// Set Image Storage
let storage = multer.diskStorage({
  destination: './public/uploads/images/',
  filename : (req, file, cb) => {
    cb(null, file.originalname)
  }
})

let upload = multer({
  storage : storage,
  fileFilter : (req, file, cb) => {
    checkFileType(file, cb)
  }
})

let checkFileType = (file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/
  const extname = fileTypes.test(path.extname(file.originalname).toLocaleLowerCase())

  if(extname){
    return cb(null, true)
  } else {
    cb('Error: Please images only.')
  }
}
app.post('/uploadsingle', upload.single('singleImage'), (req, res, next) => {
  const file = req.file;
  if(!file){
    return console.log('Please select an Image')
  }

  let url = file.path.replace('public', '')

  Picture
        .findOne({imgUrl : url})
        .then(img => {
                        if(img){
                          console.log('Duplicate Image. Try again!')
                          return res.redirect('/upload')
                        }

                        Picture
                              .create({imgUrl : url})
                              .then(img => {
                                            console.log('Image saved to DB.')
                                            res.redirect('/')              
                                            })
                      })
          .catch(error => 
                      {
                        return console.log('ERROR: '+error)
                      })
})

app.post('/uploadmultiple', upload.array('multipleImages'), (req, res, next) => {

  const files = req.files

  if(!files){
    return console.log('Please select images')
  }

  files.forEach(file => {
    let url = file.path.replace('public', '')

    Picture
          .findOne({imgUrl : url})
          .then(async img => {
                  if(img){

                    return console.log('Duplicate Image.')
                  }
                  await Picture.create({imgUrl : url})
                })
          .catch(error => {
            return console.log('ERROR: ' +error)
          })

  })
      res.redirect('/')
})
app.listen(3000, () => console.log("Server is started"))
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');


const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

// Map global prmise - get rid of warning
mongoose.Promise = global.Promise;

// Connect to mongoose
mongoose.connect('mongodb://easycode:easycode@ds155747.mlab.com:55747/easycode-test-chat', {
    useMongoClient: true
})
    .then(() => console.log('MongoDb connected'))
    .catch(error => console.log(error));

// Load User model
require('./models/User');
const User = mongoose.model('users');

io.on('connection', function(socket){

    socket.on('connection', function(){
        io.emit('connection', 'new user connection');
    });

    socket.on('verify', function (user) {
        User.findOne({email: user.email})
            .then( user => {
                if ( !user ){
                    let newUser = new User({
                        name: user.name,
                        email: user.email
                    });

                    newUser.save()
                        .then( user => {
                            io.emit('verify', user);
                        } )
                } else {
                    io.emit('verify', user);
                }
            })
    });

    socket.on('disconnect', function(){
        io.emit('disconnect', 'user disconnected');
    });
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
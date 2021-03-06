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

    socket.emit('connection');


    socket.on('verify', function (req, fn) {
        if ( !fn ) return io.emit('error', new Error('Не передана функция callback'));

        if ( !req || !req.email || !req.name ) {
            fn('please provide email and name', null);
        } else {
            User.findOne({email: req.email})
                .then( user => {
                    if ( !user ){
                        let newUser = new User({
                            name: req.name,
                            email: req.email,
                            verify: true,
                            isOnline: true
                        });

                        newUser.save()
                            .then( user => {
                                fn(null, user)
                            } )
                    } else {
                        user.isOnline = true;
                        user.verify = true;
                        user.save()
                            .then( user => {
                                fn(null, user)
                            });

                    }
                })
        }


    });

    socket.on('getUsers', function (fn) {

        User.find({})
            .then( users => {
                fn(users);
            })

    });

    socket.on('disconnect', function(user){
        io.emit('disconnect', 'user disconnected ');
    });

    socket.on('error', function(error){
        io.emit('error', error);
    });

    socket.on('chatMessage', function(msg, user){
        if ( !msg ) return io.emit('error', new Error('Нет сообщения'));

        if ( !user || !user.email || !user.name ) {
            return io.emit('error', new Error('Не передана информация о пользователе '));
        } else {
            User.findOne({email: user.email})
                .then( user => {
                    user.lastMessage = msg;
                    user.save()
                        .then( user => {
                            io.emit('chatMessage', msg, user);
                        });

                });
        }

    });


    socket.on('writeMessage', function(name){
        io.emit('writeMessage', name);
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
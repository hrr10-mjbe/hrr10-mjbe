'use strict';

import User from './user.model';
import Badge from '../badge/badge.model';
import Mongoose from 'mongoose';
import passport from 'passport';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function respondWith(res, statusCode) {
  statusCode = statusCode || 200;
  return function() {
    res.status(statusCode).end();
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.findAsync({}, '-salt -hashedPassword')
    .then(function(users) {
      res.status(200).json(users);
    })
    .catch(handleError(res));
};

/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.saveAsync()
    .spread(function(user) {
      var token = jwt.sign({
        _id: user._id
      }, config.secrets.session, {
        expiresInMinutes: 60 * 5
      });
      res.json({
        token: token
      });
    })
    .catch(validationError(res));
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;

  User.findByIdAsync(userId)
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(function(err) {
      return next(err);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemoveAsync(req.params.id)
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findByIdAsync(userId)
    .then(function(user) {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.saveAsync()
          .then(function() {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
};

//must be kept up to date with schema
var normalizeStudent = function(studentData) {
  studentData.badges = studentData.badges.map(function(badge) {
    console.log('normalizing');
    console.log(badge._id);
    console.log(Mongoose.Types.ObjectId(badge._id));
    return Mongoose.Types.ObjectId(badge._id);
  });
  console.log(studentData.badges);
  return studentData;
}

var normalizeTeacher = function(teacherData) {
  teacherData.students = teacherData.students.map(function(student) {
    return student._id;
  })
  return teacherData;
}

//data normalization in this and exports.me must be kept up to date
exports.update = function(req, res, next) {
  User.findByIdAsync(req.user._id)
    .then(function(user) {   
      user.studentData = normalizeStudent(req.body.studentData);     
      user.teacherData = normalizeTeacher(req.body.teacherData);
      return user.saveAsync()
        .then(function() {
          res.status(204).end();
        })
        .catch(validationError(res));
    });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findById(userId, '-salt -hashedPassword', function (err, user) {
  var opts = [
      { path: 'studentData.badges' }
  ]
  User.populate(user, {path: 'studentData.badges'}, function (err, user) {
    res.json(user);
  })

})

  /*User.findOne({
      _id: userId
    }, '-salt -hashedPassword')
    .populate('studenData.badges')
    .exec(function(err, user) { // don't ever give out the password or salt
      console.log(user);
      if (!user) {
        return res.status(401).end();
      }
      Badge.findOne({_id: user.studentData.badges[0]}).exec(function(err, badge) {
        console.log('found badge');
        console.log(badge);
      })
      res.json(user);
     /*if (user.type === 'student') {
        console.log('responding');
        denormalizeStudent(user.studentData, function(studentData) {
          user.studentData = studentData;
          //console.log(user.studentData);
          res.json(user);
        })
      } else if (user.type === 'teacher') {
        //TODO denormalize
        res.json(user);
      }*/
    /*})*/
    /*.catch(function(err) {
      return next(err);
    });*/
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

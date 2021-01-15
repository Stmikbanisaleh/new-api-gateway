require('dotenv').config();

const express = require('express');
const UserSchema = require('../model/msuserstandar');
const TokenSchemaStd = require('../model/msusertokenstd');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();
const salt = process.env.SALT;

/* GET users listing. */
router.post('/login', (req, res) => {
  let validate = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required()
  });
  let payload = {
    email: req.body.email,
    password: req.body.password,
  }

  Joi.validate(payload, validate, (error) => {
    bcrypt.hash(payload.password, 10, function (err, hash) {
      // Store hash in your password DB.
      UserSchema.sequelize.query('SELECT a.password,a.id,a.nama_lengkap, a.email, a.image, a.role_id, a.is_active,b.nama_rev,b.status,b.keterangan,golongan from msuserstandar a join msrev b on a.role_id = b.id where a.email = "' + req.body.email + '"',
        { replacements: { status: 'active', type: UserSchema.sequelize.QueryTypes.SELECT } })
        .then((user) => {
          if (user[0].length < 1) {
            res.status(401).json({
              message: 'Email Tidak Terdaftar !!!',
            });
          }
          else {
            const users = user[0];
            bcrypt.compare(payload.password, users[0].password, function (error, match) {
              // console.log()
              if (match) {
                const token = jwt.sign({ email: users[0].email, role: users[0].role_id, is_active: users[0].is_active }, process.env.JWTKU, {
                  expiresIn: "30d"
                });
                res.status(200).json({
                  message: 'Success',
                  status: 200,
                  user_id: users[0].id,
                  email: users[0].email,
                  role: users[0].role_id,
                  is_active: users[0].is_active,
                  name: users[0].name,
                  image: users[0].image,
                  nama_rev: users[0].nama_rev,
                  status_rev: users[0].status,
                  keterangan: users[0].keterangan,
                  golongan: users[0].golongan,
                  token: token,
                });
              } else {
                res.status(403).json({
                  error: 'Email atau Password Salah !!!',
                  status: 403
                });
              }

            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            error: err,
            status: 500
          });
        });
      if (error) {
        res.status(400).json({
          message: ' Required',
          error
        });
      }
    })
  });
});
//
router.post('/register', async function (req, res, next) {
  let validate = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    role_id: Joi.number().required()
  });

  let payload = {
    email: req.body.email,
    password: req.body.password,
    role_id: req.body.role_id,
  }

  Joi.validate(payload, validate, (error) => {
    try {
      const {
        email,
        password,
        role_id,
        is_active,
        no_handphone,
        fax,
        nama_lengkap,
        no_ktp,
        alamat,
        id_provinsi,
        id_kota,
        image,
        stakeholder

      } = req.body;

      bcrypt.hash(password, 10, async function (err, hash) {
        UserSchema.findAll({
          where: {
            email: req.body.email
          }
        }).then( async (data) => {
          if (data.length > 0) {
            res.status(401).json({
              status: 401,
              messages: 'Email Already Exist',
            })
          } else {
            const users = await UserSchema.create({
              email,
              password: hash,
              role_id,
              fax,
              no_ktp,
              nama_lengkap,
              alamat,
              id_kota,
              no_handphone,
              id_provinsi,
              is_active: req.body.is_active,
              image,
              stakeholder
            });
            if (users) {
              res.status(201).json({
                status: 200,
                messages: 'User berhasil ditambahkan',
                data: users,
              })
            }
          }
        })
      });
    }
    catch (error) {
      res.status(400).json({
        'status': 'ERROR',
        'messages': error.message,
        'data': {},
      })
    }
    if (error) {
      res.status(400).json({
        'status': 'Required',
        'messages': error.message,
        'data': {},
      })
    }
  }
  )
});

router.post('/getuserbyemail', (req, res) => {
  if(req.body.email){
    UserSchema.findAndCountAll({
      where: {
        email: req.body.email,
      },
    })
      .then((data) => {
        if (data.length < 1) {
          res.status(404).json({
            message: 'Not Found',
          });
        } else {
          res.status(200).json(data);
        }
        // });x
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          status: 500,
        });
      });
}else{
  res.status(404).json({
    status: 500,
    message: 'E-mail is empty',
    rows: 'null'
  });
}
});

router.post('/getuserbyid', (req, res) => {
  if(req.body.id){
    UserSchema.findAll({
      where: {
        id: req.body.id,
      },
    })
      .then((data) => {
        if (data.length < 1) {
          res.status(404).json({
            message: 'Not Found',
          });
        } else {
          res.status(200).json(data);
        }
        // });x
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          status: 500,
        });
      });
}else{
  res.status(500).json({
    status: 500,
    message: 'id is empty',
    rows: 'null'
  });
}
});

router.post('/getuserbyemail2', (req, res) => {
    UserSchema.findAll({
      where: {
        email: req.body.email,
      },
    })
      .then((data) => {
        if (data.length < 1) {
          res.status(404).json({
            message: 'Not Found',
          });
        } else {
          res.status(200).json({status:200});
        }
        // });x
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          status: 500,
        });
      });
});

router.post('/inserttoken', (req, res) => {
  TokenSchemaStd.create({
      email: req.body.email,
      token: req.body.token,
      date_created: req.body.date_created
    })
      .then((data) => {
        if (data.length < 1) {
          res.status(404).json({
            message: 'Not Found',
          });
        } else {
          res.status(200).json(data);
        }
        // });x
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
          status: 500,
        });
      });

});

router.post('/updatepassword', (req, res) => {
   try {
    bcrypt.hash(req.body.password, 10, async function (err, hash) {
      const payload = {
        password: hash,
      };
      UserSchema.update(payload, {
        where: {
          email: req.body.email,
        },
      })
        .then(() => res.status(200).json({
          status: 200,
          messages: 'Password berhasil diupdate',
        }));
    });

  } catch (e) {
    res.status(400).json({
      status: 'ERROR',
      messages: e,
      data: {},
    });
  }
});

router.post('/deletetoken', (req, res) => {
  try {
    TokenSchemaStd.destroy({
      where: {
        email: req.body.email
      }
    })
      .then((response) => {
        res.status(200).json(response);
      });
  } catch (error) {
    res.status(400).json({
      status: 500,
      messages: error,
    });
  }
});

router.post('/getuserstdbyemail', (req, res) => {
  TokenSchemaStd.findAll({
    where: {
      email: req.body.email,
    },
  })
    .then((data) => {
      if (data.length < 1) {
        res.status(404).json({
          message: 'Not Found',
        });
      } else {
        res.status(200).json(data);
      }
      // });x
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        status: 500,
      });
    });
});

router.post('/getuserstdbytoken', (req, res) => {
  TokenSchemaStd.findAll({
    where: {
      token: req.body.token,
    },
  })
    .then((data) => {
      if (data.length < 1) {
        res.status(404).json({
          message: 'Not Found',
        });
      } else {
        res.status(200).json(data);
      }
      // });x
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        status: 500,
      });
    });
});

router.post('/aktivasiuser', (req, res) => {
  try {
     const payload = {
        is_active: req.body.is_active,
     };
     UserSchema.update(payload, {
       where: {
         email: req.body.email,
       },
     })
       .then(() => res.status(200).json({
         status: 200,
         messages: 'User berhasil diaktifkan',
       }));
 } catch (e) {
   res.status(400).json({
     status: 'ERROR',
     messages: e,
     data: {},
   });
 }
});
module.exports = router;

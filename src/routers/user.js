const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const User = require('../models/user');
const auth = require('../middleware/auth')
const {
  sendWelcomeEmail,
  sendCancellationEmail,
} = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);   
    const token = await user.generateAuthToken();
    res.status(201).send({user, token});
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
   try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken()
    res.send({user, token});
  } catch (e) {
    res.status(400).send();
  }
});


router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

//We shouldn't need this for a task application
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id;

//   try {
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).send();
//     } else {
//       res.send(user);
//     }
//   } catch (e) {
//     res.status(500).send();
//   }
// });


// Code to refactor patch
/*router.patch('/users/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  } else {
  try {
    const user = await User.findById(req.params.id)
    updates.forEach((update) => user[update] = req.body[update])
    await user.save();
    
    if (!user) {
      return res.status(404).send();
    } else {
      res.send(user);
    }
  } catch (e) {
    res.status(500).send();
  }
};
});*/

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  } else {
    try {
      updates.forEach(update => (req.user[update] = req.body[update]));
      await req.user.save();
      res.send(req.user);      
    } catch (e) {
      res.status(500).send();
    }
  }
});


// Will refactor code
/*router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id); //Without auth
    if (!user) {
      return res.status(404).send();
    } else {
      res.send(user);
    }
  } catch (e) {
    res.status(500).send();
  }*/

router.delete('/users/me', auth, async (req, res) => {
  try {
    
    // With auth
   await req.user.remove()
   sendCancellationEmail(req.user.email, req.user.name);
     res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  //dest: 'avatars', /* remove dest to get access to the req.file.buffer*/
  limits: {
   fileSize: 1000000
 },
 fileFilter(req, file, cb) {
   !file.originalname.match(/\.(jpg|jpeg|png)$/)
     ? cb(new Error('Please upload an image with a jpg, jpeg, or png extension'))
     : cb(undefined, true);
 }
});


router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {  
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    //req.user.avatar = req.file.buffer
    req.user.avatar = buffer
    await req.user.save()
    res.send();
},
 (error, req, res, next) => {
    res.status(400).send({
      error: error.message
    });  
});

router.delete('/users/me/avatar', auth, async(req, res) => {
   req.user.avatar = undefined;
   await req.user.save()
   res.send()
})


router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) {
       throw new Error()
     }
     else {
          res.set('Content-Type', 'image/jpg')
          res.send(user.avatar)
     }
  } catch (e) {
    res.status(404).send(e);
  }
});

module.exports = router;
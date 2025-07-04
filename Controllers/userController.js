const User = require('./../Models/UserModel');
const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utility/catchAsync');
const AppError = require('./../utility/appError');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/image/user');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadUserPhoto = upload.single('image');

exports.resizUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/image/user/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUser = catchAsync(async (req, res, next) => {
  const user = await User.find();

  res.status(200).json({
    status: 'Success',
    total: user.length,
    data: {
      user
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('The user with that id was not found!', 404));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      user
    }
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmpassword, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    confirmpassword,
    role
  });

  res.status(201).json({
    status: 'Success',
    data: {
      user
    }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('No User found by that ID', 404));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      user
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No User found by that ID', 404));
  }

  res.status(200).json({
    status: 'Success',
    message: 'User deleted'
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.confirmpassword) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.image = req.file.filename;

  const updateduser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'Success',
    data: {
      user: updateduser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) Find user and set isActive to false
  await User.findByIdAndUpdate(req.user.id, { isActive: false });
  // 2) Send response
  res.status(204).json({
    status: 'Success',
    data: null
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id; // Overwrite the id with the logged in user id
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('The user with that id was not found!', 404));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      user
    }
  });
});


const Ivoire = require('ivoire-weighted-choice');
const debug = require('debug')('winis:spin-to-win');

const spinOptions = [
  'diamond', 'present', 'double_spin', '100_winis', 'empty',
  'present_2', '50_winis', 'double_scratch', 'scratch', 'spin',
];

const spinWeights = [
  7, 1, 5, 30, 3,
  1, 33, 5, 10, 5,
];

module.exports = function (SpinToWin) {
  SpinToWin.calculateSpin = () => {
    const ivoire = new Ivoire();
    return ivoire.weighted_choice(spinOptions, spinWeights);
  };

  SpinToWin.handlePrize = (user, prize) => {
    debug(`Handle prize ${prize}`);

    const attributes = {};

    switch (prize) {
      case 'diamond':
        attributes.diamonds = user.diamonds + 1;
        break;
      case 'present':
      case 'present_2':
        debug('Need to handle present');
        break;
      case 'double_spin':
        attributes.spins = user.spins + 2;
        break;
      case '100_winis':
        attributes.winis = user.winis + 100;
        break;
      case 'double_diamond':
        attributes.diamonds = user.diamonds + 2;
        break;
      case '50_winis':
        attributes.winis = user.winis + 50;
        break;
      case 'double_scratch':
        attributes.scratches = user.scratches + 2;
        break;
      case 'scratch':
        attributes.scratches = user.scratches + 1;
        break;
      case 'spin':
        attributes.spins = user.spins + 1;
        break;
      default:
        break;
    }

    return attributes;
  };

  SpinToWin.spin = async (options) => {
    const spinResult = SpinToWin.calculateSpin();
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = SpinToWin.app.models.user;

    const user = await UserModel.findById(userId);
    if (user.spins === 0) {
      const error = new Error('User has no more spins');
      error.status = 409;
      throw error;
    }

    const spin = await SpinToWin.create({
      spinResult,
      userId: user.id,
    });

    const userAttributes = SpinToWin.handlePrize(user, spinResult);
    if (typeof userAttributes.spins === 'undefined') userAttributes.spins = user.spins;
    userAttributes.spins--;
    const updatedUser = await user.updateAttributes(userAttributes);

    return {
      spinResult,
      spin,
      user: updatedUser,
    };
  };
};

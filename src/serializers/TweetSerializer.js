const BaseSerializer = require('./BaseSerializer');

class TweetSerializer extends BaseSerializer {
  constructor(model) {
    const serializedModel = model ? model.toJSON() : null;

    delete serializedModel?.User?.password;
    delete serializedModel?.User?.active;
    delete serializedModel?.User?.role;
    delete serializedModel?.userId;
    super('success', serializedModel);
  }
}

module.exports = TweetSerializer;

const BaseSerializer = require('./BaseSerializer');

class TweetsSerializer extends BaseSerializer {
  constructor(models, paginationInfo) {
    const serializedModels = models.map((model) => {
      const serializedModel = model.toJSON();
      delete serializedModel?.User?.password;
      delete serializedModel?.User?.active;
      delete serializedModel?.User?.role;
      delete serializedModel?.userId;
      return serializedModel;
    });
    super('success', serializedModels, paginationInfo);
  }
}

module.exports = TweetsSerializer;

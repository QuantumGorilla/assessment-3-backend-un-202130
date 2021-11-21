const BaseSerializer = require('./BaseSerializer');

class UsersSerializer extends BaseSerializer {
  constructor(models, paginationInfo) {
    const serializedModels = models.map((model) => {
      const serializedModel = model.toJSON();

      delete serializedModel?.password;
      delete serializedModel?.active;

      return serializedModel;
    });

    super('success', serializedModels, paginationInfo);
  }
}

module.exports = UsersSerializer;

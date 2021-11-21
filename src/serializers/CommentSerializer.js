const BaseSerializer = require('./BaseSerializer');

class CommentSerializer extends BaseSerializer {
  constructor(model) {
    const serializedModel = model ? model.toJSON() : null;

    super('success', serializedModel);
  }
}

module.exports = CommentSerializer;
